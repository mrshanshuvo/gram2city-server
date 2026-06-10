export const parcelSwagger = {
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
  "/parcels/all": {
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
};
