import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Nexus Assistant API is running" });
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Middleware for unknown routes and global error handling
import { notFound, errorHandler } from "./middleware/error-handler";
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Nexus Assistant Backend Server is running on port ${port}`);
});
