import { Router } from "express";
import { UsersRoutes } from "../modules/users/users.route";
import { AuthRoutes } from "../modules/auth/auth.route";

const mainRouter = Router();

const moduleRoutes = [
	{ path: "/auth", route: AuthRoutes },
	{ path: "/users", route: UsersRoutes },
];

moduleRoutes.forEach((route) => {
	mainRouter.use(route.path, route.route);
});

export default mainRouter;
