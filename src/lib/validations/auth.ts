import { z } from "zod";

// ─── Sign-up schema ───────────────────────────────────────────
export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(64),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  intent: z
    .enum(["buyer", "seller", "freelancer", "client"])
    .default("buyer"),
});

// ─── Sign-in schema ───────────────────────────────────────────
export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Phone sign-up schema ─────────────────────────────────────
export const phoneSignUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(64),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, "Please enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  intent: z
    .enum(["buyer", "seller", "freelancer", "client"])
    .default("buyer"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
