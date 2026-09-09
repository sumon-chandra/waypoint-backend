import type { Request, Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/async-handler";
import { sendResponse } from "../../utils/send-response";
import * as HubService from "./hub.service";

export const createHub = asyncHandler(async (req: Request, res: Response) => {
	const hub = await HubService.createHubIntoDB(req.body);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Hub created successfully",
		data: hub,
	});
});

export const getAllHubs = asyncHandler(async (req: Request, res: Response) => {
	const hubs = await HubService.getAllHubsFromDB();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Hubs retrieved successfully",
		data: hubs,
	});
});

export const getHubById = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const hub = await HubService.getHubByIdFromDB(id);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Hub retrieved successfully",
		data: hub,
	});
});

export const updateHub = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const updatedHub = await HubService.updateHubIntoDB(id, req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Hub updated successfully",
		data: updatedHub,
	});
});

export const deleteHub = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const deletedHub = await HubService.deleteHubFromDB(id);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Hub deleted successfully",
		data: deletedHub,
	});
});
