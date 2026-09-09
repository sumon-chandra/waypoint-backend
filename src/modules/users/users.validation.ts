import { z } from "zod";

export const updateUserStatusSchema = z.object({
	body: z.object({
		status: z.enum(["ACTIVE", "INACTIVE", "BANNED"] as const, {
			message: "Status must be one of: ACTIVE, INACTIVE, BANNED",
		}),
		banReason: z.string().optional(),
	}),
});

export const updateUserDataSchema = z.object({
	body: z
		.object({
			name: z.string().min(2, "Name must be at least 2 characters").optional(),
			avatar: z.string().optional(),
			displayUsername: z.string().optional(),
			username: z
				.string()
				.min(3, "Username must be at least 3 characters")
				.regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
				.optional(),
			password: z.string().min(6, "Password must be at least 6 characters").optional(),
		})
		.refine(
			(data) => {
				return Object.keys(data).length > 0;
			},
			{ message: "At least one field (name, avatar, displayUsername, username, or password) must be provided" }
		),
});

export const userIdParamSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid user ID format"),
	}),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>["body"];
export type UpdateUserDataInput = z.infer<typeof updateUserDataSchema>["body"];
