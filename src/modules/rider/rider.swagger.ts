export const riderSwagger = {
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
};
