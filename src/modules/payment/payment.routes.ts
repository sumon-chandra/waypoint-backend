import { Router } from "express";
import * as PaymentController from "./payment.controller";
import { validateRequest } from "../../middlewares/validate-request";
import { createCheckoutSessionSchema } from "./payment.validation";
import { authGuard } from "../../middlewares/auth.middleware";

const router = Router();

router.post(
	"/create-checkout-session",
	authGuard("CUSTOMER"),
	validateRequest(createCheckoutSessionSchema),
	PaymentController.createCheckoutSession
);

// Backward compatibility alias
router.post(
	"/create-intent",
	authGuard("CUSTOMER"),
	validateRequest(createCheckoutSessionSchema),
	PaymentController.createCheckoutSession
);

export const PaymentRoutes = router;
