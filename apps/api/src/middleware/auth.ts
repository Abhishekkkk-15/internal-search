import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import { User } from "@nexus/database";
config(); // Load environment variables from .env file
export const authmiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  console.log("authHeader :", JSON.stringify(authHeader));
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  let token = String(authHeader).trim();
  if (token.toLowerCase().startsWith("bearer ")) {
    token = token.slice(7).trim();
  }

  if (token.startsWith("<") && token.endsWith(">")) {
    token = token.slice(1, -1).trim();
  }

  // Remove double quotes if the user accidentally copied them from Thunder Client
  if (token.startsWith('"') && token.endsWith('"')) { 
    token = token.slice(1, -1).trim();
  }

  // Remove single quotes
  if (token.startsWith("'") && token.endsWith("'")) {
    token = token.slice(1, -1).trim();
  }

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    console.log("Verifying with secret:", process.env.NEXTAUTH_SECRET);
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET as string);
    console.log("Decoded token :", decoded);
    req.user = decoded as User;
    next();
  } catch (error) {
    console.error("Token verify error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};
