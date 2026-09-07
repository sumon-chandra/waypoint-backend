import { z } from "zod";

export const createShipmentSchema = z.object({
	body: z.object({
		receiverName: z.string().min(2, "Receiver name must be at least 2 characters"),
		receiverPhone: z.string().regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi phone number"),
		weightKg: z.preprocess((val) => parseFloat(String(val)), z.number().positive("Weight must be positive")),
	}),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>["body"];
