import dotenv from "dotenv";
import path from "path";

dotenv.config({
	path: path.join(process.cwd(), ".env"),
});

const envConfigs = {
	port: process.env.PORT || 5000,
	db_url: process.env.DATABASE_URL as string,
	app_url: (process.env.APP_URL || "http://localhost:5000") as string,
	node_env: process.env.NODE_ENV as string,
	better_auth_secret: (process.env.BETTER_AUTH_SECRET || "better_auth_secret_key_needs_to_be_at_least_32_chars_long_default") as string,
	better_auth_url: (process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:5000") as string,
	google_client_id: (process.env.GOOGLE_CLIENT_ID || "") as string,
	google_client_secret: (process.env.GOOGLE_CLIENT_SECRET || "") as string,
	frontend_url: (process.env.FRONTEND_URL || "http://localhost:5173") as string,
};

export default envConfigs;