import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import AppError from "../utils/app-error";
import { Prisma } from "../../prisma/src/generated/prisma/client";

const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
	console.log("Error : ", err);

	if (err instanceof ZodError) {
		const formattedErrors = err.issues.map((issue) => {
			const field = issue.path.filter((p) => p !== "body").join(".") || "field";
			return {
				field,
				message: issue.message,
			};
		});

		return res.status(httpStatus.BAD_REQUEST).json({
			success: false,
			message: "Input validation failed",
			errors: formattedErrors,
		});
	}

	let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
	let errorMessage = err.message || "Internal Server Error.";
	let errorName = err.name || "Internal Server Error.";

	if (err instanceof AppError) {
		statusCode = err.statusCode;
		errorMessage = err.message;
		errorName = err.code;
	} else if (err instanceof Prisma.PrismaClientValidationError) {
		statusCode = httpStatus.BAD_REQUEST;
		errorMessage = "You have provided incorrect fields or missing fields.";
		errorName = err.name;
	} else if (err instanceof Prisma.PrismaClientKnownRequestError) {
		if (err.code === "P2002") {
			statusCode = httpStatus.BAD_REQUEST;
			errorMessage = "Duplicate key found.";
		} else if (err.code === "P2003") {
			statusCode = httpStatus.BAD_REQUEST;
			errorMessage = "Foreign key violation.";
		} else if (err.code === "P2025") {
			statusCode = httpStatus.BAD_REQUEST;
			errorMessage = "One or more records were required.";
		} else {
			statusCode = httpStatus.BAD_REQUEST;
			errorMessage = "Database request error.";
		}
	} else if (err instanceof Prisma.PrismaClientInitializationError) {
		if (err.errorCode === "P1000") {
			statusCode = httpStatus.UNAUTHORIZED;
			errorMessage = "Authentication failed against database server. Check the database credentials.";
		} else if (err.errorCode === "P1001") {
			statusCode = httpStatus.BAD_REQUEST;
			errorMessage = "Can't reach database server.";
		}
	}

	res.status(statusCode).json({
		success: false,
		statusCode,
		name: errorName,
		message: errorMessage,
		...(process.env.NODE_ENV === "development" && { error: err.stack }),
	});
};

export default globalErrorHandler;
