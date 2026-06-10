import { contentSwagger } from "../modules/content/content.swagger";
import { authSwagger } from "../modules/auth/auth.swagger";
import { userSwagger } from "../modules/user/user.swagger";
import { adminSwagger } from "../modules/admin/admin.swagger";
import { parcelSwagger } from "../modules/parcel/parcel.swagger";
import { riderSwagger } from "../modules/rider/rider.swagger";
import { financeSwagger } from "../modules/finance/finance.swagger";
import { faqSwagger } from "../modules/faq/faq.swagger";
import { feedbackSwagger } from "../modules/feedback/feedback.swagger";
import { chatSwagger } from "../modules/chat/chat.swagger";
import { notificationSwagger } from "../modules/notification/notification.swagger";

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Gram2City Logistics Enterprise API",
    version: "2.3.0",
    description:
      "Enterprise-grade logistics and supply chain management API for Gram2City. Powering real-time tracking, multi-region hub management, and dynamic marketing ecosystems.",
  },
  tags: [
    {
      name: "Public - System",
      description: "Core system health and status",
    },
    {
      name: "Public - Authentication",
      description: "Identity and access management",
    },
    {
      name: "Public - Logistics",
      description: "Public parcel tracking and network search",
    },
    {
      name: "Public - Newsletter",
      description: "Marketing and subscriptions",
    },
    {
      name: "Customer - Parcel Management",
      description: "Booking and tracking personal parcels",
    },
    {
      name: "Customer - Payment Management",
      description: "Financial transactions and history",
    },
    {
      name: "Customer - Feedback",
      description: "Rider reviews and service feedback",
    },
    {
      name: "Rider - Logistics Operations",
      description: "Pickup and delivery management",
    },
    {
      name: "Admin - Statistics",
      description: "Platform-wide metrics and revenue",
    },
    {
      name: "Admin - Audit Logs",
      description: "Security and operation logs",
    },
    {
      name: "Admin - Announcements",
      description: "Bulk communication management",
    },
    {
      name: "Admin - System Settings",
      description: "Global fee and commission configuration",
    },
    {
      name: "Admin - User Management",
      description: "Account lifecycle and role assignment",
    },
    {
      name: "Admin - Logistics Management",
      description: "Global parcel oversight and rider assignment",
    },
    {
      name: "Admin - Rider Management",
      description: "Rider application and status management",
    },
    {
      name: "Admin - Content Settings",
      description: "Global content and settings configurations",
    },
    {
      name: "Admin - Banner Management",
      description: "Hero section and marketing banners",
    },
    {
      name: "Admin - Service Management",
      description: "Service offering configurations",
    },
    {
      name: "Admin - Feature Management",
      description: "Platform feature highlight cards",
    },
    {
      name: "Admin - Partner Management",
      description: "Partner and client logo management",
    },
    {
      name: "Admin - Testimonial Management",
      description: "User review and testimonial management",
    },
    {
      name: "Admin - Process Management",
      description: "Operational step-by-step guides",
    },
    {
      name: "Merchant - Business Intelligence",
      description: "Business stats and application management",
    },
    {
      name: "Rider - Financials",
      description: "Payout requests and earnings management",
    },
    {
      name: "Admin - Financials",
      description: "Payout oversight and financial audits",
    },
    {
      name: "Public - System Services",
      description: "Pricing and public tracking tools",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your Firebase ID token (without 'Bearer ' prefix).",
      },
    },
    schemas: {
      ContactInfo: {
        type: "object",
        properties: {
          address: {
            type: "string",
            example: "Plot 45, Gulshan Avenue, Dhaka",
          },
          phone: {
            type: "string",
            example: "+880 1700 000 000",
          },
          whatsapp: {
            type: "string",
            example: "+880 1700 000 000",
          },
          email: {
            type: "string",
            example: "support@gram2city.com",
          },
        },
      },
      MerchantSection: {
        type: "object",
        properties: {
          title: {
            type: "string",
          },
          description: {
            type: "string",
          },
          benefits: {
            type: "array",
            items: {
              type: "string",
            },
          },
          ctaText: {
            type: "string",
          },
          ctaLink: {
            type: "string",
          },
        },
      },
      FeatureCard: {
        type: "object",
        properties: {
          _id: {
            type: "string",
          },
          title: {
            type: "string",
          },
          description: {
            type: "string",
          },
          image: {
            type: "string",
          },
          order: {
            type: "number",
          },
          isActive: {
            type: "boolean",
          },
        },
      },
      Testimonial: {
        type: "object",
        properties: {
          _id: {
            type: "string",
          },
          name: {
            type: "string",
          },
          title: {
            type: "string",
          },
          quote: {
            type: "string",
          },
          image: {
            type: "string",
          },
          rating: {
            type: "number",
          },
          isActive: {
            type: "boolean",
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    ...contentSwagger,
    ...authSwagger,
    ...userSwagger,
    ...adminSwagger,
    ...parcelSwagger,
    ...riderSwagger,
    ...financeSwagger,
    ...faqSwagger,
    ...feedbackSwagger,
    ...chatSwagger,
    ...notificationSwagger,
  },
};
