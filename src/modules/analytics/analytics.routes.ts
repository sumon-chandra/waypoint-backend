import { Router } from "express";
import * as AnalyticsController from "./analytics.controller";
import { authGuard } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate-request";
import {
	dateRangeFilterSchema,
	paymentsReportFilterSchema,
	shipmentsReportFilterSchema,
	trendsFilterSchema,
} from "./analytics.validation";

const router = Router();

router.get(
	"/admin/overview",
	authGuard("ADMIN"),
	validateRequest(dateRangeFilterSchema),
	AnalyticsController.getAdminOverview
);

router.get(
	"/admin/trends",
	authGuard("ADMIN"),
	validateRequest(trendsFilterSchema),
	AnalyticsController.getAdminTrends
);

router.get(
	"/admin/status-distribution",
	authGuard("ADMIN"),
	validateRequest(dateRangeFilterSchema),
	AnalyticsController.getAdminStatusDistribution
);

router.get(
	"/admin/hub-performance",
	authGuard("ADMIN"),
	validateRequest(dateRangeFilterSchema),
	AnalyticsController.getAdminHubPerformance
);

router.get(
	"/admin/courier-performance",
	authGuard("ADMIN"),
	validateRequest(dateRangeFilterSchema),
	AnalyticsController.getAdminCourierPerformance
);

router.get(
	"/admin/reports/shipments",
	authGuard("ADMIN"),
	validateRequest(shipmentsReportFilterSchema),
	AnalyticsController.getShipmentsReport
);

router.get(
	"/admin/reports/payments",
	authGuard("ADMIN"),
	validateRequest(paymentsReportFilterSchema),
	AnalyticsController.getPaymentsReport
);

// ==================== COURIER PERSONAL ANALYTICS ====================
router.get(
	"/courier/overview",
	authGuard("COURIER"),
	validateRequest(dateRangeFilterSchema),
	AnalyticsController.getCourierPersonalOverview
);

// ==================== CUSTOMER PERSONAL ANALYTICS ====================
router.get(
	"/customer/overview",
	authGuard("CUSTOMER"),
	validateRequest(dateRangeFilterSchema),
	AnalyticsController.getCustomerPersonalOverview
);

export const AnalyticsRoutes = router;
