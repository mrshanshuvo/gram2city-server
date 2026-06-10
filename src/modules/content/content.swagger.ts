export const contentSwagger = {
  "/public/settings": {
    get: {
      summary: "Get Pricing Configuration",
      tags: ["Public - System Services"],
      security: [],
      responses: {
        "200": {
          description: "Success",
        },
      },
    },
  },
  "/landing/config": {
    get: {
      summary: "Get global content configuration",
      tags: ["Admin - Content Settings"],
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
                  data: {
                    type: "object",
                    properties: {
                      merchantSection: {
                        $ref: "#/components/schemas/MerchantSection",
                      },
                      contactInfo: {
                        $ref: "#/components/schemas/ContactInfo",
                      },
                      howItWorksFooter: {
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
    patch: {
      summary: "Update global content configuration",
      tags: ["Admin - Content Settings"],
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
              required: ["howItWorksFooter"],
              properties: {
                "merchantSection.title": {
                  type: "string",
                },
                "merchantSection.description": {
                  type: "string",
                },
                "contactInfo.phone": {
                  type: "string",
                },
                "contactInfo.email": {
                  type: "string",
                },
                howItWorksFooter: {
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
  "/landing/features": {
    get: {
      summary: "List Feature Cards",
      tags: ["Admin - Feature Management"],
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
                  data: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/FeatureCard",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: "Create Feature Card",
      tags: ["Admin - Feature Management"],
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
              required: ["title", "description"],
              properties: {
                title: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
                image: {
                  type: "string",
                  format: "binary",
                },
                order: {
                  type: "number",
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
        "201": {
          description: "Created",
        },
      },
    },
  },
  "/landing/features/{id}": {
    patch: {
      summary: "Update Feature Card",
      tags: ["Admin - Feature Management"],
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
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
                image: {
                  type: "string",
                  format: "binary",
                },
                order: {
                  type: "number",
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
          description: "Updated",
        },
      },
    },
    delete: {
      summary: "Delete Feature Card",
      tags: ["Admin - Feature Management"],
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
          description: "Deleted",
        },
      },
    },
  },
  "/landing/testimonials": {
    get: {
      summary: "List Testimonials",
      tags: ["Admin - Testimonial Management"],
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
                  data: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Testimonial",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: "Create Testimonial",
      tags: ["Admin - Testimonial Management"],
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
              required: ["name", "quote"],
              properties: {
                name: {
                  type: "string",
                },
                title: {
                  type: "string",
                },
                quote: {
                  type: "string",
                },
                image: {
                  type: "string",
                  format: "binary",
                },
                rating: {
                  type: "number",
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
        "201": {
          description: "Created",
        },
      },
    },
  },
  "/landing/testimonials/{id}": {
    patch: {
      summary: "Update Testimonial",
      tags: ["Admin - Testimonial Management"],
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
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                title: {
                  type: "string",
                },
                quote: {
                  type: "string",
                },
                image: {
                  type: "string",
                  format: "binary",
                },
                rating: {
                  type: "number",
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
          description: "Updated",
        },
      },
    },
    delete: {
      summary: "Delete Testimonial",
      tags: ["Admin - Testimonial Management"],
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
          description: "Deleted",
        },
      },
    },
  },
  "/landing/banners": {
    get: {
      summary: "List Active Banners",
      tags: ["Admin - Banner Management"],
      responses: {
        "200": {
          description: "Success",
        },
      },
    },
    post: {
      summary: "Create New Banner",
      tags: ["Admin - Banner Management"],
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
              required: ["title", "image"],
              properties: {
                title: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
                image: {
                  type: "string",
                  format: "binary",
                },
                ctaText: {
                  type: "string",
                },
                ctaLink: {
                  type: "string",
                },
                order: {
                  type: "number",
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
        "201": {
          description: "Created",
        },
      },
    },
  },
  "/landing/banners/{id}": {
    patch: {
      summary: "Update Banner",
      tags: ["Admin - Banner Management"],
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
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
                image: {
                  type: "string",
                  format: "binary",
                },
                ctaText: {
                  type: "string",
                },
                ctaLink: {
                  type: "string",
                },
                order: {
                  type: "number",
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
          description: "Updated",
        },
      },
    },
    delete: {
      summary: "Delete Banner",
      tags: ["Admin - Banner Management"],
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
          description: "Deleted",
        },
      },
    },
  },
  "/landing/services": {
    get: {
      summary: "List Active Services",
      tags: ["Admin - Service Management"],
      responses: {
        "200": {
          description: "Success",
        },
      },
    },
    post: {
      summary: "Create New Service",
      tags: ["Admin - Service Management"],
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
              required: ["title", "description"],
              properties: {
                title: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
                icon: {
                  type: "string",
                },
                image: {
                  type: "string",
                  format: "binary",
                },
                order: {
                  type: "number",
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
        "201": {
          description: "Created",
        },
      },
    },
  },
  "/landing/services/{id}": {
    patch: {
      summary: "Update Service",
      tags: ["Admin - Service Management"],
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
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
                icon: {
                  type: "string",
                },
                image: {
                  type: "string",
                  format: "binary",
                },
                order: {
                  type: "number",
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
          description: "Updated",
        },
      },
    },
    delete: {
      summary: "Delete Service",
      tags: ["Admin - Service Management"],
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
          description: "Deleted",
        },
      },
    },
  },
  "/landing/warehouses": {
    get: {
      summary: "Search & Filter Warehouse Network",
      description:
        "Retrieve the full logistics network with advanced server-side filtering by region, district, or operational status.",
      tags: ["Public - Logistics"],
      parameters: [
        {
          name: "search",
          in: "query",
          required: false,
          schema: {
            type: "string",
            example: "Dhaka",
          },
          description:
            "Global search across City, District, and Region fields (case-insensitive).",
        },
        {
          name: "district",
          in: "query",
          required: false,
          schema: {
            type: "string",
            example: "Bogura",
          },
          description: "Filter exactly by a specific district name.",
        },
        {
          name: "status",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["active", "limited", "coming-soon"],
            example: "active",
          },
          description: "Filter hubs by their operational readiness.",
        },
      ],
      responses: {
        "200": {
          description: "Success",
        },
      },
    },
  },
  "/landing/partners": {
    get: {
      summary: "List Partner Logos",
      tags: ["Admin - Partner Management"],
      responses: {
        "200": {
          description: "Success",
        },
      },
    },
    post: {
      summary: "Create New Partner",
      tags: ["Admin - Partner Management"],
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
              required: ["name", "logo"],
              properties: {
                name: {
                  type: "string",
                },
                logo: {
                  type: "string",
                  format: "binary",
                },
                website: {
                  type: "string",
                },
                order: {
                  type: "number",
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
        "201": {
          description: "Created",
        },
      },
    },
  },
  "/landing/partners/{id}": {
    patch: {
      summary: "Update Partner",
      tags: ["Admin - Partner Management"],
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
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                logo: {
                  type: "string",
                  format: "binary",
                },
                website: {
                  type: "string",
                },
                order: {
                  type: "number",
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
          description: "Updated",
        },
      },
    },
    delete: {
      summary: "Delete Partner",
      tags: ["Admin - Partner Management"],
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
          description: "Deleted",
        },
      },
    },
  },
  "/landing/process-steps": {
    get: {
      summary: "List Process Steps",
      tags: ["Admin - Process Management"],
      responses: {
        "200": {
          description: "Success",
        },
      },
    },
    post: {
      summary: "Create Process Step",
      tags: ["Admin - Process Management"],
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
                title: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
                order: {
                  type: "number",
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
        "201": {
          description: "Created",
        },
      },
    },
  },
  "/landing/process-steps/{id}": {
    patch: {
      summary: "Update Process Step",
      tags: ["Admin - Process Management"],
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
              required: ["title", "description"],
              properties: {
                title: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
                order: {
                  type: "number",
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
          description: "Updated",
        },
      },
    },
    delete: {
      summary: "Delete Process Step",
      tags: ["Admin - Process Management"],
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
          description: "Deleted",
        },
      },
    },
  },
  "/landing/subscribe": {
    post: {
      summary: "Subscribe to newsletter",
      tags: ["Public - Newsletter"],
      requestBody: {
        required: true,
        content: {
          "application/x-www-form-urlencoded": {
            schema: {
              type: "object",
              required: ["email"],
              properties: {
                email: {
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
  "/landing/newsletter": {
    get: {
      summary: "Get all newsletter subscribers (Admin Only)",
      tags: ["Admin - Content Settings"],
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
