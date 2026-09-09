import { Router } from "express";
import * as ShipmentController from "./shipment.controller";
import { validateRequest } from "../../middlewares/validate-request";
import {
	createShipmentSchema,
	updateShipmentStatusSchema,
	assignCourierSchema,
} from "./shipment.validation";
import { authGuard } from "../../middlewares/auth.middleware";

const router = Router();

// Customer Endpoints
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

// Courier Endpoints
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

// Admin Endpoints
router.get(
	"/",
	authGuard("ADMIN"),
	ShipmentController.getAllShipments
);

router.get(
	"/all",
	authGuard("ADMIN"),
	ShipmentController.getAllShipments
);

router.patch(
	"/:id/assign-courier",
	authGuard("ADMIN"),
	validateRequest(assignCourierSchema),
	ShipmentController.assignCourier
);

export const ShipmentRoutes = router;
