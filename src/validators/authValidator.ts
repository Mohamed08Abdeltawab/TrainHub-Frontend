import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, { message: 'Enter your name.' }),
    organization: z.string().trim().min(2, { message: 'Enter your training center name.' }),
    email: z.string().trim().email({ message: 'Enter a valid email address.' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email({ message: 'Enter a valid email address.' }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
