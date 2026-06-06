import { z } from "zod";

export const newsletterSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

export const bannerSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    image: z.string().url("Valid image URL is required"),
    ctaText: z.string().optional(),
    ctaLink: z.string().optional(),
    order: z.coerce.number().default(0),
    isActive: z.boolean().default(true),
  }),
});

export const serviceSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    icon: z.string().optional(),
    image: z.string().optional(),
    order: z.coerce.number().default(0),
    isActive: z.boolean().default(true),
  }),
});

export const featureSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    image: z.string().optional(),
    order: z.coerce.number().default(0),
    isActive: z.boolean().default(true),
  }),
});

export const partnerSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    logo: z.string().url("Valid logo URL is required"),
    website: z.string().url().optional().or(z.literal("")),
    order: z.coerce.number().default(0),
    isActive: z.boolean().default(true),
  }),
});

export const testimonialSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    title: z.string().optional(),
    quote: z.string().min(1, "Quote is required"),
    image: z.string().optional(),
    rating: z.coerce.number().min(1).max(5).default(5),
    isActive: z.boolean().default(true),
  }),
});

export const processStepSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    order: z.coerce.number().default(0),
    isActive: z.boolean().default(true),
  }),
});

export const landingConfigUpdateSchema = z.object({
  body: z.object({
    merchantSection: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      benefits: z.array(z.string()).optional(),
      ctaText: z.string().optional(),
      ctaLink: z.string().optional(),
    }).optional(),
    contactInfo: z.object({
      address: z.string().optional(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().email().optional(),
    }).optional(),
    howItWorksFooter: z.string().optional(),
  }),
});
