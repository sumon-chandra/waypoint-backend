import { prisma } from "../../lib/prisma";
import type { CreateShipmentInput } from "./shipment.validation";
import AppError from "../../utils/app-error";
import type { ShipmentStatus } from "../../../prisma/src/generated/prisma/client";

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

export const getCourierShipmentsFromDB = async (courierId: string) => {
	const shipments = await prisma.shipment.findMany({
		where: { courierId },
		orderBy: { createdAt: "desc" },
	});

	return shipments;
};

export const updateShipmentStatusFromDB = async (shipmentId: string, courierId: string, status: ShipmentStatus) => {
	const shipment = await prisma.shipment.findUnique({
		where: { id: shipmentId },
	});

	if (!shipment) {
		throw AppError.notFound("Shipment not found");
	}

	if (shipment.courierId !== courierId) {
		throw AppError.forbidden("You are not authorized to update this shipment");
	}

	const updatedShipment = await prisma.shipment.update({
		where: { id: shipmentId },
		data: { status },
	});

	return updatedShipment;
};
