import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendResponse } from "../../utils/send-response";
import * as AnalyticsService from "./analytics.service";
import type {
	DateRangeFilterInput,
	PaymentsReportFilterInput,
	ShipmentsReportFilterInput,
	TrendsFilterInput,
} from "./analytics.validation";

export const getAdminOverview = asyncHandler(async (req: Request, res: Response) => {
	const query = req.query as DateRangeFilterInput;
	const data = await AnalyticsService.getAdminOverviewFromDB(query.startDate, query.endDate);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Admin overview analytics retrieved successfully",
		data,
	});
});

export const getAdminTrends = asyncHandler(async (req: Request, res: Response) => {
	const query = req.query as TrendsFilterInput;
	const data = await AnalyticsService.getAdminTrendsFromDB(
		query.startDate,
		query.endDate,
		query.interval
	);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Admin trend analytics retrieved successfully",
		data,
	});
});

export const getAdminStatusDistribution = asyncHandler(
	async (req: Request, res: Response) => {
		const query = req.query as DateRangeFilterInput;
		const data = await AnalyticsService.getAdminStatusDistributionFromDB(
			query.startDate,
			query.endDate
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Status distribution analytics retrieved successfully",
			data,
		});
	}
);

export const getAdminHubPerformance = asyncHandler(async (req: Request, res: Response) => {
	const query = req.query as DateRangeFilterInput;
	const data = await AnalyticsService.getAdminHubPerformanceFromDB(
		query.startDate,
		query.endDate
	);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Hub performance analytics retrieved successfully",
		data,
	});
});

export const getAdminCourierPerformance = asyncHandler(
	async (req: Request, res: Response) => {
		const query = req.query as DateRangeFilterInput;
		const data = await AnalyticsService.getAdminCourierPerformanceFromDB(
			query.startDate,
			query.endDate
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Courier performance analytics retrieved successfully",
			data,
		});
	}
);

export const getShipmentsReport = asyncHandler(async (req: Request, res: Response) => {
	const query = req.query as ShipmentsReportFilterInput;
	const result = await AnalyticsService.getShipmentsReportDataFromDB(query);

	if (result.format === "csv") {
		const filename = `shipments_report_${new Date().toISOString().slice(0, 10)}.csv`;
		res.setHeader("Content-Type", "text/csv");
		res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
		res.status(200).send(result.data);
		return;
	}

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Shipments report retrieved successfully",
		data: result.data,
	});
});

export const getPaymentsReport = asyncHandler(async (req: Request, res: Response) => {
	const query = req.query as PaymentsReportFilterInput;
	const result = await AnalyticsService.getPaymentsReportDataFromDB(query);

	if (result.format === "csv") {
		const filename = `payments_report_${new Date().toISOString().slice(0, 10)}.csv`;
		res.setHeader("Content-Type", "text/csv");
		res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
		res.status(200).send(result.data);
		return;
	}

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Payments report retrieved successfully",
		data: result.data,
	});
});

export const getCourierPersonalOverview = asyncHandler(
	async (req: Request, res: Response) => {
		const courierId = req.user!.id;
		const query = req.query as DateRangeFilterInput;
		const data = await AnalyticsService.getCourierPersonalOverviewFromDB(
			courierId,
			query.startDate,
			query.endDate
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Courier personal analytics retrieved successfully",
			data,
		});
	}
);

export const getCustomerPersonalOverview = asyncHandler(
	async (req: Request, res: Response) => {
		const customerId = req.user!.id;
		const query = req.query as DateRangeFilterInput;
		const data = await AnalyticsService.getCustomerPersonalOverviewFromDB(
			customerId,
			query.startDate,
			query.endDate
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Customer personal analytics retrieved successfully",
			data,
		});
	}
);
