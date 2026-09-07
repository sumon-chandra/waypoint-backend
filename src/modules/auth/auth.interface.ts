import { type UserRole } from "../../../types";

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

export interface SanitizedUser {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	avatar: string | null;
	image: string | null;
	emailVerified: boolean;
	status: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface AuthResponse {
	user: SanitizedUser;
	accessToken: string;
}

export interface GoogleUserInfo {
	id: string;
	email: string;
	name: string;
	picture?: string;
	emailVerified?: boolean;
}
