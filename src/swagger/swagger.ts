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
      name: "Admin - Landing Config",
      description: "Global landing page settings",
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
    "/": {
      get: {
        summary: "Health Check",
        tags: ["Public - System"],
        security: [],
        responses: {
          "200": {
            description: "Server is running",
          },
        },
      },
    },
    "/upload": {
      post: {
        summary: "Upload Image to Cloudinary",
        tags: ["Public - System"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  image: {
                    type: "string",
                    format: "binary",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    url: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        summary: "Register a new user",
        tags: ["Public - Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["email", "password", "name"],
                properties: {
                  email: {
                    type: "string",
                    example: "string",
                  },
                  password: {
                    type: "string",
                    example: "string",
                  },
                  name: {
                    type: "string",
                    example: "string",
                  },
                  image: {
                    type: "string",
                    format: "binary",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
          },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Login user",
        tags: ["Public - Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    example: "string",
                  },
                  password: {
                    type: "string",
                    example: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Get my profile",
        tags: ["Public - Authentication"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
      delete: {
        summary: "Delete my account",
        tags: ["Public - Authentication"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/auth/send-verification": {
      post: {
        summary: "Send verification email",
        tags: ["Public - Authentication"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        summary: "Reset password email",
        tags: ["Public - Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    example: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/users/sync": {
      post: {
        summary: "Sync user session and get role",
        tags: ["Public - Authentication"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    user: {
                      type: "object",
                      properties: {
                        email: {
                          type: "string",
                        },
                        name: {
                          type: "string",
                        },
                        role: {
                          type: "string",
                          enum: ["user", "rider", "admin"],
                        },
                        photoURL: {
                          type: "string",
                        },
                        last_login: {
                          type: "string",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/parcels": {
      get: {
        summary: "My booked parcels",
        tags: ["Customer - Parcel Management"],
        parameters: [
          {
            name: "email",
            in: "query",
            schema: {
              type: "string",
              example: "string",
            },
          },
          {
            name: "payment_status",
            in: "query",
            schema: {
              type: "string",
              enum: ["paid", "unpaid"],
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
      post: {
        summary: "Book a new parcel",
        tags: ["Customer - Parcel Management"],
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: [
                  "parcelName",
                  "parcelType",
                  "weight",
                  "receiverName",
                  "receiverPhone",
                  "deliveryAddress",
                  "receiverDistrict",
                ],
                properties: {
                  parcelName: {
                    type: "string",
                    example: "string",
                  },
                  parcelType: {
                    type: "string",
                    example: "string",
                  },
                  weight: {
                    type: "number",
                    example: 0,
                  },
                  receiverName: {
                    type: "string",
                    example: "string",
                  },
                  receiverPhone: {
                    type: "string",
                    example: "string",
                  },
                  deliveryAddress: {
                    type: "string",
                    example: "string",
                  },
                  receiverDistrict: {
                    type: "string",
                    example: "string",
                  },
                  senderPhone: {
                    type: "string",
                    example: "string",
                  },
                  deliveryDate: {
                    type: "string",
                    format: "date",
                    example: "string",
                  },
                  cost: {
                    type: "number",
                    example: 0,
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
          },
        },
      },
    },
    "/users/{email}": {
      patch: {
        summary: "Update my profile",
        tags: ["Customer - Parcel Management"],
        parameters: [
          {
            name: "email",
            in: "path",
            required: true,
            schema: {
              type: "string",
              example: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    example: "string",
                  },
                  phone: {
                    type: "string",
                    example: "string",
                  },
                  address: {
                    type: "string",
                    example: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/payments": {
      post: {
        summary: "Pay for a parcel",
        tags: ["Customer - Payment Management"],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  parcelId: {
                    type: "string",
                    example: "string",
                  },
                  transactionId: {
                    type: "string",
                    example: "string",
                  },
                  amount: {
                    type: "number",
                    example: 0,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
      get: {
        summary: "My payment history",
        tags: ["Customer - Payment Management"],
        parameters: [
          {
            name: "email",
            in: "query",
            schema: {
              type: "string",
              example: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/reviews": {
      get: {
        summary: "Get my reviews (as a logged-in Rider)",
        tags: ["Rider - Logistics Operations"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
      post: {
        summary: "Submit a review for a rider",
        tags: ["Customer - Feedback"],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  rider_email: {
                    type: "string",
                  },
                  rating: {
                    type: "integer",
                  },
                  comment: {
                    type: "string",
                  },
                  parcelId: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/trackings/{trackingId}": {
      get: {
        summary: "Track my parcel",
        tags: ["Public - Logistics"],
        security: [],
        parameters: [
          {
            name: "trackingId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              example: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/rider/parcels": {
      get: {
        summary: "Parcels assigned to me",
        tags: ["Rider - Logistics Operations"],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/parcels/{id}/pick": {
      patch: {
        summary: "Mark parcel as picked up",
        tags: ["Rider - Logistics Operations"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
              example: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/rider/parcels/{id}/status": {
      patch: {
        summary: "Update delivery status",
        tags: ["Rider - Logistics Operations"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
              example: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  delivery_status: {
                    type: "string",
                    enum: ["pending", "on_the_way", "delivered"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/rider/cashout": {
      post: {
        summary: "Cash out my earnings (Legacy)",
        tags: ["Rider - Logistics Operations"],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  parcelId: {
                    type: "string",
                    example: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/admin/stats": {
      get: {
        summary: "Get Platform Statistics",
        tags: ["Admin - Statistics"],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/admin/all-parcels": {
      get: {
        summary: "List All Platform Parcels",
        tags: ["Admin - Logistics Management"],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: {
              type: "string",
              default: "1",
            },
          },
          {
            name: "size",
            in: "query",
            schema: {
              type: "string",
              default: "10",
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/users/{email}/role": {
      patch: {
        summary: "Update User Role",
        tags: ["Admin - User Management"],
        parameters: [
          {
            name: "email",
            in: "path",
            required: true,
            schema: {
              type: "string",
              example: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["role"],
                properties: {
                  role: {
                    type: "string",
                    enum: ["user", "rider", "admin"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/parcels/{id}/assign": {
      patch: {
        summary: "Assign Rider to Parcel",
        tags: ["Admin - Logistics Management"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
              example: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  riderId: {
                    type: "string",
                    example: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/riders/{id}/status": {
      patch: {
        summary: "Update Rider Application Status",
        tags: ["Admin - Rider Management"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
              example: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["approved", "rejected"],
                  },
                  email: {
                    type: "string",
                    example: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/admin/announce": {
      post: {
        summary: "Create Bulk Announcement",
        tags: ["Admin - Announcements"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: {
                    type: "string",
                    example: "System maintenance tonight at 2 AM.",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Announcement sent",
          },
        },
      },
    },
    "/auth/admin/create-user": {
      post: {
        summary: "Onboard New Admin/Rider",
        tags: ["Admin - User Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["email", "password", "name", "role"],
                properties: {
                  email: {
                    type: "string",
                  },
                  password: {
                    type: "string",
                  },
                  name: {
                    type: "string",
                  },
                  role: {
                    type: "string",
                    enum: ["admin", "rider", "user"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
          },
        },
      },
    },
    "/admin/audit-logs": {
      get: {
        summary: "List Administrative Audit Logs",
        tags: ["Admin - Audit Logs"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/admin/settings": {
      get: {
        summary: "Get Global System Settings",
        tags: ["Admin - System Settings"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
      patch: {
        summary: "Update Global System Settings",
        tags: ["Admin - System Settings"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  base_delivery_fee: {
                    type: "number",
                    example: 50,
                  },
                  cost_per_kg: {
                    type: "number",
                    example: 20,
                  },
                  rider_commission_percentage: {
                    type: "number",
                    example: 15,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/admin/users/{email}/status": {
      patch: {
        summary: "Update User Account Status",
        tags: ["Admin - User Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "email",
            in: "path",
            required: true,
            schema: {
              type: "string",
              example: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["active", "suspended"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/admin/payouts": {
      get: {
        summary: "List All Payout Requests",
        tags: ["Admin - Financials"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/admin/payouts/{id}/status": {
      patch: {
        summary: "Approve/Reject Payout",
        tags: ["Admin - Financials"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["approved", "rejected"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/landing/config": {
      get: {
        summary: "Get global landing configuration",
        tags: ["Admin - Landing Config"],
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    data: {
                      type: "object",
                      properties: {
                        merchantSection: {
                          $ref: "#/components/schemas/MerchantSection",
                        },
                        contactInfo: {
                          $ref: "#/components/schemas/ContactInfo",
                        },
                        howItWorksFooter: {
                          type: "string",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      patch: {
        summary: "Update global landing configuration",
        tags: ["Admin - Landing Config"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["howItWorksFooter"],
                properties: {
                  "merchantSection.title": {
                    type: "string",
                  },
                  "merchantSection.description": {
                    type: "string",
                  },
                  "contactInfo.phone": {
                    type: "string",
                  },
                  "contactInfo.email": {
                    type: "string",
                  },
                  howItWorksFooter: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/landing/features": {
      get: {
        summary: "List Feature Cards",
        tags: ["Admin - Feature Management"],
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/FeatureCard",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create Feature Card",
        tags: ["Admin - Feature Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["title", "description"],
                properties: {
                  title: {
                    type: "string",
                  },
                  description: {
                    type: "string",
                  },
                  image: {
                    type: "string",
                    format: "binary",
                  },
                  order: {
                    type: "number",
                  },
                  isActive: {
                    type: "boolean",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
          },
        },
      },
    },
    "/landing/features/{id}": {
      patch: {
        summary: "Update Feature Card",
        tags: ["Admin - Feature Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                  },
                  description: {
                    type: "string",
                  },
                  image: {
                    type: "string",
                    format: "binary",
                  },
                  order: {
                    type: "number",
                  },
                  isActive: {
                    type: "boolean",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated",
          },
        },
      },
      delete: {
        summary: "Delete Feature Card",
        tags: ["Admin - Feature Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Deleted",
          },
        },
      },
    },
    "/landing/testimonials": {
      get: {
        summary: "List Testimonials",
        tags: ["Admin - Testimonial Management"],
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Testimonial",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create Testimonial",
        tags: ["Admin - Testimonial Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["name", "quote"],
                properties: {
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
                    format: "binary",
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
        },
        responses: {
          "201": {
            description: "Created",
          },
        },
      },
    },
    "/landing/testimonials/{id}": {
      patch: {
        summary: "Update Testimonial",
        tags: ["Admin - Testimonial Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
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
                    format: "binary",
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
        },
        responses: {
          "200": {
            description: "Updated",
          },
        },
      },
      delete: {
        summary: "Delete Testimonial",
        tags: ["Admin - Testimonial Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Deleted",
          },
        },
      },
    },
    "/landing/banners": {
      get: {
        summary: "List Active Banners",
        tags: ["Admin - Banner Management"],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
      post: {
        summary: "Create New Banner",
        tags: ["Admin - Banner Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["title", "image"],
                properties: {
                  title: {
                    type: "string",
                  },
                  description: {
                    type: "string",
                  },
                  image: {
                    type: "string",
                    format: "binary",
                  },
                  ctaText: {
                    type: "string",
                  },
                  ctaLink: {
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
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
          },
        },
      },
    },
    "/landing/banners/{id}": {
      patch: {
        summary: "Update Banner",
        tags: ["Admin - Banner Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                  },
                  description: {
                    type: "string",
                  },
                  image: {
                    type: "string",
                    format: "binary",
                  },
                  ctaText: {
                    type: "string",
                  },
                  ctaLink: {
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
            },
          },
        },
        responses: {
          "200": {
            description: "Updated",
          },
        },
      },
      delete: {
        summary: "Delete Banner",
        tags: ["Admin - Banner Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Deleted",
          },
        },
      },
    },
    "/landing/services": {
      get: {
        summary: "List Active Services",
        tags: ["Admin - Service Management"],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
      post: {
        summary: "Create New Service",
        tags: ["Admin - Service Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["title", "description"],
                properties: {
                  title: {
                    type: "string",
                  },
                  description: {
                    type: "string",
                  },
                  icon: {
                    type: "string",
                  },
                  image: {
                    type: "string",
                    format: "binary",
                  },
                  order: {
                    type: "number",
                  },
                  isActive: {
                    type: "boolean",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
          },
        },
      },
    },
    "/landing/services/{id}": {
      patch: {
        summary: "Update Service",
        tags: ["Admin - Service Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                  },
                  description: {
                    type: "string",
                  },
                  icon: {
                    type: "string",
                  },
                  image: {
                    type: "string",
                    format: "binary",
                  },
                  order: {
                    type: "number",
                  },
                  isActive: {
                    type: "boolean",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated",
          },
        },
      },
      delete: {
        summary: "Delete Service",
        tags: ["Admin - Service Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Deleted",
          },
        },
      },
    },
    "/landing/warehouses": {
      get: {
        summary: "Search & Filter Warehouse Network",
        description:
          "Retrieve the full logistics network with advanced server-side filtering by region, district, or operational status.",
        tags: ["Public - Logistics"],
        parameters: [
          {
            name: "search",
            in: "query",
            required: false,
            schema: {
              type: "string",
              example: "Dhaka",
            },
            description:
              "Global search across City, District, and Region fields (case-insensitive).",
          },
          {
            name: "district",
            in: "query",
            required: false,
            schema: {
              type: "string",
              example: "Bogura",
            },
            description: "Filter exactly by a specific district name.",
          },
          {
            name: "status",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["active", "limited", "coming-soon"],
              example: "active",
            },
            description: "Filter hubs by their operational readiness.",
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/landing/partners": {
      get: {
        summary: "List Partner Logos",
        tags: ["Admin - Partner Management"],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
      post: {
        summary: "Create New Partner",
        tags: ["Admin - Partner Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["name", "logo"],
                properties: {
                  name: {
                    type: "string",
                  },
                  logo: {
                    type: "string",
                    format: "binary",
                  },
                  website: {
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
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
          },
        },
      },
    },
    "/landing/partners/{id}": {
      patch: {
        summary: "Update Partner",
        tags: ["Admin - Partner Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                  },
                  logo: {
                    type: "string",
                    format: "binary",
                  },
                  website: {
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
            },
          },
        },
        responses: {
          "200": {
            description: "Updated",
          },
        },
      },
      delete: {
        summary: "Delete Partner",
        tags: ["Admin - Partner Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Deleted",
          },
        },
      },
    },
    "/landing/process-steps": {
      get: {
        summary: "List Process Steps",
        tags: ["Admin - Process Management"],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
      post: {
        summary: "Create Process Step",
        tags: ["Admin - Process Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                  },
                  description: {
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
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
          },
        },
      },
    },
    "/landing/process-steps/{id}": {
      patch: {
        summary: "Update Process Step",
        tags: ["Admin - Process Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["title", "description"],
                properties: {
                  title: {
                    type: "string",
                  },
                  description: {
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
            },
          },
        },
        responses: {
          "200": {
            description: "Updated",
          },
        },
      },
      delete: {
        summary: "Delete Process Step",
        tags: ["Admin - Process Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Deleted",
          },
        },
      },
    },
    "/landing/subscribe": {
      post: {
        summary: "Subscribe to newsletter",
        tags: ["Public - Newsletter"],
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/landing/newsletter": {
      get: {
        summary: "Get all newsletter subscribers (Admin Only)",
        tags: ["Admin - Landing Config"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/merchants": {
      post: {
        summary: "Submit Merchant Application",
        tags: ["Merchant - Business Intelligence"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["businessName", "businessType", "shopAddress"],
                properties: {
                  businessName: {
                    type: "string",
                  },
                  businessType: {
                    type: "string",
                  },
                  shopAddress: {
                    type: "string",
                  },
                  contactNumber: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
          },
        },
      },
    },
    "/merchants/stats": {
      get: {
        summary: "Get Merchant Performance Stats",
        tags: ["Merchant - Business Intelligence"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/public/settings": {
      get: {
        summary: "Get Pricing Configuration",
        tags: ["Public - System Services"],
        security: [],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/public/tracking/{trackingId}": {
      get: {
        summary: "Live Parcel Tracking History",
        tags: ["Public - System Services"],
        security: [],
        parameters: [
          {
            name: "trackingId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/riders": {
      get: {
        summary: "List all riders (with pagination)",
        tags: ["Admin - Rider Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
            },
          },
          {
            name: "page",
            in: "query",
            schema: {
              type: "integer",
              default: 1,
            },
          },
          {
            name: "size",
            in: "query",
            schema: {
              type: "integer",
              default: 50,
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
      post: {
        summary: "Submit rider application",
        tags: ["Rider - Logistics Operations"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "phone", "district"],
                properties: {
                  name: {
                    type: "string",
                  },
                  email: {
                    type: "string",
                  },
                  phone: {
                    type: "string",
                  },
                  district: {
                    type: "string",
                  },
                  region: {
                    type: "string",
                  },
                  vehicleType: {
                    type: "string",
                    enum: ["bike", "car", "mini_pickup", "large_pickup"],
                  },
                  vehicleNumber: {
                    type: "string",
                  },
                  drivingLicense: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Success",
          },
        },
      },
    },
    "/rider/stats": {
      get: {
        summary: "My delivery stats",
        tags: ["Rider - Logistics Operations"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/reviews/rider/{email}": {
      get: {
        summary: "Get reviews for a specific rider by email",
        tags: ["Customer - Feedback"],
        parameters: [
          {
            name: "email",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/parcels/stats": {
      get: {
        summary: "Get my parcel statistics",
        tags: ["Customer - Parcel Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/parcels/bulk": {
      post: {
        summary: "Bulk upload parcels (Merchant)",
        tags: ["Merchant - Business Intelligence"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  type: "object",
                  required: [
                    "parcelName",
                    "receiverName",
                    "receiverPhone",
                    "deliveryAddress",
                    "cost",
                    "weight",
                  ],
                  properties: {
                    trackingId: {
                      type: "string",
                    },
                    parcelName: {
                      type: "string",
                    },
                    parcelType: {
                      type: "string",
                    },
                    weight: {
                      type: "number",
                    },
                    receiverName: {
                      type: "string",
                    },
                    receiverPhone: {
                      type: "string",
                    },
                    deliveryAddress: {
                      type: "string",
                    },
                    receiverDistrict: {
                      type: "string",
                    },
                    cost: {
                      type: "number",
                    },
                    requiredVehicle: {
                      type: "string",
                    },
                    codAmount: {
                      type: "number",
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/trackings": {
      post: {
        summary: "Add manual tracking update (Admin)",
        tags: ["Admin - Logistics Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["trackingId", "status", "details"],
                properties: {
                  trackingId: {
                    type: "string",
                  },
                  status: {
                    type: "string",
                  },
                  details: {
                    type: "string",
                  },
                  location: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/trackings/all/recent": {
      get: {
        summary: "Get platform-wide recent trackings (Admin)",
        tags: ["Admin - Logistics Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/addresses": {
      get: {
        summary: "Get my saved addresses",
        tags: ["Customer - Parcel Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
      post: {
        summary: "Save a new address",
        tags: ["Customer - Parcel Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "label",
                  "fullName",
                  "phone",
                  "address",
                  "district",
                  "region",
                ],
                properties: {
                  label: {
                    type: "string",
                  },
                  fullName: {
                    type: "string",
                  },
                  phone: {
                    type: "string",
                  },
                  address: {
                    type: "string",
                  },
                  district: {
                    type: "string",
                  },
                  region: {
                    type: "string",
                  },
                  isDefault: {
                    type: "boolean",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Success",
          },
        },
      },
    },
    "/addresses/{id}": {
      delete: {
        summary: "Delete a saved address",
        tags: ["Customer - Parcel Management"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/avatars": {
      get: {
        summary: "Get all avatar options",
        tags: ["Public - System"],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
      post: {
        summary: "Add a new avatar option (Admin)",
        tags: ["Admin - System Settings"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url"],
                properties: {
                  url: {
                    type: "string",
                  },
                  name: {
                    type: "string",
                  },
                  category: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Success",
          },
        },
      },
    },
    "/avatars/random": {
      get: {
        summary: "Get a random avatar url",
        tags: ["Public - System"],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/avatars/magic-generate": {
      post: {
        summary: "Magic generate seed avatars (Admin)",
        tags: ["Admin - System Settings"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/avatars/{id}": {
      delete: {
        summary: "Delete an avatar option (Admin)",
        tags: ["Admin - System Settings"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/faqs": {
      get: {
        summary: "List public FAQs",
        tags: ["Customer - Feedback"],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
      post: {
        summary: "Create a new FAQ (Admin)",
        tags: ["Admin - System Settings"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["question", "answer"],
                properties: {
                  question: {
                    type: "string",
                  },
                  answer: {
                    type: "string",
                  },
                  order: {
                    type: "integer",
                  },
                  category: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Success",
          },
        },
      },
    },
    "/faqs/{id}": {
      patch: {
        summary: "Update an FAQ (Admin)",
        tags: ["Admin - System Settings"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  question: {
                    type: "string",
                  },
                  answer: {
                    type: "string",
                  },
                  order: {
                    type: "integer",
                  },
                  category: {
                    type: "string",
                  },
                  isActive: {
                    type: "boolean",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
      delete: {
        summary: "Delete an FAQ (Admin)",
        tags: ["Admin - System Settings"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/faqs/{id}/helpful": {
      patch: {
        summary: "Vote an FAQ as helpful",
        tags: ["Customer - Feedback"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/faqs/categories": {
      get: {
        summary: "Get FAQ category options",
        tags: ["Customer - Feedback"],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/faqs/admin": {
      get: {
        summary: "List all FAQs including inactive ones (Admin)",
        tags: ["Admin - System Settings"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/feedback": {
      get: {
        summary: "Get all user feedback entries (Admin)",
        tags: ["Admin - System Settings"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
      post: {
        summary: "Submit application feedback",
        tags: ["Customer - Feedback"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userName", "comment", "rating", "category"],
                properties: {
                  userName: {
                    type: "string",
                  },
                  comment: {
                    type: "string",
                  },
                  rating: {
                    type: "integer",
                  },
                  category: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Success",
          },
        },
      },
    },
    "/notifications/{email}": {
      get: {
        summary: "Get unread notifications for a user by email",
        tags: ["Public - System Services"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "email",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/notifications/{id}/read": {
      patch: {
        summary: "Mark notification as read",
        tags: ["Public - System Services"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/notifications/read-all/{email}": {
      patch: {
        summary: "Mark all notifications as read",
        tags: ["Public - System Services"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "email",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/messages/{conversationId}": {
      get: {
        summary: "Get chat message history logs",
        tags: ["Public - System Services"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "conversationId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/messages/conversations": {
      get: {
        summary: "Get list of active chat conversations",
        tags: ["Public - System Services"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
    "/payout": {
      post: {
        summary: "Request rider earnings payout withdrawal",
        tags: ["Rider - Financials"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount"],
                properties: {
                  amount: {
                    type: "number",
                    minimum: 500,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
  },
};
