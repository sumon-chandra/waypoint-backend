import Stripe from "stripe";
import envConfigs from "../configs/env-configs";

export const stripe = new Stripe(envConfigs.stripe?.secret_key || envConfigs.stripe_secret_key || "sk_test_placeholder", {
	typescript: true,
});
