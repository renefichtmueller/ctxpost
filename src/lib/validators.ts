import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("invalidEmail"),
  password: z.string().min(8, "passwordMinLength"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "nameMinLength"),
    email: z.string().email("invalidEmail"),
    password: z.string().min(8, "passwordMinLength"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordsMismatch",
    path: ["confirmPassword"],
  });

export const postSchema = z.object({
  content: z
    .string()
    .min(1, "contentRequired")
    .max(5000, "contentMaxLength"),
  scheduledAt: z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null;
      return val;
    })
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "invalidDate"),
  targetAccountIds: z
    .array(z.string())
    .min(1, "platformRequired"),
  status: z.enum(["DRAFT", "SCHEDULED"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PostInput = z.infer<typeof postSchema>;
