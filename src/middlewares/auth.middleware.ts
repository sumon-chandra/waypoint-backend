import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth, type Session, type User } from "../lib/auth";
import AppError from "../utils/app-error";
import { asyncHandler } from "../utils/async-handler";
import { UserRole } from "../../types";

declare global {
	namespace Express {
		interface Request {
			user?: User;
			session?: Session;
		}
	}
}

/**
 * Middleware to authenticate requests using Better Auth session headers / cookies.
 * Attaches `req.user` and `req.session` if valid, otherwise throws 401 Unauthorized.
 */
export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});

	if (!session || !session.user) {
		throw AppError.unauthorized("Authentication required. Please sign in.");
	}

	req.user = session.user;
	req.session = session.session;
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
