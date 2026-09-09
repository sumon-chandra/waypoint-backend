import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import * as ShipmentService from "./shipment.service";
import { sendResponse } from "../../utils/send-response";
import httpStatus from "http-status";

export const createShipment = asyncHandler(async (req: Request, res: Response) => {
	const customerId = req.user!.id;
	const shipment = await ShipmentService.createShipmentIntoDB(req.body, customerId);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Shipment created successfully",
		data: shipment,
	});
});

export const getMyShipments = asyncHandler(async (req: Request, res: Response) => {
	const customerId = req.user!.id;
	const shipments = await ShipmentService.getCustomerShipmentsFromDB(customerId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Shipments retrieved successfully",
		data: shipments,
	});
});

export const getCourierShipments = asyncHandler(async (req: Request, res: Response) => {
	const courierId = req.user!.id;
	const shipments = await ShipmentService.getCourierShipmentsFromDB(courierId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Shipments retrieved successfully",
		data: shipments,
	});
});

export const updateShipmentStatus = asyncHandler(async (req: Request, res: Response) => {
	const courierId = req.user!.id;
	const shipmentId = req.params.id;
	const { status } = req.body;
	const shipment = await ShipmentService.updateShipmentStatusFromDB(shipmentId, courierId, status);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Shipment status updated successfully",
		data: shipment,
	});
});

export const getAllShipments = asyncHandler(async (req: Request, res: Response) => {
	const shipments = await ShipmentService.getAllShipmentsFromDB();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "All shipments retrieved successfully",
		data: shipments,
	});
});

export const assignCourier = asyncHandler(async (req: Request, res: Response) => {
	const shipmentId = req.params.id;
	const { courierId, hubId } = req.body;

	const shipment = await ShipmentService.assignCourierToShipmentFromDB(
		shipmentId,
		courierId,
		hubId
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Courier assigned to shipment successfully",
		data: shipment,
	});
});
