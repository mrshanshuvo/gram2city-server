export const userSwagger = {
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
  "/users/{email}/status": {
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
    get: {
      summary: "List all merchants (Admin)",
      tags: ["Admin - User Management"],
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
            enum: ["pending", "approved", "rejected"],
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
  "/merchants/{id}/status": {
    patch: {
      summary: "Update Merchant Application Status (Admin)",
      tags: ["Admin - User Management"],
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
  "/merchants/me": {
    get: {
      summary: "Get Merchant Profile",
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
};
