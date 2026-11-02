import { POST as confirmPasswordReset } from "@/app/api/auth/password-reset/confirm/route";

export async function POST(req: Request) {
  return confirmPasswordReset(req);
}

