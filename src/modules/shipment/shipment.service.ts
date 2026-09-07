import { prisma } from "../../lib/prisma";
import type { CreateShipmentInput } from "./shipment.validation";

export const createShipmentIntoDB = async (payload: CreateShipmentInput, customerId: string) => {
	// Generate a simple unique tracking number
	const trackingNumber = `WP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

	const shipment = await prisma.shipment.create({
		data: {
			...payload,
			trackingNumber,
			customerId,
			status: "PENDING",
			paymentStatus: "UNPAID",
		},
	});

	return shipment;
};

export const getCustomerShipmentsFromDB = async (customerId: string) => {
	const shipments = await prisma.shipment.findMany({
		where: { customerId },
		orderBy: { createdAt: "desc" },
	});

	return shipments;
};
