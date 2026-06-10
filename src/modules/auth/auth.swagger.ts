export const authSwagger = {
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
};
