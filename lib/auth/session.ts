import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";

export function getAuthSession() {
  return getServerSession(authOptions);
}
