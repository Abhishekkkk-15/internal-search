import "express";

declare global {
  namespace Express {
    interface Request {
      user?: any; // Add custom property to Request
    }
    interface Response {
      sendSuccess(data: any): void; // Add custom method to Response
    }
  }
}

export {};
