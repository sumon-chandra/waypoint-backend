import { Router } from "express";
import * as ShipmentController from "./shipment.controller";
import { validateRequest } from "../../middlewares/validate-request";
import { createShipmentSchema, updateShipmentStatusSchema } from "./shipment.validation";
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

router.get(
	"/assigned-shipments",
	authGuard("COURIER"),
	ShipmentController.getCourierShipments
);

router.patch(
	"/:id/status",
	authGuard("COURIER"),
	validateRequest(updateShipmentStatusSchema),
	ShipmentController.updateShipmentStatus
);

export const ShipmentRoutes = router;
