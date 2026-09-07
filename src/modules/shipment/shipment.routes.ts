import { Router } from "express";
import * as ShipmentController from "./shipment.controller";
import { validateRequest } from "../../middlewares/validate-request";
import { createShipmentSchema } from "./shipment.validation";
import { authGuard } from "../../middlewares/auth.middleware";

const router = Router();

router.post(
	"/",
	authGuard("CUSTOMER"),
	validateRequest(createShipmentSchema),
	ShipmentController.createShipment
);

router.get(
	"/my-shipments",
	authGuard("CUSTOMER"),
	ShipmentController.getMyShipments
);

export const ShipmentRoutes = router;
