import rateLimit from "express-rate-limit";
import { type RequestHandler } from "express";
import { apiRateLimitConfig, authRateLimitConfig } from "../../config/rate-limit.config";

/**
 * Global API rate limiter
 */
export const apiLimiter: RequestHandler = rateLimit(apiRateLimitConfig);

export const authLimiter: RequestHandler = rateLimit(authRateLimitConfig);
