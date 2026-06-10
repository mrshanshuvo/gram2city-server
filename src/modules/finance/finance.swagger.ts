export const financeSwagger = {
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
  "/payouts": {
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
  "/payouts/{id}/status": {
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
};
