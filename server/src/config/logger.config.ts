import winston from "winston";
import { env } from "./env.config";

export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    env.NODE_ENV === "production"
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, requestId, stack }) => {
            const reqIdStr = requestId ? ` [ReqID: ${requestId}]` : "";
            return `[${timestamp}] ${level}${reqIdStr}: ${message} ${stack ? `\n${stack}` : ''}`;
          })
        )
  ),
  transports: [new winston.transports.Console()],
});
