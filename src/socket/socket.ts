import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { messagesCollection } from "../db/db";
import { ChatMessage } from "../types/types";
import { config } from "../config";

export let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: config.CLIENT_URL,
      methods: ["GET", "POST"],
    },
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
        timestamp: new Date().toISOString(),
      });
    });

    // Support Chat: Join conversation room
    socket.on("join_chat", (conversationId: string) => {
      socket.join(conversationId);
      console.log(`💬 Socket ${socket.id} joined chat room: ${conversationId}`);
    });

    // Support Chat: Handle messages
    socket.on("send_message", async (data) => {
      try {
        const chatMessage: ChatMessage = {
          senderEmail: data.senderEmail,
          senderName: data.senderName,
          senderRole: data.senderRole,
          receiverEmail: data.receiverEmail,
          message: data.message,
          imageUrl: data.imageUrl || undefined,
          timestamp: new Date().toISOString(),
          isRead: false,
          conversationId: data.conversationId,
        };

        // Save to DB
        await messagesCollection.insertOne(chatMessage);

        // Broadcast to everyone in the chat room
        io.to(data.conversationId).emit("receive_message", chatMessage);
      } catch (error) {
        console.error("Failed to process socket message:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ Disconnected: ${socket.id}`);
    });
  });

  return io;
};
