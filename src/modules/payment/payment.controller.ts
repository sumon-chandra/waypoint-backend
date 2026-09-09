import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import * as PaymentService from "./payment.service";
import { sendResponse } from "../../utils/send-response";
import httpStatus from "http-status";
import AppError from "../../utils/app-error";

export const createCheckoutSession = asyncHandler(async (req: Request, res: Response) => {
	const customerId = req.user!.id;
	const { shipmentId } = req.body;

	const session = await PaymentService.createCheckoutSession(shipmentId, customerId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Checkout session created successfully",
		data: session,
	});
});

export const handleStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
	const signature = req.headers["stripe-signature"];

	if (!signature || typeof signature !== "string") {
		throw AppError.badRequest("Stripe signature header is missing or invalid");
	}

	const payload = Buffer.isBuffer(req.body)
		? req.body
		: Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body));

	await PaymentService.handleStripeWebhook(payload, signature);

	res.status(httpStatus.OK).json({ received: true });
});

// Backward compatibility alias
export const createPaymentIntent = createCheckoutSession;
