import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import {
  messagesCollection,
  usersCollection,
  notificationsCollection,
} from "../db/db";
import { ChatMessage } from "../types/types";
import { config } from "../config";
import { verifyFBToken } from "../middleware/auth";

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
      io.to(trackingId).emit("location_received", {
        trackingId,
        location,
        timestamp: new Date().toISOString(),
      });
    });

    // Register user email room on authentication
    socket.on("register_user", async (token: string) => {
      try {
        const decoded = await verifyFBTokenInSocket(token);
        if (decoded.email) {
          socket.join(decoded.email);
          console.log(
            `👤 Socket ${socket.id} joined user room: ${decoded.email}`,
          );

          // Also join admins room if user is admin or superAdmin
          const dbUser = await usersCollection.findOne({
            email: decoded.email,
          });
          if (dbUser?.role === "admin" || dbUser?.role === "superAdmin") {
            socket.join("admins");
            console.log(
              `🛠️ Socket ${socket.id} joined admins room via registration`,
            );
          }
        }
      } catch (err) {
        console.error("Failed to register user socket:", err);
      }
    });

    // Support Chat: Join conversation room
    socket.on("join_chat", async (conversationId: string, token?: string) => {
      if (token) {
        try {
          const decoded = await verifyFBTokenInSocket(token);
          if (decoded.email) {
            socket.join(decoded.email);
            console.log(
              `👤 Socket ${socket.id} joined user room: ${decoded.email}`,
            );

            // If the user has an admin or superAdmin role, join them to the shared 'admins' room
            const dbUser = await usersCollection.findOne({
              email: decoded.email,
            });
            if (dbUser?.role === "admin" || dbUser?.role === "superAdmin") {
              socket.join("admins");
              console.log(`🛠️ Socket ${socket.id} joined admins room`);
            }
          }
        } catch (err) {
          socket.emit("message_error", {
            message: "Unauthorized: invalid join token",
          });
          return;
        }
      }
      socket.join(conversationId);
      console.log(`💬 Socket ${socket.id} joined chat room: ${conversationId}`);
    });

    // Support Chat: Handle messages
    socket.on("send_message", async (data) => {
      try {
        const token = data?.token as string | undefined;
        if (!token) {
          socket.emit("message_error", {
            message: "Unauthorized: missing auth token",
          });
          return;
        }

        let decoded;
        try {
          decoded = await verifyFBTokenInSocket(token);
        } catch (err) {
          socket.emit("message_error", {
            message: "Unauthorized: invalid token",
          });
          return;
        }

        if (!decoded.email) {
          socket.emit("message_error", {
            message: "Unauthorized: missing email",
          });
          return;
        }

        let senderEmail = decoded.email;
        let senderRole = data.senderRole ?? "user";

        const dbUser = await usersCollection.findOne({ email: decoded.email });
        if (dbUser?.role === "admin" || dbUser?.role === "superAdmin") {
          senderEmail = "admin@gram2city.com";
          senderRole = dbUser.role;
        }

        const chatMessage: ChatMessage = {
          senderEmail,
          senderName: data.senderName ?? decoded.email,
          senderRole,
          receiverEmail: data.receiverEmail,
          message: data.message,
          imageUrl: data.imageUrl || undefined,
          timestamp: new Date().toISOString(),
          isRead: false,
          conversationId: data.conversationId,
        };

        await messagesCollection.insertOne(chatMessage);
        let broadcast = io.to(data.conversationId).to("admins");
        if (chatMessage.receiverEmail) {
          broadcast = broadcast.to(chatMessage.receiverEmail);
        }
        broadcast.emit("receive_message", chatMessage);

        // Send notifications
        if (senderEmail === "admin@gram2city.com") {
          if (chatMessage.receiverEmail) {
            const newNotif = {
              email: chatMessage.receiverEmail,
              message: `New message from Support: "${chatMessage.message.substring(0, 40)}${chatMessage.message.length > 40 ? "..." : ""}"`,
              time: new Date().toISOString(),
              isRead: false,
              type: "chat",
            };
            await notificationsCollection.insertOne(newNotif);
            io.to(chatMessage.receiverEmail).emit("new_notification", newNotif);
          }
        } else {
          const admins = await usersCollection
            .find({ role: { $in: ["admin", "superAdmin"] } })
            .toArray();
          for (const adminUser of admins) {
            const newNotif = {
              email: adminUser.email,
              message: `New support message from ${chatMessage.senderName}: "${chatMessage.message.substring(0, 40)}${chatMessage.message.length > 40 ? "..." : ""}"`,
              time: new Date().toISOString(),
              isRead: false,
              type: "chat",
            };
            await notificationsCollection.insertOne(newNotif);
            io.to(adminUser.email).emit("new_notification", newNotif);
          }
        }
      } catch (error) {
        console.error("Failed to process socket message:", error);
        socket.emit("message_error", {
          message: "Failed to send message",
        });
      }
    });

    socket.on("typing", async (data) => {
      const token = data?.token as string | undefined;
      if (!token) return;
      try {
        const decoded = await verifyFBTokenInSocket(token);
        io.to(data.conversationId).emit("user_typing", {
          senderEmail: decoded.email,
          conversationId: data.conversationId,
        });
      } catch (err) {
        // ignore typing auth errors
      }
    });

    socket.on("mark_messages_read", async (data) => {
      const token = data?.token as string | undefined;
      if (!token) {
        socket.emit("message_error", {
          message: "Unauthorized: missing read token",
        });
        return;
      }

      let decoded;
      try {
        decoded = await verifyFBTokenInSocket(token);
      } catch (err) {
        socket.emit("message_error", {
          message: "Unauthorized: invalid read token",
        });
        return;
      }

      try {
        let readByEmail = decoded.email ?? data.readByEmail;
        const dbUser = await usersCollection.findOne({ email: readByEmail });
        if (dbUser?.role === "admin" || dbUser?.role === "superAdmin") {
          readByEmail = "admin@gram2city.com";
        }

        await messagesCollection.updateMany(
          {
            conversationId: data.conversationId,
            receiverEmail: readByEmail,
            isRead: false,
          },
          { $set: { isRead: true } },
        );
        io.to(data.conversationId).emit("messages_marked_read", {
          conversationId: data.conversationId,
          readByEmail: readByEmail,
        });
      } catch (error) {
        console.error("Failed to mark messages read:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ Disconnected: ${socket.id}`);
    });
  });

  return io;
};

async function verifyFBTokenInSocket(token: string) {
  const { getAuth } = await import("firebase-admin/auth");
  return getAuth().verifyIdToken(token);
}
