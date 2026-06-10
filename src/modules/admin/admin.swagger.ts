export const adminSwagger = {
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
};
