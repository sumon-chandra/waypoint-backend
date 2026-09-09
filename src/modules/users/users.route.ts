import { Router } from "express";
import { UsersController } from "./users.controller";
import { authGuard } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate-request";
import { UserRole } from "../../../types";
import {
	updateUserStatusSchema,
	updateUserDataSchema,
	userIdParamSchema,
} from "./users.validation";

const router = Router();

// Retrieve all users (Admin only)
router.get(
	"/",
	authGuard(UserRole.ADMIN),
	UsersController.getAllUsers
);

// Current user profile endpoints (Any authenticated user)
router.get(
	"/profile",
	authGuard(),
	UsersController.getProfile
);

router.get(
	"/me",
	authGuard(),
	UsersController.getProfile
);

router.patch(
	"/profile",
	authGuard(),
	validateRequest(updateUserDataSchema),
	UsersController.updateProfile
);

router.patch(
	"/me",
	authGuard(),
	validateRequest(updateUserDataSchema),
	UsersController.updateProfile
);

// Admin update user status (ACTIVE, INACTIVE, BANNED)
router.patch(
	"/:id/status",
	authGuard(UserRole.ADMIN),
	validateRequest(userIdParamSchema),
	validateRequest(updateUserStatusSchema),
	UsersController.updateUserStatus
);

// Specific user by ID endpoints (Admin or Self)
router.get(
	"/:id",
	authGuard(),
	validateRequest(userIdParamSchema),
	UsersController.getUserById
);

router.patch(
	"/:id",
	authGuard(),
	validateRequest(userIdParamSchema),
	validateRequest(updateUserDataSchema),
	UsersController.updateUserById
);

export const UsersRoutes = router;