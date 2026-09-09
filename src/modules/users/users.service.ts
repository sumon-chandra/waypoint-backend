import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/app-error";
import { UserRole } from "../../../types";
import {
	type UpdateUserStatusInput,
	type UpdateUserDataInput,
} from "./users.validation";

const USER_SELECT_FIELDS = {
	id: true,
	name: true,
	email: true,
	username: true,
	displayUsername: true,
	avatar: true,
	role: true,
	status: true,
	googleId: true,
	emailVerified: true,
	banned: true,
	banReason: true,
	banExpires: true,
	stripeCustomerId: true,
	createdAt: true,
	updatedAt: true,
};

/**
 * Retrieve all registered users (Admin only)
 */
const getAllUsers = async () => {
	const users = await prisma.user.findMany({
		select: USER_SELECT_FIELDS,
		orderBy: { createdAt: "desc" },
	});
	return users;
};

/**
 * Retrieve single user by ID with authorization check (Admin or Self)
 */
const getUserById = async (
	targetUserId: string,
	currentUser: { id: string; role: string }
) => {
	if (currentUser.role !== UserRole.ADMIN && currentUser.id !== targetUserId) {
		throw AppError.forbidden("Access forbidden: You do not have permission to view this user.");
	}

	const user = await prisma.user.findUnique({
		where: { id: targetUserId },
		select: USER_SELECT_FIELDS,
	});

	if (!user) {
		throw AppError.notFound("User not found.");
	}

	return user;
};

/**
 * Update user status (ACTIVE, INACTIVE, BANNED) (Admin only)
 */
const updateUserStatus = async (
	targetUserId: string,
	payload: UpdateUserStatusInput,
	adminId: string
) => {
	const user = await prisma.user.findUnique({
		where: { id: targetUserId },
	});

	if (!user) {
		throw AppError.notFound("User not found.");
	}

	// Prevent admin from accidentally locking their own account
	if (user.id === adminId && (payload.status === "BANNED" || payload.status === "INACTIVE")) {
		throw AppError.badRequest("You cannot ban or deactivate your own admin account.");
	}

	const isBanned = payload.status === "BANNED";
	const banReason = isBanned
		? payload.banReason || "Account suspended by administrator"
		: payload.status === "ACTIVE"
		? null
		: payload.banReason || user.banReason;

	const updatedUser = await prisma.user.update({
		where: { id: targetUserId },
		data: {
			status: payload.status,
			banned: isBanned,
			banReason,
		},
		select: USER_SELECT_FIELDS,
	});

	return updatedUser;
};

/**
 * Update user profile/personal data (Self or Admin)
 */
const updateUserData = async (
	targetUserId: string,
	payload: UpdateUserDataInput,
	currentUser: { id: string; role: string }
) => {
	if (currentUser.role !== UserRole.ADMIN && currentUser.id !== targetUserId) {
		throw AppError.forbidden("Access forbidden: You can only update your own profile.");
	}

	const user = await prisma.user.findUnique({
		where: { id: targetUserId },
	});

	if (!user) {
		throw AppError.notFound("User not found.");
	}

	// Validate unique username if changed
	if (payload.username && payload.username !== user.username) {
		const existingUsername = await prisma.user.findUnique({
			where: { username: payload.username },
		});
		if (existingUsername && existingUsername.id !== targetUserId) {
			throw AppError.badRequest("This username is already taken. Please choose another.");
		}
	}

	const dataToUpdate: Record<string, any> = {};
	if (payload.name !== undefined) dataToUpdate.name = payload.name;
	if (payload.avatar !== undefined) dataToUpdate.avatar = payload.avatar;
	if (payload.displayUsername !== undefined) dataToUpdate.displayUsername = payload.displayUsername;
	if (payload.username !== undefined) dataToUpdate.username = payload.username;
	if (payload.password) {
		dataToUpdate.password = await bcrypt.hash(payload.password, 10);
	}

	const updatedUser = await prisma.user.update({
		where: { id: targetUserId },
		data: dataToUpdate,
		select: USER_SELECT_FIELDS,
	});

	return updatedUser;
};

export const UsersService = {
	getAllUsers,
	getUserById,
	updateUserStatus,
	updateUserData,
};