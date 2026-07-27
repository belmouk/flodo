import express from "express";
import authRouter from "./auth/auth.routes.js";
import ApiError from "./lib/ApiError.js";
import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import ensureAuth from "./middleware/ensureAuth.js";
import workspacesRouter from "./workspaces/workspaces.routes.js";
import projectsRouter from "./projects/projects.routes.js";
import listsRouter from "./lists/lists.routes.js";
import tasksRouter from "./tasks/tasks.routes.js";

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use(ensureAuth);
app.use("/api/workspaces", workspacesRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/lists", listsRouter);
app.use("/api/tasks", tasksRouter);

app.use((req: Request, res: Response) =>
  res.status(404).send({
    message: "Resource not found",
    code: "ResourceNotFound",
    details: {},
  })
);

app.use(
  (
    err: ErrorRequestHandler,
    req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    if (err instanceof ApiError) {
      console.warn(`${err.status} ${err.code}`);
      return res.status(err.status).send({
        message: err.message,
        details: err.details,
        code: err.code,
        status: err.status,
      });
    } else {
      console.error(err);
      return res.status(500).send({
        message: "Oops something went wrong.",
        details: {},
        code: "InternalServerError",
        status: 500,
      });
    }
  }
);

export default app;
