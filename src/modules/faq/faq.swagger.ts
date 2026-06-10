export const faqSwagger = {
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
};
