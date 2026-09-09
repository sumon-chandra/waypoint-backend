import { Router } from "express";
import * as PaymentController from "./payment.controller";

const router = Router();

// Matches POST /api/v1/payments/webhook
router.post("/", PaymentController.handleStripeWebhook);

// Matches POST /api/v1/payments/webhook/stripe
router.post("/stripe", PaymentController.handleStripeWebhook);

export const PaymentWebhookRoutes = router;
