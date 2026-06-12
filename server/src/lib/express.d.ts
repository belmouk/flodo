import * as express from "express";

declare global {
  namespace Express {
    interface Request {
      userId: number;
      projectId: number;
      listId: number;
      workspaceId: number;
    }
  }
}
