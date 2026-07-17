import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password cannot exceed 100 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[\W_]/, "Password must contain at least one special character");

export const authValidation = {
  localLogin: z.object({
    email: z.string().email().toLowerCase().max(255),
    password: z.string().min(1).max(100), // login doesn't need strict regex to check, but max length prevents ReDoS
  }),

  googleLogin: z.object({
    code: z.string().min(1).max(1000),
  }),

  localSignup: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().toLowerCase().max(255),
    password: passwordSchema,
  }),
};

export type LocalLoginDto = z.infer<typeof authValidation.localLogin>;
export type GoogleLoginDto = z.infer<typeof authValidation.googleLogin>;
export type LocalSignupDto = z.infer<typeof authValidation.localSignup>;
