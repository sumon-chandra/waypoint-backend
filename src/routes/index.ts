import { Router } from "express";
import { UsersRoutes } from "../modules/users/users.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { ShipmentRoutes } from "../modules/shipment/shipment.routes";
import { PaymentRoutes } from "../modules/payment/payment.routes";
import { HubRoutes } from "../modules/hub/hub.routes";
import { AnalyticsRoutes } from "../modules/analytics/analytics.routes";

const mainRouter = Router();

const moduleRoutes = [
	{ path: "/auth", route: AuthRoutes },
	{ path: "/users", route: UsersRoutes },
	{ path: "/shipments", route: ShipmentRoutes },
	{ path: "/payments", route: PaymentRoutes },
	{ path: "/hubs", route: HubRoutes },
	{ path: "/analytics", route: AnalyticsRoutes },
];

moduleRoutes.forEach((route) => {
	mainRouter.use(route.path, route.route);
});

export default mainRouter;
