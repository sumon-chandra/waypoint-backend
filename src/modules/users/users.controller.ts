import type { Request, Response } from "express";
import httpStatus from "http-status";
import { UsersService } from "./users.service";
import { asyncHandler } from "../../utils/async-handler";
import { sendResponse } from "../../utils/send-response";

const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
	const result = await UsersService.getAllUsers();
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Users retrieved successfully.",
		data: result,
	});
});

const getProfile = asyncHandler(async (req: Request, res: Response) => {
	const result = await UsersService.getUserById(req.user!.id, req.user!);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User profile retrieved successfully.",
		data: result,
	});
});

const getUserById = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const result = await UsersService.getUserById(id, req.user!);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User retrieved successfully.",
		data: result,
	});
});

const updateProfile = asyncHandler(async (req: Request, res: Response) => {
	const result = await UsersService.updateUserData(req.user!.id, req.body, req.user!);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Profile updated successfully.",
		data: result,
	});
});

const updateUserById = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const result = await UsersService.updateUserData(id, req.body, req.user!);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User data updated successfully.",
		data: result,
	});
});

const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const result = await UsersService.updateUserStatus(id, req.body, req.user!.id);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User status updated successfully.",
		data: result,
	});
});

export const UsersController = {
	getAllUsers,
	getProfile,
	getUserById,
	updateProfile,
	updateUserById,
	updateUserStatus,
};