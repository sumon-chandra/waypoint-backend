export interface CreateCheckoutSessionInput {
	shipmentId: string;
}

export interface CreateCheckoutSessionResponse {
	paymentUrl: string | null;
	sessionId: string;
	paymentId: string;
	amount: number;
	currency: string;
}

export interface PaymentWebhookResult {
	received: boolean;
}
