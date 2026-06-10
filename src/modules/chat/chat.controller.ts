import { Request, Response } from "express";
import { ChatService } from "./chat.service";
import { usersCollection } from "../../db/db";
import { uploadToCloudinary } from "../../utils/upload";
import * as fs from "fs";
import * as path from "path";

const logDebug = (msg: string) => {
  try {
    console.log(`[DEBUG] ${msg}`);
    fs.appendFileSync(
      path.join(__dirname, "../../../debug.log"),
      `[${new Date().toISOString()}] ${msg}\n`,
    );
  } catch (err) {}
};

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userEmail = req.user?.email as string;

    if (!conversationId.includes(userEmail)) {
      const user = await usersCollection.findOne({ email: userEmail });
      if (user?.role !== "admin" && user?.role !== "superAdmin") {
        return res.status(403).send({
          success: false,
          message: "Unauthorized to view this conversation",
        });
      }
    }

    const messages = await ChatService.getChatHistory(
      conversationId as string,
    );
    res.send({ success: true, data: messages });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch messages" });
  }
};

export const getUserConversations = async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email as string;
    const user = await usersCollection.findOne({ email: userEmail });
    const isAdmin = user?.role === "admin" || user?.role === "superAdmin";
    const queryEmail = isAdmin ? "admin@gram2city.com" : userEmail;

    logDebug(
      `getUserConversations: userEmail=${userEmail}, role=${user?.role}, queryEmail=${queryEmail}`,
    );

    const conversations = await ChatService.getUserConversations(queryEmail);

    logDebug(`getUserConversations results count: ${conversations.length}`);

    res.send({ success: true, data: conversations });
  } catch (error: any) {
    logDebug(`getUserConversations ERROR: ${error.message || error}`);
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch conversations" });
  }
};

export const uploadChatImage = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).send({
      success: false,
      message: "No file uploaded or file type not supported",
    });
  }

  try {
    const url = await uploadToCloudinary(req.file, "gram2city/chat");
    res.send({ success: true, url });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to upload image" });
  }
};
