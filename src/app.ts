import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mainRouter from "./routes";
import globalErrorHandler from "./middlewares/global-error-handler";
import { notFound } from "./middlewares/not-found";

import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import envConfigs from "./configs/env-configs";

const app = express();

app.use(
	cors({
		origin: [envConfigs.frontend_url, "http://localhost:5173", "http://localhost:3000"],
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
	})
);

app.use(cookieParser());

// Mount Better Auth handler before express.json()
app.all(["/api/auth", "/api/auth/{*any}"], toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req: Request, res: Response) => {
	res.status(200).json({
		success: true,
		message: "Welcome to the server.",
	});
});

app.use("/api/v1/", mainRouter);
app.use(globalErrorHandler);
app.use(notFound);

export default app;