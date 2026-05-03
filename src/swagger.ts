export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "gram2city-server API",
    version: "1.0.0",
    description: "REST API documentation for gram2city server",
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your Firebase ID token (without 'Bearer ' prefix).",
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
        tags: ["System"],
        security: [],
        responses: { 200: { description: "Server is running" } },
      },
    },
    // ─── AUTHENTICATION ───────────────────────────────────────────────────────
    "/auth/register": {
      post: {
        summary: "Register a new user",
        tags: ["Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["email", "password", "name"],
                properties: {
                  email: { type: "string", example: "string" },
                  password: { type: "string", example: "string" },
                  name: { type: "string", example: "string" },
                  image: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/auth/login": {
      post: {
        summary: "Login user",
        tags: ["Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "string" },
                  password: { type: "string", example: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/auth/me": {
      get: {
        summary: "Get my profile",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Success" } },
      },
      delete: {
        summary: "Delete my account",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Success" } },
      },
    },
    "/auth/send-verification": {
      post: {
        summary: "Send verification email",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Success" } },
      },
    },
    "/auth/reset-password": {
      post: {
        summary: "Reset password email",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: { "application/x-www-form-urlencoded": { schema: { type: "object", properties: { email: { type: "string", example: "string" } } } } }
        },
        responses: { 200: { description: "Success" } },
      },
    },

    // ─── CUSTOMER PORTAL ──────────────────────────────────────────────────────
    "/parcels": {
      get: {
        summary: "My booked parcels",
        tags: ["Customer Portal"],
        parameters: [
          { name: "email", in: "query", schema: { type: "string", example: "string" } },
          { name: "payment_status", in: "query", schema: { type: "string", enum: ["paid", "unpaid"] } },
        ],
        responses: { 200: { description: "Success" } },
      },
      post: {
        summary: "Book a new parcel",
        tags: ["Customer Portal"],
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["parcelName", "parcelType", "weight", "receiverName", "receiverPhone", "deliveryAddress", "receiverDistrict"],
                properties: {
                  parcelName: { type: "string", example: "string" },
                  parcelType: { type: "string", example: "string" },
                  weight: { type: "number", example: 0 },
                  receiverName: { type: "string", example: "string" },
                  receiverPhone: { type: "string", example: "string" },
                  deliveryAddress: { type: "string", example: "string" },
                  receiverDistrict: { type: "string", example: "string" },
                  senderPhone: { type: "string", example: "string" },
                  deliveryDate: { type: "string", format: "date", example: "string" },
                  cost: { type: "number", example: 0 }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/users/{email}": {
      patch: {
        summary: "Update my profile",
        tags: ["Customer Portal"],
        parameters: [{ name: "email", in: "path", required: true, schema: { type: "string", example: "string" } }],
        requestBody: {
          content: { "application/x-www-form-urlencoded": { schema: { type: "object", properties: { name: { type: "string", example: "string" }, phone: { type: "string", example: "string" }, address: { type: "string", example: "string" } } } } }
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/payments": {
      post: {
        summary: "Pay for a parcel",
        tags: ["Customer Portal"],
        requestBody: {
          content: { "application/x-www-form-urlencoded": { schema: { type: "object", properties: { parcelId: { type: "string", example: "string" }, transactionId: { type: "string", example: "string" }, amount: { type: "number", example: 0 } } } } }
        },
        responses: { 200: { description: "Success" } },
      },
      get: {
        summary: "My payment history",
        tags: ["Customer Portal"],
        parameters: [{ name: "email", in: "query", schema: { type: "string", example: "string" } }],
        responses: { 200: { description: "Success" } },
      },
    },
    "/reviews": {
      post: {
        summary: "Submit a review for a rider",
        tags: ["Customer Portal"],
        requestBody: {
          content: { "application/x-www-form-urlencoded": { schema: { type: "object", properties: { rider_email: { type: "string", example: "string" }, rating: { type: "number", example: 0 }, comment: { type: "string", example: "string" }, parcelId: { type: "string", example: "string" } } } } }
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/trackings/{trackingId}": {
      get: {
        summary: "Track my parcel",
        tags: ["Customer Portal"],
        security: [],
        parameters: [{ name: "trackingId", in: "path", required: true, schema: { type: "string", example: "string" } }],
        responses: { 200: { description: "Success" } },
      },
    },

    // ─── RIDER DASHBOARD ──────────────────────────────────────────────────────
    "/rider/parcels": {
      get: {
        summary: "Parcels assigned to me",
        tags: ["Rider Dashboard"],
        responses: { 200: { description: "Success" } },
      },
    },
    "/parcels/{id}/pick": {
      patch: {
        summary: "Mark parcel as picked up",
        tags: ["Rider Dashboard"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "string" } }],
        responses: { 200: { description: "Success" } },
      },
    },
    "/rider/parcels/{id}/status": {
      patch: {
        summary: "Update delivery status",
        tags: ["Rider Dashboard"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "string" } }],
        requestBody: {
          content: { "application/x-www-form-urlencoded": { schema: { type: "object", properties: { delivery_status: { type: "string", enum: ["pending", "on_the_way", "delivered"] } } } } }
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/rider/stats/{email}": {
      get: {
        summary: "My delivery stats",
        tags: ["Rider Dashboard"],
        parameters: [{ name: "email", in: "path", required: true, schema: { type: "string", example: "string" } }],
        responses: { 200: { description: "Success" } },
      },
    },
    "/rider/cashout": {
      post: {
        summary: "Cash out my earnings",
        tags: ["Rider Dashboard"],
        requestBody: {
          content: { "application/x-www-form-urlencoded": { schema: { type: "object", properties: { parcelId: { type: "string", example: "string" } } } } }
        },
        responses: { 200: { description: "Success" } },
      },
    },

    // ─── ADMIN PANEL ──────────────────────────────────────────────────────────
    "/admin/stats": {
      get: {
        summary: "Global platform stats",
        tags: ["Admin Panel"],
        responses: { 200: { description: "Success" } },
      },
    },
    "/admin/all-parcels": {
      get: {
        summary: "Manage all platform parcels",
        tags: ["Admin Panel"],
        parameters: [
          { name: "page", in: "query", schema: { type: "string", default: "1" } },
          { name: "size", in: "query", schema: { type: "string", default: "10" } },
        ],
        responses: { 200: { description: "Success" } },
      },
    },
    "/users/{email}/role": {
      patch: {
        summary: "Change a user's role",
        tags: ["Admin Panel"],
        parameters: [{ name: "email", in: "path", required: true, schema: { type: "string", example: "string" } }],
        requestBody: {
          content: { "application/x-www-form-urlencoded": { schema: { type: "object", properties: { role: { type: "string", enum: ["user", "rider", "admin"] } } } } }
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/parcels/{id}/assign": {
      patch: {
        summary: "Assign a rider to a parcel",
        tags: ["Admin Panel"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "string" } }],
        requestBody: {
          content: { "application/x-www-form-urlencoded": { schema: { type: "object", properties: { riderId: { type: "string", example: "string" } } } } }
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/riders/{id}/status": {
      patch: {
        summary: "Approve/Reject rider application",
        tags: ["Admin Panel"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "string" } }],
        requestBody: {
          content: { "application/x-www-form-urlencoded": { schema: { type: "object", properties: { status: { type: "string", enum: ["approved", "rejected"] }, email: { type: "string", example: "string" } } } } }
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/auth/admin/create-user": {
      post: {
        summary: "Onboard new Admin/Rider manually",
        tags: ["Admin Panel"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { "application/x-www-form-urlencoded": { schema: { type: "object", properties: { email: { type: "string", example: "string" }, password: { type: "string", example: "string" }, name: { type: "string", example: "string" }, role: { type: "string", enum: ["admin", "rider", "user"] } } } } }
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/admin/audit-logs": {
      get: {
        summary: "View administrative audit logs",
        tags: ["Admin Panel"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Success" } },
      },
    },
    "/admin/settings": {
      get: {
        summary: "Get global system settings",
        tags: ["Admin Panel"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Success" } },
      },
      patch: {
        summary: "Update global system settings",
        tags: ["Admin Panel"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  base_delivery_fee: { type: "number", example: 50 },
                  cost_per_kg: { type: "number", example: 20 },
                  rider_commission_percentage: { type: "number", example: 15 }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/admin/users/{email}/status": {
      patch: {
        summary: "Suspend or activate a user account",
        tags: ["Admin Panel"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "email", in: "path", required: true, schema: { type: "string", example: "string" } }],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["active", "suspended"] }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Success" } },
      },
    },
  },
};
