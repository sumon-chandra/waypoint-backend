import { z } from "zod";

const RegistrationSchema = z.object({
	name: z.string({ error: "Name is required." }),
	email: z.string({ error: "Email is required." }).email({ error: "Email address is not valid." }),
	password: z
		.string({ error: "Password is required." })
		.min(6, { message: "Password must be at least 6 characters." })
		.regex(/[a-z]/, "Password must contain at least 1 Lowercase Letter.")
		.regex(/[A-Z]/, "Password must contain at least 1 Uppercase Letter.")
		.regex(/[0-9]/, "Password must contain at least 1 Number.")
		.regex(/[^A-Za-z0-9]/, "Password must contain at least 1 Special Character."),
});

const LoginSchema = z.object({
	email: z.string({ error: "Email is required." }).email({ error: "Email address is not valid." }),
	password: z.string({ error: "Password is required." }),
});

export { RegistrationSchema, LoginSchema };