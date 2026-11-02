import { handlePasswordResetRequest } from "@/app/api/auth/forgot-password/route";

export async function POST(req: Request) {
  return handlePasswordResetRequest(req, true);
}

