export interface DateRangeFilter {
	startDate?: string;
	endDate?: string;
}

export interface TrendsFilter extends DateRangeFilter {
	interval?: "day" | "week" | "month";
}

export interface AdminOverviewMetrics {
	shipments: {
		total: number;
		pending: number;
		assigned: number;
		inTransit: number;
		delivered: number;
		cancelled: number;
	};
	revenue: {
		totalRevenue: number;
		pendingRevenue: number;
		averageOrderValue: number;
	};
	users: {
		totalCustomers: number;
		totalCouriers: number;
		activeUsers: number;
	};
	hubs: {
		totalHubs: number;
	};
	rates: {
		deliverySuccessRate: number;
		cancellationRate: number;
	};
}

export interface TrendDataPoint {
	date: string;
	shipmentsCount: number;
	deliveredCount: number;
	revenue: number;
}

export interface StatusDistribution {
	shipments: {
		status: string;
		count: number;
		percentage: number;
	}[];
	payments: {
		status: string;
		count: number;
		totalAmount: number;
		percentage: number;
	}[];
}

export interface HubPerformanceMetric {
	hubId: string;
	hubName: string;
	address: string;
	totalShipments: number;
	deliveredShipments: number;
	activeShipments: number;
	successRate: number;
}

export interface CourierPerformanceMetric {
	courierId: string;
	name: string;
	email: string;
	totalAssigned: number;
	delivered: number;
	inTransit: number;
	cancelled: number;
	successRate: number;
}

export interface CourierPersonalMetrics {
	totalAssigned: number;
	delivered: number;
	inTransit: number;
	cancelled: number;
	successRate: number;
	deliveriesLast7Days: number;
}

export interface CustomerPersonalMetrics {
	totalShipments: number;
	deliveredShipments: number;
	inTransitShipments: number;
	pendingShipments: number;
	totalSpent: number;
	pendingPayments: number;
}

export interface ShipmentsReportFilter extends DateRangeFilter {
	status?: string;
	hubId?: string;
	format?: "json" | "csv";
}

export interface PaymentsReportFilter extends DateRangeFilter {
	status?: string;
	format?: "json" | "csv";
}
