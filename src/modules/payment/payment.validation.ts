import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
	body: z.object({
		shipmentId: z.string().min(1, "Shipment ID is required"),
	}),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>["body"];

// Alias for backward compatibility
export const createPaymentIntentSchema = createCheckoutSessionSchema;
export type CreatePaymentIntentInput = CreateCheckoutSessionInput;
