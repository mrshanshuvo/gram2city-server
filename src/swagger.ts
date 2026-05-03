export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "gram2city-server API",
    version: "1.0.0",
    description: "REST API documentation for gram2city server",
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your Firebase ID token (without 'Bearer ' prefix).",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    "/": {
      get: {
        summary: "Health Check",
        tags: ["System"],
        security: [],
        responses: {
          200: { description: "Server is running" },
        },
      },
    },
    "/users": {
      post: {
        summary: "Upsert user on login",
        tags: ["Users"],
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, name: { type: "string" }, photoURL: { type: "string" }, role: { type: "string" }, created_at: { type: "string" }, last_login: { type: "string" } } } } },
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/users/search": {
      get: {
        summary: "Search users by email",
        tags: ["Users"],
        parameters: [{ name: "email", in: "query", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Success" } },
      },
    },
    "/users/{email}/role": {
      get: {
        summary: "Get a user's role",
        tags: ["Users"],
        parameters: [{ name: "email", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Success" } },
      },
      patch: {
        summary: "Update a user's role",
        tags: ["Users"],
        parameters: [{ name: "email", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { role: { type: "string", enum: ["user", "rider", "admin"] } } } } },
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/users/{email}": {
      patch: {
        summary: "Update own profile",
        tags: ["Users"],
        parameters: [{ name: "email", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, photoURL: { type: "string" }, phone: { type: "string" }, address: { type: "string" } } } } },
        },
        responses: { 200: { description: "Success" } },
      },
    },
    "/user/stats/{email}": {
      get: {
        summary: "Get user stats",
        tags: ["Users"],
        parameters: [{ name: "email", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Success" } },
      },
    },
    "/parcels": {
      get: {
        summary: "List parcels",
        tags: ["Parcels"],
        parameters: [
          { name: "email", in: "query", schema: { type: "string" } },
          { name: "payment_status", in: "query", schema: { type: "string" } },
          { name: "delivery_status", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Success" } },
      },
      post: {
        summary: "Book a new parcel",
        tags: ["Parcels"],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { 201: { description: "Created" } },
      },
    },
    "/parcels/delivery/status-count": {
      get: {
        summary: "Count parcels grouped by delivery status",
        tags: ["Parcels"],
        security: [],
        responses: { 200: { description: "Success" } },
      },
    },
    "/parcels/{id}": {
      get: {
        summary: "Get a single parcel by ID",
        tags: ["Parcels"],
        security: [],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Success" } },
      },
      delete: {
        summary: "Delete a parcel",
        tags: ["Parcels"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Success" } },
      },
    },
    "/parcels/{id}/pick": {
      patch: {
        summary: "Mark parcel as picked up by rider",
        tags: ["Parcels"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Success" } },
      },
    },
    "/parcels/{id}/assign": {
      patch: {
        summary: "Assign a rider to a parcel",
        tags: ["Parcels"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { riderId: { type: "string" } } } } } },
        responses: { 200: { description: "Success" } },
      },
    },
    "/admin/stats": {
      get: {
        summary: "Admin dashboard stats",
        tags: ["Admin"],
        responses: { 200: { description: "Success" } },
      },
    },
    "/admin/all-parcels": {
      get: {
        summary: "Paginated parcel list",
        tags: ["Admin"],
        parameters: [
          { name: "page", in: "query", schema: { type: "string", default: "1" } },
          { name: "size", in: "query", schema: { type: "string", default: "10" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "startDate", in: "query", schema: { type: "string" } },
          { name: "endDate", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Success" } },
      },
    },
    "/riders/pending": {
      get: {
        summary: "List all pending rider applications",
        tags: ["Riders"],
        responses: { 200: { description: "Success" } },
      },
    },
    "/riders/approved": {
      get: {
        summary: "List all approved riders",
        tags: ["Riders"],
        responses: { 200: { description: "Success" } },
      },
    },
    "/riders": {
      get: {
        summary: "List riders",
        tags: ["Riders"],
        parameters: [{ name: "status", in: "query", schema: { type: "string" } }],
        responses: { 200: { description: "Success" } },
      },
      post: {
        summary: "Create a new rider application",
        tags: ["Riders"],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { 200: { description: "Success" } },
      },
    },
    "/riders/{id}/status": {
      patch: {
        summary: "Approve or reject a rider",
        tags: ["Riders"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, email: { type: "string" } } } } } },
        responses: { 200: { description: "Success" } },
      },
    },
    "/rider/parcels": {
      get: {
        summary: "Get parcels assigned to the logged-in rider",
        tags: ["Riders"],
        responses: { 200: { description: "Success" } },
      },
    },
    "/rider/parcels/{id}/status": {
      patch: {
        summary: "Update delivery status",
        tags: ["Riders"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { delivery_status: { type: "string" } } } } } },
        responses: { 200: { description: "Success" } },
      },
    },
    "/rider/stats/{email}": {
      get: {
        summary: "Rider stats",
        tags: ["Riders"],
        parameters: [{ name: "email", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Success" } },
      },
    },
    "/rider/cashout": {
      post: {
        summary: "Cash out earnings for a delivered parcel",
        tags: ["Riders"],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { parcelId: { type: "string" } } } } } },
        responses: { 200: { description: "Success" } },
      },
    },
    "/cashouts": {
      get: {
        summary: "Get cashout history for a rider",
        tags: ["Riders"],
        parameters: [{ name: "rider_email", in: "query", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Success" } },
      },
    },
    "/create-payment-intent": {
      post: {
        summary: "Create a Stripe PaymentIntent",
        tags: ["Payments"],
        security: [],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { amount: { type: "number" } } } } } },
        responses: { 200: { description: "Success" } },
      },
    },
    "/payments": {
      post: {
        summary: "Record a completed payment",
        tags: ["Payments"],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { 200: { description: "Success" } },
      },
      get: {
        summary: "Get payment history",
        tags: ["Payments"],
        parameters: [{ name: "email", in: "query", schema: { type: "string" } }],
        responses: { 200: { description: "Success" } },
      },
    },
    "/trackings/{trackingId}": {
      get: {
        summary: "Get full tracking history",
        tags: ["Tracking"],
        security: [],
        parameters: [{ name: "trackingId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Success" } },
      },
    },
    "/trackings": {
      post: {
        summary: "Manually insert a tracking update",
        tags: ["Tracking"],
        security: [],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { 201: { description: "Created" } },
      },
    },
    "/reviews/rider/{email}": {
      get: {
        summary: "Get all reviews for a specific rider",
        tags: ["Reviews"],
        security: [],
        parameters: [{ name: "email", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Success" } },
      },
    },
    "/reviews": {
      post: {
        summary: "Submit a review for a rider",
        tags: ["Reviews"],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { 200: { description: "Success" } },
      },
    },
    "/notifications/{email}": {
      get: {
        summary: "Get all unread notifications",
        tags: ["Notifications"],
        parameters: [{ name: "email", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Success" } },
      },
    },
    "/notifications/{id}/read": {
      patch: {
        summary: "Mark a single notification as read",
        tags: ["Notifications"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Success" } },
      },
    },
    "/notifications/read-all/{email}": {
      patch: {
        summary: "Mark all notifications as read",
        tags: ["Notifications"],
        parameters: [{ name: "email", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Success" } },
      },
    },
  },
};
