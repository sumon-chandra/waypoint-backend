import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../../lib/prisma";
import envConfigs from "../../configs/env-configs";
import { generateToken, verifyToken, type JwtPayload } from "../../lib/jwt";
import AppError from "../../utils/app-error";
import { UserRole } from "../../../types";
import {
	type RegisterInput,
	type LoginInput,
	type GoogleAuthInput,
} from "./auth.validation";
import {
	type SanitizedUser,
	type AuthTokens,
	type GoogleUserInfo,
} from "./auth.interface";

const sanitizeUser = (user: any): SanitizedUser => {
	const { password, ...sanitized } = user;
	return sanitized;
};

const createAuthTokens = (user: { id: string; email: string; role: string }): AuthTokens => {
	const jwtPayload: JwtPayload = {
		id: user.id,
		email: user.email,
		role: user.role as UserRole,
	};

	const accessToken = generateToken(
		jwtPayload,
		envConfigs.jwt_access_secret,
		envConfigs.jwt_access_expires_in
	);

	const refreshToken = generateToken(
		jwtPayload,
		envConfigs.jwt_refresh_secret,
		envConfigs.jwt_refresh_expires_in
	);

	return { accessToken, refreshToken };
};

const getOAuthClient = () => {
	return new OAuth2Client(
		envConfigs.google_client_id,
		envConfigs.google_client_secret,
		envConfigs.google_callback_url
	);
};

/**
 * Register a new user with CUSTOMER or COURIER role
 */
const registerUser = async (payload: RegisterInput) => {
	const existingUser = await prisma.user.findUnique({
		where: { email: payload.email.toLowerCase() },
	});

	if (existingUser) {
		throw AppError.badRequest("A user with this email address already exists.");
	}

	const hashedPassword = await bcrypt.hash(payload.password, 10);

	const user = await prisma.user.create({
		data: {
			name: payload.name,
			email: payload.email.toLowerCase(),
			password: hashedPassword,
			role: payload.role || UserRole.CUSTOMER,
			emailVerified: false,
		},
	});

	const tokens = createAuthTokens(user);

	return {
		user: sanitizeUser(user),
		...tokens,
	};
};

/**
 * Sign in user with email and password
 */
const loginUser = async (payload: LoginInput) => {
	const user = await prisma.user.findUnique({
		where: { email: payload.email.toLowerCase() },
	});

	if (!user) {
		throw AppError.unauthorized("Invalid email or password.");
	}

	if (!user.password) {
		throw AppError.badRequest(
			"This account was registered using Google OAuth. Please sign in with Google."
		);
	}

	if (user.banned || user.status === "BANNED" || user.status === "INACTIVE") {
		throw AppError.forbidden("Your account is deactivated or suspended.");
	}

	const isMatch = await bcrypt.compare(payload.password, user.password);
	if (!isMatch) {
		throw AppError.unauthorized("Invalid email or password.");
	}

	const tokens = createAuthTokens(user);

	return {
		user: sanitizeUser(user),
		...tokens,
	};
};

/**
 * Refresh expired access token using refresh token
 */
const refreshToken = async (token: string) => {
	let decoded: JwtPayload;

	try {
		decoded = verifyToken<JwtPayload>(token, envConfigs.jwt_refresh_secret);
	} catch (err: any) {
		if (err.name === "TokenExpiredError") {
			throw AppError.unauthorized("Refresh token has expired. Please log in again.");
		}
		throw AppError.unauthorized("Invalid refresh token.");
	}

	const user = await prisma.user.findUnique({
		where: { id: decoded.id },
	});

	if (!user) {
		throw AppError.unauthorized("User does not exist.");
	}

	if (user.banned || user.status === "BANNED" || user.status === "INACTIVE") {
		throw AppError.forbidden("Your account is deactivated or suspended.");
	}

	const jwtPayload: JwtPayload = {
		id: user.id,
		email: user.email,
		role: user.role as UserRole,
	};

	const accessToken = generateToken(
		jwtPayload,
		envConfigs.jwt_access_secret,
		envConfigs.jwt_access_expires_in
	);

	return { accessToken };
};

/**
 * Generate Google OAuth consent screen redirect URL
 */
const getGoogleAuthUrl = () => {
	const client = getOAuthClient();
	return client.generateAuthUrl({
		access_type: "offline",
		prompt: "consent",
		scope: [
			"https://www.googleapis.com/auth/userinfo.profile",
			"https://www.googleapis.com/auth/userinfo.email",
		],
	});
};

/**
 * Verify Google authentication either via ID token (from client SDK) or code (OAuth callback)
 */
const googleAuth = async (payload: GoogleAuthInput) => {
	let googleUser: GoogleUserInfo;

	if (payload.idToken) {
		const client = getOAuthClient();
		const ticket = await client.verifyIdToken({
			idToken: payload.idToken,
			audience: envConfigs.google_client_id,
		});
		const gPayload = ticket.getPayload();

		if (!gPayload || !gPayload.email) {
			throw AppError.badRequest("Invalid Google token.");
		}

		googleUser = {
			id: gPayload.sub,
			email: gPayload.email.toLowerCase(),
			name: gPayload.name || gPayload.email.split("@")[0],
			picture: gPayload.picture,
			emailVerified: gPayload.email_verified,
		};
	} else if (payload.code) {
		const client = getOAuthClient();
		const { tokens } = await client.getToken(payload.code);
		client.setCredentials(tokens);

		if (!tokens.id_token) {
			throw AppError.badRequest("Failed to retrieve ID token from Google.");
		}

		const ticket = await client.verifyIdToken({
			idToken: tokens.id_token,
			audience: envConfigs.google_client_id,
		});
		const gPayload = ticket.getPayload();

		if (!gPayload || !gPayload.email) {
			throw AppError.badRequest("Invalid Google token payload.");
		}

		googleUser = {
			id: gPayload.sub,
			email: gPayload.email.toLowerCase(),
			name: gPayload.name || gPayload.email.split("@")[0],
			picture: gPayload.picture,
			emailVerified: gPayload.email_verified,
		};
	} else {
		throw AppError.badRequest("Either Google idToken or authorization code must be provided.");
	}

	// Find existing user by googleId or email
	let user = await prisma.user.findFirst({
		where: {
			OR: [
				{ googleId: googleUser.id },
				{ email: googleUser.email },
			],
		},
	});

	if (user) {
		if (user.banned || user.status === "BANNED" || user.status === "INACTIVE") {
			throw AppError.forbidden("Your account is deactivated or suspended.");
		}

		user = await prisma.user.update({
			where: { id: user.id },
			data: {
				googleId: user.googleId || googleUser.id,
				emailVerified: true,
				avatar: user.avatar || googleUser.picture,
			},
		});
	} else {
		user = await prisma.user.create({
			data: {
				name: googleUser.name,
				email: googleUser.email,
				googleId: googleUser.id,
				avatar: googleUser.picture,
				emailVerified: true,
				role: UserRole.CUSTOMER,
			},
		});
	}

	const tokens = createAuthTokens(user);

	console.log("tokens", tokens);

	return {
		user: sanitizeUser(user),
		...tokens,
	};
};

/**
 * Retrieve authenticated user profile
 */
const getMe = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
	});

	if (!user) {
		throw AppError.notFound("User not found.");
	}

	return sanitizeUser(user);
};

export const AuthService = {
	registerUser,
	loginUser,
	refreshToken,
	getGoogleAuthUrl,
	googleAuth,
	getMe,
};
