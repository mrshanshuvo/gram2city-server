import { ObjectId } from "mongodb";

export interface FAQ {
  _id?: ObjectId;
  question: string;
  answer: string;
  order?: number;
  category?: string;
  isActive: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface FAQVote {
  _id?: ObjectId;
  faqId: ObjectId;
  identifier: string; // IP or Email
  timestamp: string;
}

export interface Review {
  _id?: ObjectId;
  rider_email: string;
  rating: number;
  comment?: string;
  date?: string;
  parcelId?: string;
  user_email?: string;
  [key: string]: unknown;
}

export interface Feedback {
  _id?: ObjectId;
  userEmail: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  category: "service" | "app" | "rider" | "other";
  timestamp: string;
  isResolved?: boolean;
}

export interface Notification {
  _id?: ObjectId;
  email: string;
  message: string;
  time: string;
  isRead: boolean;
  type: "status_update" | "payment" | "admin_alert" | string;
}

export interface ChatMessage {
  _id?: ObjectId;
  senderEmail: string;
  senderName: string;
  senderRole: string;
  receiverEmail: string;
  message: string;
  imageUrl?: string;
  timestamp: string;
  isRead: boolean;
  conversationId: string;
}
