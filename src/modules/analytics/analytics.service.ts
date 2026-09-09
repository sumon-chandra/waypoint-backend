import { prisma } from "../../lib/prisma";
import type {
	AdminOverviewMetrics,
	CourierPerformanceMetric,
	CourierPersonalMetrics,
	CustomerPersonalMetrics,
	HubPerformanceMetric,
	PaymentsReportFilter,
	ShipmentsReportFilter,
	StatusDistribution,
	TrendDataPoint,
} from "./analytics.interface";
import {
	buildDateFilter,
	convertToCSV,
	generateTimeBuckets,
	getIntervalBucketKey,
} from "./analytics.utils";
import type {
	PaymentStatus,
	ShipmentStatus,
} from "../../../prisma/src/generated/prisma/client";

/**
 * Retrieves global executive overview KPIs for Admin.
 */
export const getAdminOverviewFromDB = async (
	startDate?: string,
	endDate?: string
): Promise<AdminOverviewMetrics> => {
	const dateFilter = buildDateFilter(startDate, endDate);
	const shipmentWhere = dateFilter ? { createdAt: dateFilter } : undefined;
	const paymentWhere = dateFilter ? { createdAt: dateFilter } : undefined;

	const [
		totalShipments,
		shipmentGroups,
		paidRevenueAgg,
		pendingRevenueAgg,
		totalCustomers,
		totalCouriers,
		activeUsers,
		totalHubs,
	] = await Promise.all([
		prisma.shipment.count({ where: shipmentWhere }),
		prisma.shipment.groupBy({
			by: ["status"],
			_count: { id: true },
			where: shipmentWhere,
		}),
		prisma.payment.aggregate({
			where: { ...paymentWhere, status: "PAID" },
			_sum: { amount: true },
			_avg: { amount: true },
		}),
		prisma.payment.aggregate({
			where: { ...paymentWhere, status: "PENDING" },
			_sum: { amount: true },
		}),
		prisma.user.count({ where: { role: "CUSTOMER" } }),
		prisma.user.count({ where: { role: "COURIER" } }),
		prisma.user.count({ where: { status: "ACTIVE" } }),
		prisma.hub.count(),
	]);

	const statusCounts: Record<string, number> = {
		PENDING: 0,
		ASSIGNED: 0,
		IN_TRANSIT: 0,
		DELIVERED: 0,
		CANCELLED: 0,
	};

	shipmentGroups.forEach((group) => {
		statusCounts[group.status] = group._count.id;
	});

	const delivered = statusCounts.DELIVERED || 0;
	const cancelled = statusCounts.CANCELLED || 0;

	const deliverySuccessRate =
		delivered + cancelled > 0
			? Number(((delivered / (delivered + cancelled)) * 100).toFixed(2))
			: 100;

	const cancellationRate =
		totalShipments > 0
			? Number(((cancelled / totalShipments) * 100).toFixed(2))
			: 0;

	return {
		shipments: {
			total: totalShipments,
			pending: statusCounts.PENDING,
			assigned: statusCounts.ASSIGNED,
			inTransit: statusCounts.IN_TRANSIT,
			delivered: statusCounts.DELIVERED,
			cancelled: statusCounts.CANCELLED,
		},
		revenue: {
			totalRevenue: Number((paidRevenueAgg._sum.amount || 0).toFixed(2)),
			pendingRevenue: Number((pendingRevenueAgg._sum.amount || 0).toFixed(2)),
			averageOrderValue: Number((paidRevenueAgg._avg.amount || 0).toFixed(2)),
		},
		users: {
			totalCustomers,
			totalCouriers,
			activeUsers,
		},
		hubs: {
			totalHubs,
		},
		rates: {
			deliverySuccessRate,
			cancellationRate,
		},
	};
};

/**
 * Retrieves time-series volume and revenue trends for charts.
 */
