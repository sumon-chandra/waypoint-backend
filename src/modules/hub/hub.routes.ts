import { Router } from "express";
import * as HubController from "./hub.controller";
import { authGuard } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate-request";
import { createHubSchema, updateHubSchema, hubIdParamSchema } from "./hub.validation";

const router = Router();

router.post(
	"/",
	authGuard("ADMIN"),
	validateRequest(createHubSchema),
	HubController.createHub
);

router.get(
	"/",
	authGuard("ADMIN"),
	HubController.getAllHubs
);

router.get(
	"/:id",
	authGuard("ADMIN"),
	validateRequest(hubIdParamSchema),
	HubController.getHubById
);

router.patch(
	"/:id",
	authGuard("ADMIN"),
	validateRequest(hubIdParamSchema),
	validateRequest(updateHubSchema),
	HubController.updateHub
);

router.delete(
	"/:id",
	authGuard("ADMIN"),
	validateRequest(hubIdParamSchema),
	HubController.deleteHub
);

export const HubRoutes = router;
