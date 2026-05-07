import express from "express";
import authRouter from "./auth/auth.routes.js";
import ApiError from "./lib/ApiError.js";
import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import ensureAuth from "./middleware/ensureAuth.js";
import workspacesRouter from "./workspaces/workspaces.routes.js";

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => res.send("Hello World"));
app.use("/api/auth", authRouter);
app.use(ensureAuth);
app.use("/api/workspaces", workspacesRouter);

app.use(
  (
    err: ErrorRequestHandler,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    console.error(err);
    if (err instanceof ApiError) {
      return res.status(err.status).send({
        message: err.message,
        details: err.details,
        code: err.code,
      });
    } else {
      return res.status(500).send({
        message: "Oops something went wrong.",
        details: {},
        code: "InternalServerError",
      });
    }
  },
);

export default app;
