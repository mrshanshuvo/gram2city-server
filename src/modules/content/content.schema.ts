import { z } from "zod";

const preprocessBoolean = z.preprocess((val) => {
  if (typeof val === "string") {
    if (val.toLowerCase() === "true") return true;
    if (val.toLowerCase() === "false") return false;
  }
  return val;
}, z.boolean());

export const newsletterSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

export const bannerSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    subtitle: z.string().optional(),
    image: z.string().url().optional(),
    ctaText: z.string().optional(),
    ctaLink: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    order: z.coerce.number().default(0),
    isActive: preprocessBoolean.default(true),
  }),
});

export const serviceSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    icon: z.string().optional(),
    image: z.string().optional(),
    order: z.coerce.number().default(0),
    isActive: preprocessBoolean.default(true),
  }),
});

export const featureSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    icon: z.string().optional(),
    image: z.string().optional(),
    order: z.coerce.number().default(0),
    isActive: preprocessBoolean.default(true),
  }),
});

export const partnerSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    logo: z.string().url().optional(),
    website: z.string().url().optional().or(z.literal("")),
    order: z.coerce.number().default(0),
    isActive: preprocessBoolean.default(true),
  }),
});

export const testimonialSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    title: z.string().optional(),
    quote: z.string().min(1, "Quote is required"),
    image: z.string().optional(),
    rating: z.coerce.number().min(1).max(5).default(5),
    isActive: preprocessBoolean.default(true),
  }),
});

export const processStepSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    icon: z.string().optional(),
    steps: z.array(z.string()).optional(),
    order: z.coerce.number().default(0),
    isActive: preprocessBoolean.default(true),
  }),
});

export const contentConfigUpdateSchema = z.object({
  body: z.object({
    merchantSection: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        benefits: z.array(z.string()).optional(),
        ctaText: z.string().optional(),
        ctaLink: z.string().optional(),
      })
      .optional(),
    contactInfo: z
      .object({
        address: z.string().optional(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
      })
      .optional(),
    socialLinks: z
      .object({
        twitter: z.string().optional(),
        facebook: z.string().optional(),
        linkedin: z.string().optional(),
        instagram: z.string().optional(),
        youtube: z.string().optional(),
      })
      .optional(),
    seo: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        keywords: z.string().optional(),
        image: z.string().optional(),
      })
      .optional(),
    howItWorksFooter: z.string().optional(),
  }),
});