export const getAdminTrendsFromDB = async (
	startDate?: string,
	endDate?: string,
	interval: "day" | "week" | "month" = "day"
): Promise<TrendDataPoint[]> => {
	const end = endDate ? new Date(endDate) : new Date();
	const start = startDate
		? new Date(startDate)
		: new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

	const [shipments, payments] = await Promise.all([
		prisma.shipment.findMany({
			where: { createdAt: { gte: start, lte: end } },
			select: { status: true, createdAt: true },
		}),
		prisma.payment.findMany({
			where: {
				status: "PAID",
				createdAt: { gte: start, lte: end },
			},
			select: { amount: true, createdAt: true },
		}),
	]);

	const bucketKeys = generateTimeBuckets(start, end, interval);
	const bucketMap: Record<
		string,
		{ shipmentsCount: number; deliveredCount: number; revenue: number }
	> = {};

	bucketKeys.forEach((key) => {
		bucketMap[key] = { shipmentsCount: 0, deliveredCount: 0, revenue: 0 };
	});

	shipments.forEach((s) => {
		const key = getIntervalBucketKey(s.createdAt, interval);
		if (bucketMap[key]) {
			bucketMap[key].shipmentsCount += 1;
			if (s.status === "DELIVERED") {
				bucketMap[key].deliveredCount += 1;
			}
		}
	});

	payments.forEach((p) => {
		const key = getIntervalBucketKey(p.createdAt, interval);
		if (bucketMap[key]) {
			bucketMap[key].revenue = Number(
				(bucketMap[key].revenue + p.amount).toFixed(2)
			);
		}
	});

	return bucketKeys.map((key) => ({
		date: key,
		shipmentsCount: bucketMap[key].shipmentsCount,
		deliveredCount: bucketMap[key].deliveredCount,
		revenue: bucketMap[key].revenue,
	}));
};

/**
 * Retrieves breakdown of shipments and payments by status.
 */
export const getAdminStatusDistributionFromDB = async (
	startDate?: string,
	endDate?: string
): Promise<StatusDistribution> => {
	const dateFilter = buildDateFilter(startDate, endDate);
	const filterWhere = dateFilter ? { createdAt: dateFilter } : undefined;

	const [shipmentGroups, paymentGroups] = await Promise.all([
		prisma.shipment.groupBy({
			by: ["status"],
			_count: { id: true },
			where: filterWhere,
		}),
		prisma.payment.groupBy({
			by: ["status"],
			_count: { id: true },
			_sum: { amount: true },
			where: filterWhere,
		}),
	]);

	const totalShipments = shipmentGroups.reduce(
		(sum, item) => sum + item._count.id,
		0
	);
	const totalPayments = paymentGroups.reduce(
		(sum, item) => sum + item._count.id,
		0
	);

	const shipments = shipmentGroups.map((g) => ({
		status: g.status,
		count: g._count.id,
		percentage:
			totalShipments > 0
				? Number(((g._count.id / totalShipments) * 100).toFixed(2))
				: 0,
	}));

	const payments = paymentGroups.map((p) => ({
		status: p.status,
		count: p._count.id,
		totalAmount: Number((p._sum.amount || 0).toFixed(2)),
		percentage:
			totalPayments > 0
				? Number(((p._count.id / totalPayments) * 100).toFixed(2))
				: 0,
	}));

	return {
		shipments,
		payments,
	};
};

/**
 * Retrieves performance metrics for each logistics hub.
 */
export const getAdminHubPerformanceFromDB = async (
	startDate?: string,
	endDate?: string
): Promise<HubPerformanceMetric[]> => {
	const dateFilter = buildDateFilter(startDate, endDate);

	const hubs = await prisma.hub.findMany({
		include: {
			shipments: {
				where: dateFilter ? { createdAt: dateFilter } : undefined,
				select: { status: true },
			},
		},
		orderBy: { name: "asc" },
	});

	return hubs.map((hub) => {
		const totalShipments = hub.shipments.length;
		const deliveredShipments = hub.shipments.filter(
			(s) => s.status === "DELIVERED"
		).length;
		const cancelledShipments = hub.shipments.filter(
			(s) => s.status === "CANCELLED"
		).length;
		const activeShipments = hub.shipments.filter((s) =>
			["PENDING", "ASSIGNED", "IN_TRANSIT"].includes(s.status)
		).length;

		const successRate =
			deliveredShipments + cancelledShipments > 0
				? Number(
						(
							(deliveredShipments /
								(deliveredShipments + cancelledShipments)) *
							100
						).toFixed(2)
				  )
				: 100;

		return {
			hubId: hub.id,
			hubName: hub.name,
			address: hub.address,
			totalShipments,
			deliveredShipments,
			activeShipments,
			successRate,
		};
	});
};

