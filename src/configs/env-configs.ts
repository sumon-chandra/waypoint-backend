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
	jwt_access_secret: (process.env.JWT_ACCESS_SECRET || "waypoint_jwt_access_secret_super_secure_key_123456") as string,
	jwt_access_expires_in: (process.env.JWT_ACCESS_EXPIRES_IN || "1d") as string,
	jwt_refresh_secret: (process.env.JWT_REFRESH_SECRET || "waypoint_jwt_refresh_secret_super_secure_key_654321") as string,
	jwt_refresh_expires_in: (process.env.JWT_REFRESH_EXPIRES_IN || "30d") as string,
	google_client_id: (process.env.GOOGLE_CLIENT_ID || "") as string,
	google_client_secret: (process.env.GOOGLE_CLIENT_SECRET || "") as string,
	google_callback_url: (process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/v1/auth/google/callback") as string,
	frontend_url: (process.env.FRONTEND_URL || "http://localhost:5173") as string,
};

export default envConfigs;