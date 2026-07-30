import pino from "pino";
import CONFIG from "./config.js";

const pinoConfig: pino.LoggerOptions = {
  level: CONFIG.NODE_ENV === "development" ? "debug" : "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['set-cookie']",
    ],
    censor: "[REDACTED]",
  },
};

if (CONFIG.NODE_ENV === "development") {
  pinoConfig.transport = {
    target: "pino-pretty",
    options: { colorize: true },
  };
}

const logger = pino(pinoConfig);

export default logger;
