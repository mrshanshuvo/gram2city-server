export const notificationSwagger = {
  "/notifications/{email}": {
    get: {
      summary: "Get unread notifications for a user by email",
      tags: ["Public - System Services"],
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
  "/notifications/{id}/read": {
    patch: {
      summary: "Mark notification as read",
      tags: ["Public - System Services"],
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
  "/notifications/read-all/{email}": {
    patch: {
      summary: "Mark all notifications as read",
      tags: ["Public - System Services"],
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
