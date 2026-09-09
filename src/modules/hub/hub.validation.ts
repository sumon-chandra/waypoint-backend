import { z } from "zod";

export const createHubSchema = z.object({
	body: z.object({
		name: z.string().min(2, "Hub name must be at least 2 characters"),
		address: z.string().min(5, "Hub address must be at least 5 characters"),
	}),
});

export const updateHubSchema = z.object({
	body: z.object({
		name: z.string().min(2, "Hub name must be at least 2 characters").optional(),
		address: z.string().min(5, "Hub address must be at least 5 characters").optional(),
	}),
});

export const hubIdParamSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid Hub ID format"),
	}),
});

export type CreateHubInput = z.infer<typeof createHubSchema>["body"];
export type UpdateHubInput = z.infer<typeof updateHubSchema>["body"];
