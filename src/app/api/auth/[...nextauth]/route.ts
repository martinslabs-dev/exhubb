import { handlers } from "@/auth";

// Delegates ALL Auth.js routes (GET + POST) to the Auth.js handler.
// Handles: /api/auth/signin, /api/auth/callback/*, /api/auth/signout, etc.
export const { GET, POST } = handlers;
