/**
 * Alias route: Flutterwave dashboard is configured to POST here.
 * We forward to the real handler at /api/flutterwave/webhook so
 * all logic stays in one place.
 */
export { POST } from "@/app/api/flutterwave/webhook/route";
