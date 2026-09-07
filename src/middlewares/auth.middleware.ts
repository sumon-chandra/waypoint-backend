import type { NextFunction, Request, Response } from "express";
import { verifyToken, type JwtPayload } from "../lib/jwt";
import envConfigs from "../configs/env-configs";
import { prisma } from "../lib/prisma";
import AppError from "../utils/app-error";
import { asyncHandler } from "../utils/async-handler";
import { UserRole } from "../../types";

export interface AuthUser {
	id: string;
	email: string;
	role: UserRole;
	name?: string;
}

declare global {
	namespace Express {
		interface Request {
			user?: AuthUser;
		}
	}
}

/**
 * Middleware to authenticate requests using JWT Bearer token or accessToken cookie.
 * Attaches `req.user` if valid, otherwise throws 401 Unauthorized.
 */
export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
	let token: string | undefined;

	const authHeader = req.headers.authorization;
	if (authHeader && authHeader.startsWith("Bearer ")) {
		token = authHeader.split(" ")[1];
	} else if (req.cookies?.accessToken) {
		token = req.cookies.accessToken;
	}

	if (!token) {
		throw AppError.unauthorized("Authentication required. Please sign in.");
	}

	let decoded: JwtPayload;
	try {
		decoded = verifyToken<JwtPayload>(token, envConfigs.jwt_access_secret);
	} catch (error: any) {
		if (error.name === "TokenExpiredError") {
			throw AppError.unauthorized("Access token has expired. Please refresh your token.");
		}
		throw AppError.unauthorized("Invalid access token.");
	}

	const user = await prisma.user.findUnique({
		where: { id: decoded.id },
		select: {
			id: true,
			email: true,
			name: true,
			role: true,
			status: true,
			banned: true,
		},
	});

	if (!user) {
		throw AppError.unauthorized("User belonging to this token no longer exists.");
	}

	if (user.banned || user.status === "BANNED" || user.status === "INACTIVE") {
		throw AppError.forbidden("Your account is deactivated or suspended.");
	}

	req.user = {
		id: user.id,
		email: user.email,
		role: user.role as UserRole,
		name: user.name,
	};

	next();
});

/**
 * Route-level RBAC middleware enforcing allowed user roles.
 * Must be applied after `protect` (or use `authGuard`).
 */
export const requireRole = (...roles: UserRole[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			throw AppError.unauthorized("Authentication required. Please sign in.");
		}

		const userRole = req.user.role as UserRole;
		if (!roles.includes(userRole)) {
			throw AppError.forbidden("Access forbidden: You do not have permission to perform this action.");
		}

		next();
	};
};

/**
 * Composite middleware running both `protect` and optional `requireRole`.
 */
export const authGuard = (...roles: UserRole[]) => {
	if (roles.length === 0) {
		return [protect];
	}
	return [protect, requireRole(...roles)];
};