/**
 * Retrieves leaderboard and workload metrics for all Couriers.
 */
export const getAdminCourierPerformanceFromDB = async (
	startDate?: string,
	endDate?: string
): Promise<CourierPerformanceMetric[]> => {
	const dateFilter = buildDateFilter(startDate, endDate);

	const couriers = await prisma.user.findMany({
		where: { role: "COURIER" },
		include: {
			courierShipments: {
				where: dateFilter ? { createdAt: dateFilter } : undefined,
				select: { status: true },
			},
		},
		orderBy: { name: "asc" },
	});

	return couriers.map((c) => {
		const totalAssigned = c.courierShipments.length;
		const delivered = c.courierShipments.filter(
			(s) => s.status === "DELIVERED"
		).length;
		const inTransit = c.courierShipments.filter(
			(s) => s.status === "IN_TRANSIT"
		).length;
		const cancelled = c.courierShipments.filter(
			(s) => s.status === "CANCELLED"
		).length;

		const successRate =
			delivered + cancelled > 0
				? Number(((delivered / (delivered + cancelled)) * 100).toFixed(2))
				: 100;

		return {
			courierId: c.id,
			name: c.name,
			email: c.email,
			totalAssigned,
			delivered,
			inTransit,
			cancelled,
			successRate,
		};
	});
};

/**
 * Exports detailed shipments report in JSON or CSV format.
 */
export const getShipmentsReportDataFromDB = async (
	filter: ShipmentsReportFilter
) => {
	const dateFilter = buildDateFilter(filter.startDate, filter.endDate);

	const shipments = await prisma.shipment.findMany({
		where: {
			...(dateFilter && { createdAt: dateFilter }),
			...(filter.status && { status: filter.status as ShipmentStatus }),
			...(filter.hubId && { hubId: filter.hubId }),
		},
		include: {
			customer: { select: { id: true, name: true, email: true } },
			courier: { select: { id: true, name: true, email: true } },
			hub: { select: { id: true, name: true } },
			payment: { select: { amount: true, status: true, currency: true } },
		},
		orderBy: { createdAt: "desc" },
	});

	if (filter.format === "csv") {
		const flatData = shipments.map((s) => ({
			trackingNumber: s.trackingNumber,
			createdAt: s.createdAt.toISOString(),
			status: s.status,
			paymentStatus: s.paymentStatus,
			amount: s.payment?.amount ?? 0,
			currency: s.payment?.currency ?? "usd",
			receiverName: s.receiverName,
			receiverPhone: s.receiverPhone,
			weightKg: s.weightKg,
			customerName: s.customer.name,
			customerEmail: s.customer.email,
			courierName: s.courier?.name ?? "Unassigned",
			hubName: s.hub?.name ?? "None",
		}));

		const columns = [
			{ header: "Tracking Number", key: "trackingNumber" },
			{ header: "Created Date", key: "createdAt" },
			{ header: "Status", key: "status" },
			{ header: "Payment Status", key: "paymentStatus" },
			{ header: "Amount", key: "amount" },
			{ header: "Currency", key: "currency" },
			{ header: "Receiver Name", key: "receiverName" },
			{ header: "Receiver Phone", key: "receiverPhone" },
			{ header: "Weight (kg)", key: "weightKg" },
			{ header: "Customer Name", key: "customerName" },
			{ header: "Customer Email", key: "customerEmail" },
			{ header: "Courier", key: "courierName" },
			{ header: "Hub", key: "hubName" },
		];

		const csv = convertToCSV(flatData, columns);
		return { format: "csv" as const, data: csv };
	}

	return { format: "json" as const, data: shipments };
};

/**
 * Exports financial transactions report in JSON or CSV format.
 */
