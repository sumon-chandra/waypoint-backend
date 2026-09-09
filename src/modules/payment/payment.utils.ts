import type Stripe from "stripe";
import { prisma } from "../../lib/prisma";

/**
 * Handles completed Stripe checkout sessions.
 * Updates both the Payment and Shipment records to PAID.
 */
export const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
	const sessionId = session.id;
	const shipmentId = session.metadata?.shipmentId;
	const paymentId = session.metadata?.paymentId;
	const paymentIntentId =
		typeof session.payment_intent === "string"
			? session.payment_intent
			: session.payment_intent?.id;

	const payment = await prisma.payment.findFirst({
		where: {
			OR: [
				...(sessionId ? [{ stripeSessionId: sessionId }] : []),
				...(paymentId ? [{ id: paymentId }] : []),
				...(shipmentId ? [{ shipmentId: shipmentId }] : []),
			],
		},
	});

	if (!payment) {
		console.warn(`[Stripe Webhook] Payment record not found for checkout session: ${sessionId}`);
		return;
	}

	await prisma.$transaction([
		prisma.payment.update({
			where: { id: payment.id },
			data: {
				status: "PAID",
				...(paymentIntentId && { stripePaymentIntentId: paymentIntentId }),
				...(sessionId && { stripeSessionId: sessionId }),
			},
		}),
		prisma.shipment.update({
			where: { id: payment.shipmentId },
			data: {
				paymentStatus: "PAID",
			},
		}),
	]);

	console.log(`[Stripe Webhook] Payment & Shipment ${payment.shipmentId} marked as PAID`);
};

/**
 * Handles expired Stripe checkout sessions.
 * Sets the Payment status to EXPIRED.
 */
export const handleCheckoutExpired = async (session: Stripe.Checkout.Session) => {
	const sessionId = session.id;
	const shipmentId = session.metadata?.shipmentId;
	const paymentId = session.metadata?.paymentId;

	const payment = await prisma.payment.findFirst({
		where: {
			OR: [
				...(sessionId ? [{ stripeSessionId: sessionId }] : []),
				...(paymentId ? [{ id: paymentId }] : []),
				...(shipmentId ? [{ shipmentId: shipmentId }] : []),
			],
		},
	});

	if (!payment) {
		console.warn(`[Stripe Webhook] Payment record not found for expired session: ${sessionId}`);
		return;
	}

	await prisma.payment.update({
		where: { id: payment.id },
		data: {
			status: "EXPIRED",
		},
	});

	console.log(`[Stripe Webhook] Payment ${payment.id} marked as EXPIRED`);
};

/**
 * Handles failed Stripe payment intents.
 * Sets the Payment status to FAILED.
 */
export const handlePaymentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
	const paymentIntentId = paymentIntent.id;
	const shipmentId = paymentIntent.metadata?.shipmentId;
	const paymentId = paymentIntent.metadata?.paymentId;

	const payment = await prisma.payment.findFirst({
		where: {
			OR: [
				...(paymentIntentId ? [{ stripePaymentIntentId: paymentIntentId }] : []),
				...(paymentId ? [{ id: paymentId }] : []),
				...(shipmentId ? [{ shipmentId: shipmentId }] : []),
			],
		},
	});

	if (!payment) {
		console.warn(`[Stripe Webhook] Payment record not found for failed intent: ${paymentIntentId}`);
		return;
	}

	await prisma.payment.update({
		where: { id: payment.id },
		data: {
			status: "FAILED",
		},
	});

	console.log(`[Stripe Webhook] Payment ${payment.id} marked as FAILED`);
};

export const paymentUtils = {
	handleCheckoutCompleted,
	handleCheckoutExpired,
	handlePaymentFailed,
};
