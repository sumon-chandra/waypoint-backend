/**
 * Builds Prisma DateTime filter object from optional start and end date strings.
 */
export const buildDateFilter = (startDate?: string, endDate?: string) => {
	const filter: { gte?: Date; lte?: Date } = {};

	if (startDate) {
		const start = new Date(startDate);
		if (startDate.length === 10) {
			start.setUTCHours(0, 0, 0, 0);
		}
		filter.gte = start;
	}

	if (endDate) {
		const end = new Date(endDate);
		if (endDate.length === 10) {
			end.setUTCHours(23, 59, 59, 999);
		}
		filter.lte = end;
	}

	return Object.keys(filter).length > 0 ? filter : undefined;
};

/**
 * Formats a Date into a string bucket identifier based on interval.
 */
export const getIntervalBucketKey = (date: Date, interval: "day" | "week" | "month"): string => {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");

	if (interval === "month") {
		return `${year}-${month}`;
	}

	if (interval === "week") {
		// Calculate the Monday of that week
		const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
		const dayOfWeek = d.getUTCDay(); // 0 is Sunday, 1 is Monday...
		const diff = d.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
		const monday = new Date(d.setUTCDate(diff));
		const mMonth = String(monday.getUTCMonth() + 1).padStart(2, "0");
		const mDay = String(monday.getUTCDate()).padStart(2, "0");
		return `${monday.getUTCFullYear()}-${mMonth}-${mDay}`;
	}

	// Default: day
	return `${year}-${month}-${day}`;
};

/**
 * Generates an array of contiguous date bucket strings between start and end date.
 */
export const generateTimeBuckets = (
	startDate: Date,
	endDate: Date,
	interval: "day" | "week" | "month"
): string[] => {
	const buckets: string[] = [];
	const current = new Date(startDate);

	while (current <= endDate) {
		const key = getIntervalBucketKey(current, interval);
		if (!buckets.includes(key)) {
			buckets.push(key);
		}

		if (interval === "month") {
			current.setUTCMonth(current.getUTCMonth() + 1);
			current.setUTCDate(1);
		} else if (interval === "week") {
			current.setUTCDate(current.getUTCDate() + 7);
		} else {
			current.setUTCDate(current.getUTCDate() + 1);
		}
	}

	const endKey = getIntervalBucketKey(endDate, interval);
	if (!buckets.includes(endKey)) {
		buckets.push(endKey);
	}

	return buckets;
};

export interface CSVColumn {
	header: string;
	key: string;
}

/**
 * Escapes and converts an array of objects into RFC-4180 compliant CSV string.
 */
export const convertToCSV = (data: Record<string, any>[], columns: CSVColumn[]): string => {
	const escapeCSVField = (value: any): string => {
		if (value === null || value === undefined) {
			return "";
		}
		const str = typeof value === "object" ? JSON.stringify(value) : String(value);
		if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
			return `"${str.replace(/"/g, '""')}"`;
		}
		return str;
	};

	const headerRow = columns.map((col) => escapeCSVField(col.header)).join(",");
	const dataRows = data.map((row) =>
		columns.map((col) => escapeCSVField(row[col.key])).join(",")
	);

	return [headerRow, ...dataRows].join("\r\n");
};
