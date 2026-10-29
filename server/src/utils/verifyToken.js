import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const isValidId = (id) =>
  (typeof id === "number" && Number.isInteger(id) && id > 0) ||
  (typeof id === "string" && id.trim().length > 0);

export function getUserIdFromToken(token) {
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  if (typeof decoded !== "object" || decoded === null || !isValidId(decoded.id)) {
    throw new Error("Invalid token payload");
  }
  return decoded.id;
}