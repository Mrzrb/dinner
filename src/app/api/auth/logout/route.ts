import { clearAuthCookie } from "@/lib/auth";
import { jsonSuccess } from "@/lib/utils";

export async function POST() {
  await clearAuthCookie();
  return jsonSuccess({ message: "已登出" });
}
