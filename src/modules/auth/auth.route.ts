import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middlewares/validate-request";
import {
	registerValidationSchema,
	loginValidationSchema,
	refreshTokenValidationSchema,
	googleAuthValidationSchema,
} from "./auth.validation";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/register", validateRequest(registerValidationSchema), AuthController.register);
router.post("/login", validateRequest(loginValidationSchema), AuthController.login);
router.post(
	"/refresh-token",
	validateRequest(refreshTokenValidationSchema),
	AuthController.refreshToken
);
router.post("/logout", AuthController.logout);

// Google OAuth endpoints
router.post("/google", validateRequest(googleAuthValidationSchema), AuthController.googleAuth);
router.get("/google", AuthController.googleRedirect);
router.get("/google/callback", AuthController.googleCallback);

// Profile
router.get("/me", protect, AuthController.getMe);

export const AuthRoutes = router;
