export const feedbackSwagger = {
  "/feedback": {
    get: {
      summary: "Get all user feedback entries (Admin)",
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
