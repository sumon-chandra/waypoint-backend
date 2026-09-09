import { prisma } from "../../lib/prisma";
import AppError from "../../utils/app-error";
import type { CreateHubInput, UpdateHubInput } from "./hub.interface";

/**
 * Creates a new Hub in the database.
 */
export const createHubIntoDB = async (payload: CreateHubInput) => {
	const hub = await prisma.hub.create({
		data: payload,
	});

	return hub;
};

/**
 * Retrieves all Hubs with associated shipment count.
 */
export const getAllHubsFromDB = async () => {
	const hubs = await prisma.hub.findMany({
		include: {
			_count: {
				select: { shipments: true },
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return hubs;
};

/**
 * Retrieves a single Hub by ID with its shipments.
 */
export const getHubByIdFromDB = async (id: string) => {
	const hub = await prisma.hub.findUnique({
		where: { id },
		include: {
			shipments: true,
			_count: {
				select: { shipments: true },
			},
		},
	});

	if (!hub) {
		throw AppError.notFound("Hub not found");
	}

	return hub;
};

/**
 * Updates an existing Hub.
 */
export const updateHubIntoDB = async (id: string, payload: UpdateHubInput) => {
	const existingHub = await prisma.hub.findUnique({
		where: { id },
	});

	if (!existingHub) {
		throw AppError.notFound("Hub not found");
	}

	const updatedHub = await prisma.hub.update({
		where: { id },
		data: payload,
	});

	return updatedHub;
};

/**
 * Deletes a Hub by ID.
 * Prevents deletion if shipments are currently associated with the Hub.
 */
export const deleteHubFromDB = async (id: string) => {
	const existingHub = await prisma.hub.findUnique({
		where: { id },
		include: {
			_count: {
				select: { shipments: true },
			},
		},
	});

	if (!existingHub) {
		throw AppError.notFound("Hub not found");
	}

	if (existingHub._count.shipments > 0) {
		throw AppError.badRequest(
			"Cannot delete hub with associated shipments. Reassign or delete the shipments first."
		);
	}

	const deletedHub = await prisma.hub.delete({
		where: { id },
	});

	return deletedHub;
};
