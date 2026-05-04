import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { messagesCollection } from "./db";
import { ChatMessage } from "./types";

export let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`⚡ New connection: ${socket.id}`);

    // Join room for specific parcel tracking
    socket.on("join_parcel", (trackingId: string) => {
      socket.join(trackingId);
      console.log(`📍 Socket ${socket.id} joined tracking: ${trackingId}`);
    });

    // Handle rider location updates
    socket.on("rider_location_update", (data) => {
      const { trackingId, location } = data;
      // Broadcast to everyone in the parcel's room
      io.to(trackingId).emit("location_received", {
        trackingId,
        location,
        timestamp: new Date().toISOString()
      });
    });

    socket.on("disconnect", () => {
      console.log(`❌ Disconnected: ${socket.id}`);
    });
  });

  return io;
};
