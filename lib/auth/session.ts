import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export function getAuthSession() {
  return getServerSession(authOptions);
}
