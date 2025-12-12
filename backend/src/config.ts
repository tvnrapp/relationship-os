import * as dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 4000;
export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";