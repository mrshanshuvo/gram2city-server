import { messagesCollection } from "../../db/db";
import { ChatMessage } from "../../types/types";

export class ChatService {
  static async getChatHistory(conversationId: string): Promise<ChatMessage[]> {
    return (await messagesCollection
      .find({ conversationId })
      .sort({ timestamp: 1 })
      .toArray()) as unknown as ChatMessage[];
  }

  static async getUserConversations(email: string): Promise<any[]> {
    return messagesCollection
      .aggregate([
        {
          $match: {
            $or: [{ senderEmail: email }, { receiverEmail: email }],
          },
        },
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: "$conversationId",
            lastMessage: { $first: "$$ROOT" },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$receiverEmail", email] },
                      { $eq: ["$isRead", false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { "lastMessage.timestamp": -1 } },
      ])
      .toArray();
  }
}
