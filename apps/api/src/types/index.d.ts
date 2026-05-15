import "express";
import { User } from "@nexus/database";

export declare global {
  namespace Express {
    interface Request {
      user?: User; // Add custom property to Request
    }
    interface Response {
      sendSuccess(data: any): void; // Add custom method to Response
    }
  }
}

export {};
