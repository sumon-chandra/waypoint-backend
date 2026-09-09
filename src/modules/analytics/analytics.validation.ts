import { z } from "zod";

const isValidDateString = (val: string) => !isNaN(Date.parse(val));

const optionalDateSchema = z
	.string()
	.refine(isValidDateString, { message: "Invalid date format. Expected valid ISO or YYYY-MM-DD date." })
	.optional();

export const dateRangeFilterSchema = z.object({
	query: z.object({
		startDate: optionalDateSchema,
		endDate: optionalDateSchema,
	}),
});

export const trendsFilterSchema = z.object({
	query: z.object({
		startDate: optionalDateSchema,
		endDate: optionalDateSchema,
		interval: z.enum(["day", "week", "month"]).default("day").optional(),
	}),
});

export const shipmentsReportFilterSchema = z.object({
	query: z.object({
		startDate: optionalDateSchema,
		endDate: optionalDateSchema,
		status: z
			.enum(["PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"])
			.optional(),
		hubId: z.string().uuid("Invalid Hub ID format").optional(),
		format: z.enum(["json", "csv"]).default("json").optional(),
	}),
});

export const paymentsReportFilterSchema = z.object({
	query: z.object({
		startDate: optionalDateSchema,
		endDate: optionalDateSchema,
		status: z
			.enum(["UNPAID", "PENDING", "PAID", "FAILED", "EXPIRED"])
			.optional(),
		format: z.enum(["json", "csv"]).default("json").optional(),
	}),
});

export type DateRangeFilterInput = z.infer<typeof dateRangeFilterSchema>["query"];
export type TrendsFilterInput = z.infer<typeof trendsFilterSchema>["query"];
export type ShipmentsReportFilterInput = z.infer<typeof shipmentsReportFilterSchema>["query"];
export type PaymentsReportFilterInput = z.infer<typeof paymentsReportFilterSchema>["query"];
