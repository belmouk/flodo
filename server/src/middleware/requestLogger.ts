import { pinoHttp } from "pino-http";
import logger from "../lib/logger.js";
import type { IncomingMessage, ServerResponse } from "http";
import { randomUUIDv7 } from "crypto";

const middleware = pinoHttp({
  logger,

  genReqId(req, res) {
    const id = randomUUIDv7();

    res.setHeader("X-Request-Id", id);

    return id;
  },

  autoLogging: {
    ignore: (req: IncomingMessage) => req.url === "/health",
  },

  customSuccessMessage() {
    return "request completed";
  },

  customErrorMessage() {
    return "request failed";
  },

  serializers: {
    req(req: IncomingMessage & { id?: string }) {
      const forwardedFor = req.headers["x-forwarded-for"];

      const clientIp =
        typeof forwardedFor === "string"
          ? forwardedFor.split(",")[0]?.trim()
          : req.socket?.remoteAddress;
      return {
        id: req.id || req.headers["x-request-id"],
        method: req.method,
        url: req.url,
        remoteAddress: clientIp,
      };
    },

    res(res: ServerResponse) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

export default middleware;
