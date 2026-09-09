import type Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import AppError from "../../utils/app-error";
import envConfigs from "../../configs/env-configs";
import { paymentUtils } from "./payment.utils";
import type { CreateCheckoutSessionResponse } from "./payment.interface";

/**
 * Creates a Stripe Checkout Session for a shipment payment.
 * Handles customer creation/lookup in Stripe, upserts the Payment record with PENDING status,
 * and returns the hosted Stripe checkout payment link.
 */
export const createCheckoutSession = async (
	shipmentId: string,
	customerId: string
): Promise<CreateCheckoutSessionResponse> => {
	const shipment = await prisma.shipment.findUnique({
		where: { id: shipmentId },
		include: { customer: true },
	});

	if (!shipment) {
		throw AppError.notFound("Shipment not found");
	}

	if (shipment.customerId !== customerId) {
		throw AppError.forbidden("You are not authorized to pay for this shipment");
	}

	if (shipment.paymentStatus === "PAID") {
		throw AppError.badRequest("Shipment is already paid");
	}

	const stripeSecret = envConfigs.stripe?.secret_key || envConfigs.stripe_secret_key;
	if (!stripeSecret || stripeSecret === "sk_test_placeholder") {
		throw AppError.internal("Stripe secret key is not properly configured in environment variables");
	}

	// Calculate delivery cost (Base fee: $10.00 + $2.00 per kg) converted to cents
	const baseFee = 10;
	const perKgRate = 2;
	const totalAmount = baseFee + shipment.weightKg * perKgRate;
	const amountInCents = Math.round(totalAmount * 100);

	// Ensure customer exists in Stripe and persist customer id
	let stripeCustomerId = shipment.customer.stripeCustomerId;
	if (!stripeCustomerId) {
		const customer = await stripe.customers.create({
			email: shipment.customer.email,
			name: shipment.customer.name,
			metadata: {
				userId: customerId,
			},
		});
		stripeCustomerId = customer.id;

		await prisma.user.update({
			where: { id: customerId },
			data: { stripeCustomerId },
		});
	}

	// Upsert the dedicated Payment record
	const payment = await prisma.payment.upsert({
		where: {
			shipmentId: shipment.id,
		},
		create: {
			shipmentId: shipment.id,
			customerId: customerId,
			amount: totalAmount,
			currency: "usd",
			status: "PENDING",
			stripeCustomerId: stripeCustomerId,
			paymentMethod: "card",
		},
		update: {
			amount: totalAmount,
			currency: "usd",
			status: "PENDING",
			stripeCustomerId: stripeCustomerId,
		},
	});

	// Create Stripe Checkout Session
	const session = await stripe.checkout.sessions.create({
		customer: stripeCustomerId,
		payment_method_types: ["card"],
		mode: "payment",
		line_items: [
			{
				price_data: {
					currency: "usd",
					product_data: {
						name: `Delivery Fee - Tracking #${shipment.trackingNumber}`,
						description: `Shipment weight: ${shipment.weightKg}kg | Receiver: ${shipment.receiverName}`,
					},
					unit_amount: amountInCents,
				},
				quantity: 1,
			},
		],
		metadata: {
			paymentId: payment.id,
			shipmentId: shipment.id,
			customerId: customerId,
		},
		payment_intent_data: {
			metadata: {
				paymentId: payment.id,
				shipmentId: shipment.id,
				customerId: customerId,
			},
		},
		success_url: `${envConfigs.frontend_url}/payment/success?session_id={CHECKOUT_SESSION_ID}&shipment_id=${shipment.id}`,
		cancel_url: `${envConfigs.frontend_url}/payment/cancel?shipment_id=${shipment.id}`,
	});

	// Save the session ID to the Payment record
	await prisma.payment.update({
		where: { id: payment.id },
		data: {
			stripeSessionId: session.id,
			stripePaymentIntentId:
				typeof session.payment_intent === "string" ? session.payment_intent : undefined,
		},
	});

	return {
		paymentUrl: session.url,
		sessionId: session.id,
		paymentId: payment.id,
		amount: totalAmount,
		currency: "usd",
	};
};

/**
 * Handles incoming Stripe webhook events.
 */
export const handleStripeWebhook = async (payload: Buffer, signature: string) => {
	if (!signature) {
		throw new Error("Missing Stripe Signature");
	}

	const endpointSecret = envConfigs.stripe?.webhook_secret || envConfigs.stripe_webhook_secret;
	if (!endpointSecret) {
		throw new Error("Stripe webhook secret is not configured");
	}

	console.log(
		"Body type:",
		typeof payload,
		"Is Buffer:",
		Buffer.isBuffer(payload),
		"Length:",
		payload?.length
	);

	const event = await stripe.webhooks.constructEventAsync(payload as any, signature, endpointSecret);

	switch (event.type) {
		case "checkout.session.completed":
			await paymentUtils.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
			break;

		case "checkout.session.expired":
			await paymentUtils.handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
			break;

		case "payment_intent.payment_failed":
			await paymentUtils.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
			break;

		default:
			break;
	}
};

// Aliases for backward compatibility
export const createPaymentIntentIntoDB = createCheckoutSession;
export const handleStripeWebhookIntoDB = handleStripeWebhook;
