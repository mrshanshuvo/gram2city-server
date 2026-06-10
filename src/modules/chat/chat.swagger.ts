export const chatSwagger = {
  "/messages/conversations": {
    get: {
      summary: "Get chat conversations list for the current user",
      tags: ["Customer - Feedback"],
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
  "/messages/{conversationId}": {
    get: {
      summary: "Get chat history for a specific conversation",
      tags: ["Customer - Feedback"],
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
  "/messages/upload-image": {
    post: {
      summary: "Upload an image in chat",
      tags: ["Customer - Feedback"],
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
        },
      },
    },
  },
};
