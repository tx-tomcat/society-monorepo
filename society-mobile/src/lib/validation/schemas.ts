/**
 * Validation schemas for Hireme mobile app
 * Uses Zod for type-safe validation
 */
import * as z from 'zod';

// Vietnam phone number regex - supports various formats
// 09x, 03x, 07x, 08x, 05x (10 digits without country code)
const vietnamPhoneRegex =
  /^(0?)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;

// International phone regex (more permissive)
const internationalPhoneRegex = /^[0-9]{9,15}$/;

/**
 * Phone number validation
 * Supports Vietnamese phone numbers (09x, 03x, 07x, 08x, 05x)
 */
export const phoneSchema = z
  .string()
  .min(9, 'auth.validation.phone_min_length')
  .max(15, 'auth.validation.phone_max_length')
  .regex(internationalPhoneRegex, 'auth.validation.phone_invalid')
  .transform((val) => val.replace(/\D/g, '')); // Strip non-digits

/**
 * Vietnamese phone number validation (stricter)
 */
export const vietnamPhoneSchema = z
  .string()
  .min(9, 'auth.validation.phone_min_length')
  .max(11, 'auth.validation.phone_max_length')
  .regex(vietnamPhoneRegex, 'auth.validation.vietnam_phone_invalid')
  .transform((val) => val.replace(/\D/g, ''));

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .min(1, 'auth.validation.email_required')
  .email('auth.validation.email_invalid')
  .toLowerCase()
  .transform((val) => val.trim());

/**
 * OTP code validation
 */
export const otpSchema = z
  .string()
  .length(6, 'auth.validation.otp_length')
  .regex(/^[0-9]+$/, 'auth.validation.otp_numeric');

/**
 * Full name validation
 */
export const fullNameSchema = z
  .string()
  .min(2, 'auth.validation.name_min_length')
  .max(50, 'auth.validation.name_max_length')
  .regex(/^[a-zA-ZÀ-ỹ\s'-]+$/, 'auth.validation.name_invalid')
  .transform((val) => val.trim());

/**
 * Date of birth validation (must be 18+)
 */
export const dateOfBirthSchema = z.date().refine((date) => {
  const today = new Date();
  const birthDate = new Date(date);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    return age - 1 >= 18;
  }
  return age >= 18;
}, 'auth.validation.age_minimum');

/**
 * Gender validation
 */
export const genderSchema = z.enum(['male', 'female', 'other'], {
  message: 'auth.validation.gender_required',
});

/**
 * Password validation (if needed in future)
 */
export const passwordSchema = z
  .string()
  .min(8, 'auth.validation.password_min_length')
  .regex(/[A-Z]/, 'auth.validation.password_uppercase')
  .regex(/[a-z]/, 'auth.validation.password_lowercase')
  .regex(/[0-9]/, 'auth.validation.password_number');

/**
 * Login form schema
 */
export const loginFormSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('phone'),
    value: phoneSchema,
  }),
  z.object({
    method: z.literal('email'),
    value: emailSchema,
  }),
]);

/**
 * Profile creation schema
 */
export const profileSchema = z.object({
  fullName: fullNameSchema,
  dateOfBirth: dateOfBirthSchema,
  gender: genderSchema,
  avatarUri: z.string().url().optional(),
});

/**
 * Booking form schema
 */
export const bookingSchema = z.object({
  companionId: z.string().uuid('booking.validation.invalid_companion'),
  date: z
    .date()
    .refine((date) => date > new Date(), 'booking.validation.date_future'),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'booking.validation.time_format'),
  duration: z
    .number()
    .min(1, 'booking.validation.duration_min')
    .max(24, 'booking.validation.duration_max'),
  notes: z.string().max(500, 'booking.validation.notes_max_length').optional(),
});

/**
 * Message schema
 */
export const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'messaging.validation.message_required')
    .max(1000, 'messaging.validation.message_max_length')
    .transform((val) => val.trim()),
});

/**
 * Search filter schema
 */
export const searchFilterSchema = z
  .object({
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional(),
    location: z.string().optional(),
    rating: z.number().min(0).max(5).optional(),
    verified: z.boolean().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
  })
  .refine(
    (data) => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.minPrice <= data.maxPrice;
      }
      return true;
    },
    { message: 'search.validation.price_range_invalid' }
  );

// Type exports
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type ProfileData = z.infer<typeof profileSchema>;
export type BookingData = z.infer<typeof bookingSchema>;
export type MessageData = z.infer<typeof messageSchema>;
export type SearchFilterData = z.infer<typeof searchFilterSchema>;
