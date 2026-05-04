import { Router } from "express";
import { messagesCollection } from "../db";
import { verifyFBToken } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /messages/{conversationId}:
 *   get:
 *     summary: Get chat history for a conversation
 *     tags: [Communication]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/messages/:conversationId", verifyFBToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userEmail = req.user.email;

    // Security Check: Ensure the user is part of the conversation
    if (!conversationId.includes(userEmail as string)) {
      // Admins and SuperAdmins can view any conversation for support
      const { usersCollection } = require("../db");
      const user = await usersCollection.findOne({ email: userEmail });
      if (user?.role !== "admin" && user?.role !== "superAdmin") {
        return res.status(403).send({ success: false, message: "Unauthorized to view this conversation" });
      }
    }

    const messages = await messagesCollection
      .find({ conversationId })
      .sort({ timestamp: 1 })
      .toArray();

    res.send({ success: true, data: messages });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch messages" });
  }
});

/**
 * @swagger
 * /messages/conversations:
 *   get:
 *     summary: Get list of active conversations for the current user
 *     tags: [Communication]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/messages/conversations", verifyFBToken, async (req, res) => {
  try {
    const userEmail = req.user.email;

    const conversations = await messagesCollection.aggregate([
      { 
        $match: { 
          $or: [
            { senderEmail: userEmail },
            { receiverEmail: userEmail }
          ] 
        } 
      },
      { $sort: { timestamp: -1 } },
      { 
        $group: { 
          _id: "$conversationId", 
          lastMessage: { $first: "$$ROOT" },
          unreadCount: { 
            $sum: { 
              $cond: [
                { $and: [{ $eq: ["$receiverEmail", userEmail] }, { $eq: ["$isRead", false] }] },
                1, 
                0
              ] 
            } 
          }
        } 
      },
      { $sort: { "lastMessage.timestamp": -1 } }
    ]).toArray();

    res.send({ success: true, data: conversations });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch conversations" });
  }
});

export default router;
