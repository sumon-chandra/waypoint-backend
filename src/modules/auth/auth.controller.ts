import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AuthService } from "./auth.service";
import { asyncHandler } from "../../utils/async-handler";
import { sendResponse } from "../../utils/send-response";
import AppError from "../../utils/app-error";
import envConfigs from "../../configs/env-configs";

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {

	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: envConfigs.node_env === "production",
		sameSite: envConfigs.node_env === "production" ? "none" : "lax",
		maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
	});
	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: envConfigs.node_env === "production",
		sameSite: envConfigs.node_env === "production" ? "none" : "lax",
		maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
	});
};

const register = asyncHandler(async (req: Request, res: Response) => {
	const result = await AuthService.registerUser(req.body);
	const { refreshToken, accessToken, user } = result;

	setAuthCookies(res, accessToken, refreshToken);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "User registered successfully.",
		data: {
			user,
			accessToken,
		},
	});
});

const login = asyncHandler(async (req: Request, res: Response) => {
	const result = await AuthService.loginUser(req.body);
	const { refreshToken, accessToken, user } = result;

	setAuthCookies(res, accessToken, refreshToken);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Login successful.",
		data: {
			user,
			accessToken,
		},
	});
});

const refreshToken = asyncHandler(async (req: Request, res: Response) => {
	const token = req.cookies?.refreshToken || req.body?.refreshToken;

	if (!token) {
		throw AppError.unauthorized("Refresh token is required.");
	}

	const result = await AuthService.refreshToken(token);

	res.cookie("accessToken", result.accessToken, {
		httpOnly: true,
		secure: envConfigs.node_env === "production",
		sameSite: envConfigs.node_env === "production" ? "none" : "lax",
		maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
	});

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Access token refreshed successfully.",
		data: result,
	});
});

const logout = asyncHandler(async (req: Request, res: Response) => {
	res.clearCookie("refreshToken", {
		httpOnly: true,
		secure: envConfigs.node_env === "production",
		sameSite: envConfigs.node_env === "production" ? "none" : "lax",
	});
	res.clearCookie("accessToken", {
		httpOnly: true,
		secure: envConfigs.node_env === "production",
		sameSite: envConfigs.node_env === "production" ? "none" : "lax",
	});

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Logged out successfully.",
		data: null,
	});
});

const googleAuth = asyncHandler(async (req: Request, res: Response) => {
	const result = await AuthService.googleAuth(req.body);
	const { refreshToken, accessToken, user } = result;

	setAuthCookies(res, accessToken, refreshToken);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Google authentication successful.",
		data: {
			user,
			accessToken,
		},
	});
});

const googleRedirect = asyncHandler(async (req: Request, res: Response) => {
	const url = AuthService.getGoogleAuthUrl();
	res.redirect(url);
});

const googleCallback = asyncHandler(async (req: Request, res: Response) => {
	const code = req.query.code as string;

	if (!code) {
		throw AppError.badRequest("Authorization code is missing from Google callback.");
	}

	const result = await AuthService.googleAuth({ code });
	setAuthCookies(res, result.accessToken, result.refreshToken);

	// Redirect back to frontend application with accessToken
	const redirectUrl = new URL(`${envConfigs.frontend_url}/auth/callback`);
	redirectUrl.searchParams.set("token", result.accessToken);

	res.redirect(redirectUrl.toString());
});

const getMe = asyncHandler(async (req: Request, res: Response) => {
	const result = await AuthService.getMe(req.user!.id);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User profile retrieved successfully.",
		data: result,
	});
});

export const AuthController = {
	register,
	login,
	refreshToken,
	logout,
	googleAuth,
	googleRedirect,
	googleCallback,
	getMe,
};
