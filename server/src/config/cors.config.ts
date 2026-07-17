import { CorsOptions } from "cors";
import { env } from "./env.config";

// 1. Parse allowed origins
export const allowedOrigins = env.ORIGIN
  ? env.ORIGIN.split(",").map((o) => o.trim())
  : [];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // allow server-to-server / Postman in dev only
    if (!origin) {
      if (env.NODE_ENV === "production") {
        return callback(new Error("Not allowed by CORS"));
      }
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],

  optionsSuccessStatus: 200,

  maxAge: 86400, // cache preflight
};
