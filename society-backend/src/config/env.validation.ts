import Joi from "joi";

export const envValidationSchema = Joi.object({
  // Prefer REDIS_URL, fall back to individual params
  REDIS_URL: Joi.string().optional(),
  REDIS_HOST: Joi.string().optional(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
}).or('REDIS_URL', 'REDIS_HOST'); // At least one Redis config required