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
        responses: {
          200: { description: "Server is running" },
        },
      },
    },
    "/auth/register": {
      post: {
        summary: "Register a new user with Image Upload (Firebase + MongoDB)",
        tags: ["Auth"],
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
        responses: {
          201: { 
            description: "User created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    token: { type: "string" },
                    role: { type: "string" },
                    expiresIn: { type: "string" }
                  }
                }
              }
            }
          },
          400: { description: "Registration failed" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Login user and get Firebase ID Token",
        tags: ["Auth"],
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
        responses: {
          200: { 
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    token: { type: "string" },
                    role: { type: "string" },
                    lastLogin: { type: "string", format: "date-time" },
                    expiresIn: { type: "string" },
                    emailVerified: { type: "boolean" }
                  }
                }
              }
            }
          },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Get currently logged-in user profile",
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { 
            description: "User profile retrieved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    user: { type: "object" },
                    emailVerified: { type: "boolean" }
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized" },
        },
      },
      delete: {
        summary: "Delete own account (GDPR)",
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Account deleted" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/auth/send-verification": {
      post: {
        summary: "Send email verification link",
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Verification email sent" },
          401: { description: "Unauthorized" }
        },
      },
    },
    "/auth/reset-password": {
      post: {
        summary: "Send password reset email",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", example: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Reset email sent" },
          400: { description: "Failed to send email" }
        },
      },
    },
    "/auth/admin/create-user": {
      post: {
        summary: "Admin only - Onboard a new user/rider",
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["email", "password", "name", "role"],
                properties: {
                  email: { type: "string", example: "string" },
                  password: { type: "string", example: "string" },
                  name: { type: "string", example: "string" },
                  role: { type: "string", enum: ["admin", "rider", "user"] }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "User created" },
          403: { description: "Forbidden" }
        },
      },
    },
    "/parcels": {
      get: {
        summary: "List parcels",
        tags: ["Parcels"],
        parameters: [
          { name: "email", in: "query", schema: { type: "string", example: "string" } },
          { name: "payment_status", in: "query", schema: { type: "string", enum: ["paid", "unpaid"] } },
          { name: "delivery_status", in: "query", schema: { type: "string", enum: ["pending", "on_the_way", "delivered"] } },
        ],
        responses: { 200: { description: "Success" } },
      },
      post: {
        summary: "Book a new parcel",
        tags: ["Parcels"],
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
    "/riders": {
      get: {
        summary: "List riders",
        tags: ["Riders"],
        parameters: [{ name: "status", in: "query", schema: { type: "string", example: "string" } }],
        responses: { 200: { description: "Success" } },
      },
      post: {
        summary: "Apply to be a rider",
        tags: ["Riders"],
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["name", "email", "phone", "district"],
                properties: {
                  name: { type: "string", example: "string" },
                  email: { type: "string", example: "string" },
                  phone: { type: "string", example: "string" },
                  district: { type: "string", example: "string" },
                  region: { type: "string", example: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/reviews": {
      post: {
        summary: "Submit a review for a rider",
        tags: ["Reviews"],
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["rider_email", "rating", "comment"],
                properties: {
                  rider_email: { type: "string", example: "string" },
                  rating: { type: "number", minimum: 1, maximum: 5, example: 0 },
                  comment: { type: "string", example: "string" },
                  parcelId: { type: "string", example: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/payments": {
      post: {
        summary: "Record a completed payment",
        tags: ["Payments"],
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  parcelId: { type: "string", example: "string" },
                  email: { type: "string", example: "string" },
                  transactionId: { type: "string", example: "string" },
                  amount: { type: "number", example: 0 }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/trackings": {
      post: {
        summary: "Manually insert a tracking update",
        tags: ["Tracking"],
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  trackingId: { type: "string", example: "string" },
                  status: { type: "string", example: "string" },
                  details: { type: "string", example: "string" },
                  location: { type: "string", example: "string" }
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
        summary: "Update own profile",
        tags: ["Users"],
        parameters: [{ name: "email", in: "path", required: true, schema: { type: "string", example: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "string" },
                  phone: { type: "string", example: "string" },
                  address: { type: "string", example: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/upload": {
      post: {
        summary: "Upload an image to ImgBB",
        tags: ["Uploads"],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  image: { type: "string", format: "binary" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/create-payment-intent": {
      post: {
        summary: "Create a Stripe PaymentIntent",
        tags: ["Payments"],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  amount: { type: "number", example: 0 }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/rider/cashout": {
      post: {
        summary: "Cash out earnings for a delivered parcel",
        tags: ["Riders"],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  parcelId: { type: "string", example: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/parcels/{id}/assign": {
      patch: {
        summary: "Assign a rider to a parcel",
        tags: ["Parcels"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "string" } }],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  riderId: { type: "string", example: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/riders/{id}/status": {
      patch: {
        summary: "Approve or reject a rider",
        tags: ["Riders"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "string" } }],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["approved", "rejected"] },
                  email: { type: "string", example: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/rider/parcels/{id}/status": {
      patch: {
        summary: "Update delivery status",
        tags: ["Riders"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "string" } }],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  delivery_status: { type: "string", enum: ["on_the_way", "delivered", "pending"] }
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
