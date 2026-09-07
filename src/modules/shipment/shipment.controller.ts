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
