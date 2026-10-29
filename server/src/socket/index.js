import { Server } from "socket.io";
import { env } from "../config/env.js";
import { getUserIdFromToken } from "../utils/verifyToken.js";

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.FRONTEND_URL, credentials: true },
  });

  io.use((socket, next) => {
    try {
      // 1. token sent by the client (from /api/socket-token)
      let token = socket.handshake.auth?.token;

      // 2. fall back to the login cookie
      if (!token) {
        const cookieHeader = socket.handshake.headers.cookie;
        token = cookieHeader
          ?.split(";")
          .map((c) => c.trim())
          .find((c) => c.startsWith("token="))
          ?.slice("token=".length);
      }

      if (!token) return next(new Error("No token"));
      socket.userId = getUserIdFromToken(token);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);
    console.log("Socket connected:", socket.userId);
    socket.on("disconnect", () => console.log("Socket disconnected:", socket.userId));
  });

  return io;
}
export function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}