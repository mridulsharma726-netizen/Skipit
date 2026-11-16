const { z } = require('zod');

/**
 * Higher-order middleware to validate req.body, req.query, or req.params against a Zod schema
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Input validation failed',
          details: err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
};

// Common Schemas
const sendOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  otp: z.string().length(6, 'Verification code must be exactly 6 digits'),
  full_name: z.string().optional(),
});

const createListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().min(10, 'Description must be at least 10 characters').max(3000),
  price_per_day: z.coerce.number().positive('Daily price must be greater than 0'),
  deposit_amount: z.coerce.number().min(0, 'Deposit cannot be negative').default(0),
  category: z.string().min(2, 'Category is required'),
  location_name: z.string().min(2, 'Location is required'),
  condition: z.enum(['brand_new', 'like_new', 'good', 'fair']).default('good'),
  brand: z.string().optional(),
  model: z.string().optional(),
});

const inquirySchema = z.object({
  listing_id: z.string().uuid('Invalid listing ID format'),
  initial_message: z.string().max(1000).optional(),
});

const reportSchema = z.object({
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  description: z.string().optional(),
  reported_user_id: z.string().uuid().optional(),
  listing_id: z.string().uuid().optional(),
});

module.exports = {
  validate,
  sendOtpSchema,
  verifyOtpSchema,
  createListingSchema,
  inquirySchema,
  reportSchema,
};
