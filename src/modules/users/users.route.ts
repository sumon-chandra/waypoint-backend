import { Router } from "express";
import { UsersController } from "./users.controller";
import { authGuard } from "../../middlewares/auth.middleware";
import { UserRole } from "../../../types";

const router = Router();

router.get("/",
  authGuard(UserRole.ADMIN),
  UsersController.getAllUsers
);

export const UsersRoutes = router;