import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, username } from "better-auth/plugins";
import { prisma } from "./prisma";
import envConfigs from "../configs/env-configs";



export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	secret: envConfigs.better_auth_secret,
	baseURL: envConfigs.better_auth_url,
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		google: {
			clientId: envConfigs.google_client_id,
			clientSecret: envConfigs.google_client_secret,
			enabled: !!(envConfigs.google_client_id && envConfigs.google_client_secret),
		},
	},
	plugins: [
		username(),
		admin({
			defaultRole: "CUSTOMER",
			adminRole: "ADMIN",
			courierRole: "COURIER",
		}),
	],
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