export const getPaymentsReportDataFromDB = async (
	filter: PaymentsReportFilter
) => {
	const dateFilter = buildDateFilter(filter.startDate, filter.endDate);

	const payments = await prisma.payment.findMany({
		where: {
			...(dateFilter && { createdAt: dateFilter }),
			...(filter.status && { status: filter.status as PaymentStatus }),
		},
		include: {
			customer: { select: { id: true, name: true, email: true } },
			shipment: { select: { trackingNumber: true, status: true } },
		},
		orderBy: { createdAt: "desc" },
	});

	if (filter.format === "csv") {
		const flatData = payments.map((p) => ({
			paymentId: p.id,
			createdAt: p.createdAt.toISOString(),
			amount: p.amount,
			currency: p.currency,
			status: p.status,
			paymentMethod: p.paymentMethod ?? "card",
			trackingNumber: p.shipment.trackingNumber,
			shipmentStatus: p.shipment.status,
			customerName: p.customer.name,
			customerEmail: p.customer.email,
			stripePaymentIntentId: p.stripePaymentIntentId ?? "",
		}));

		const columns = [
			{ header: "Payment ID", key: "paymentId" },
			{ header: "Transaction Date", key: "createdAt" },
			{ header: "Amount", key: "amount" },
			{ header: "Currency", key: "currency" },
			{ header: "Status", key: "status" },
			{ header: "Payment Method", key: "paymentMethod" },
			{ header: "Tracking Number", key: "trackingNumber" },
			{ header: "Shipment Status", key: "shipmentStatus" },
			{ header: "Customer Name", key: "customerName" },
			{ header: "Customer Email", key: "customerEmail" },
			{ header: "Stripe Intent ID", key: "stripePaymentIntentId" },
		];

		const csv = convertToCSV(flatData, columns);
		return { format: "csv" as const, data: csv };
	}

	return { format: "json" as const, data: payments };
};

/**
 * Retrieves personalized overview for a specific Courier.
 */
export const getCourierPersonalOverviewFromDB = async (
	courierId: string,
	startDate?: string,
	endDate?: string
): Promise<CourierPersonalMetrics> => {
	const dateFilter = buildDateFilter(startDate, endDate);

	const shipments = await prisma.shipment.findMany({
		where: {
			courierId,
			...(dateFilter && { createdAt: dateFilter }),
		},
		select: { status: true, createdAt: true },
	});

	const totalAssigned = shipments.length;
	const delivered = shipments.filter((s) => s.status === "DELIVERED").length;
	const inTransit = shipments.filter((s) => s.status === "IN_TRANSIT").length;
	const cancelled = shipments.filter((s) => s.status === "CANCELLED").length;

	const successRate =
		delivered + cancelled > 0
			? Number(((delivered / (delivered + cancelled)) * 100).toFixed(2))
			: 100;

	const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	const deliveriesLast7Days = shipments.filter(
		(s) => s.status === "DELIVERED" && s.createdAt >= sevenDaysAgo
	).length;

	return {
		totalAssigned,
		delivered,
		inTransit,
		cancelled,
		successRate,
		deliveriesLast7Days,
	};
};

/**
 * Retrieves personalized overview for a specific Customer.
 */
export const getCustomerPersonalOverviewFromDB = async (
	customerId: string,
	startDate?: string,
	endDate?: string
): Promise<CustomerPersonalMetrics> => {
	const dateFilter = buildDateFilter(startDate, endDate);

	const [shipments, paidAgg, pendingAgg] = await Promise.all([
		prisma.shipment.findMany({
			where: {
				customerId,
				...(dateFilter && { createdAt: dateFilter }),
			},
			select: { status: true },
		}),
		prisma.payment.aggregate({
			where: {
				customerId,
				status: "PAID",
				...(dateFilter && { createdAt: dateFilter }),
			},
			_sum: { amount: true },
		}),
		prisma.payment.count({
			where: {
				customerId,
				status: "PENDING",
				...(dateFilter && { createdAt: dateFilter }),
			},
		}),
	]);

	const totalShipments = shipments.length;
	const deliveredShipments = shipments.filter(
		(s) => s.status === "DELIVERED"
	).length;
	const inTransitShipments = shipments.filter(
		(s) => s.status === "IN_TRANSIT"
	).length;
	const pendingShipments = shipments.filter((s) =>
		["PENDING", "ASSIGNED"].includes(s.status)
	).length;

	return {
		totalShipments,
		deliveredShipments,
		inTransitShipments,
		pendingShipments,
		totalSpent: Number((paidAgg._sum.amount || 0).toFixed(2)),
		pendingPayments: pendingAgg,
	};
};
