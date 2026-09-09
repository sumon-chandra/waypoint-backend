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
		include: {
			hub: true,
			payment: true,
			courier: {
				select: { id: true, name: true, email: true },
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return shipments;
};

export const getCourierShipmentsFromDB = async (courierId: string) => {
	const shipments = await prisma.shipment.findMany({
		where: { courierId },
		include: {
			hub: true,
			payment: true,
			customer: {
				select: { id: true, name: true, email: true },
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return shipments;
};

export const updateShipmentStatusFromDB = async (
	shipmentId: string,
	courierId: string,
	status: ShipmentStatus
) => {
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

/**
 * Retrieves all shipments across the ecosystem for Admin review.
 */
export const getAllShipmentsFromDB = async () => {
	const shipments = await prisma.shipment.findMany({
		include: {
			customer: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
				},
			},
			courier: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
				},
			},
			hub: true,
			payment: true,
		},
		orderBy: { createdAt: "desc" },
	});

	return shipments;
};

/**
 * Manually assigns a Courier (and optional Hub) to a Shipment.
 * Strictly validates that the assigned user has the 'COURIER' role.
 */
export const assignCourierToShipmentFromDB = async (
	shipmentId: string,
	courierId: string,
	hubId?: string
) => {
	const shipment = await prisma.shipment.findUnique({
		where: { id: shipmentId },
	});

	if (!shipment) {
		throw AppError.notFound("Shipment not found");
	}

	const courierUser = await prisma.user.findUnique({
		where: { id: courierId },
	});

	if (!courierUser) {
		throw AppError.notFound("Courier user not found");
	}

	if (courierUser.role !== "COURIER") {
		throw AppError.badRequest(
			`Invalid courier assignment: User has role '${courierUser.role}', expected 'COURIER'`
		);
	}

	if (hubId) {
		const hub = await prisma.hub.findUnique({
			where: { id: hubId },
		});
		if (!hub) {
			throw AppError.notFound("Hub not found");
		}
	}

	const updatedShipment = await prisma.shipment.update({
		where: { id: shipmentId },
		data: {
			courierId,
			status: "ASSIGNED",
			...(hubId && { hubId }),
		},
		include: {
			customer: {
				select: { id: true, name: true, email: true },
			},
			courier: {
				select: { id: true, name: true, email: true, role: true },
			},
			hub: true,
			payment: true,
		},
	});

	return updatedShipment;
};
