import jwt, { type JwtPayload as DefaultJwtPayload, type Secret, type SignOptions } from "jsonwebtoken";
import { type UserRole } from "../../types";

export interface JwtPayload extends DefaultJwtPayload {
	id: string;
	email: string;
	role: UserRole;
}

/**
 * Generate a signed JWT token
 */
export const generateToken = (
	payload: Record<string, unknown>,
	secret: Secret,
	expiresIn: string | number
): string => {
	const options: SignOptions = {
		expiresIn: expiresIn as SignOptions["expiresIn"],
	};

	return jwt.sign(payload, secret, options);
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = <T extends object = JwtPayload>(token: string, secret: Secret): T => {
	return jwt.verify(token, secret) as T;
};
