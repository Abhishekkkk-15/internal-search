import { Request, Response, NextFunction } from "express";

// Fallback for requests to unknown routes
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handling middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  console.error(`[Error] ${error.message}`);
  if (process.env.NODE_ENV !== "production") {
    console.error(error.stack);
  }

  res.status(statusCode).json({
    status: false,
    message: error.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    data: [],
  });
};
