import { z } from "zod";

export const registerValidationSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters long"),
	email: z.string().email("Invalid email address"),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters")
		// .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
		// .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
		// .regex(/[0-9]/, "Password must contain at least 1 number")
		// .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character"),
});

export const loginValidationSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

export const refreshTokenValidationSchema = z.object({
	refreshToken: z.string().optional(),
});

export const googleAuthValidationSchema = z
	.object({
		idToken: z.string().optional(),
		code: z.string().optional(),
	})
	.refine((data) => !!(data.idToken || data.code), {
		message: "Either idToken or code is required for Google authentication",
	});

export type RegisterInput = z.infer<typeof registerValidationSchema>;
export type LoginInput = z.infer<typeof loginValidationSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenValidationSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthValidationSchema>;