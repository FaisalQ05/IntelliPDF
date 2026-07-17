import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { corsOptions } from "../config/cors.config";
import { requestIdMiddleware } from "../common/middleware/request-id.middleware";
import { notFoundMiddleware } from "../common/middleware/not-found.middleware";
import { errorMiddleware } from "../common/middleware/error.middleware";
import { createContainer } from "../container";
import { createRouter } from "./router";
import { apiLimiter } from "../common/middleware/rate-limit.middleware";

const app: Express = express();

app.set("trust proxy", 1);

// Security & Request tracking
app.use(requestIdMiddleware);
app.use(helmet());
app.use(cors(corsOptions));
app.use(apiLimiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(morgan("dev"));

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Dependency Injection & Routing
export const container = createContainer();
const router = createRouter(container);
app.use(router);

// Error handling (must be last)
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
