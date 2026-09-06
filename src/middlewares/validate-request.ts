import type { NextFunction, Request, Response } from "express";
import { z, type ZodType } from "zod";

export const validateRequest = (schema: ZodType) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (
				schema instanceof z.ZodObject &&
				("body" in (schema as any).shape || "query" in (schema as any).shape || "params" in (schema as any).shape)
			) {
				const parsed = await schema.parseAsync({
					body: req.body,
					query: req.query,
					params: req.params,
				});
				if (parsed.body !== undefined) {
					req.body = parsed.body;
				}
			} else {
				req.body = await schema.parseAsync(req.body);
			}
			next();
		} catch (error) {
			next(error);
		}
	};
};
