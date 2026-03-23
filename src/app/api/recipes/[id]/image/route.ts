import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/db";
import { getAuthFromCookie } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromCookie();
  if (!auth) return jsonError("未登录", 401);
  if (auth.role !== "ADMIN" && auth.role !== "COOK") {
    return jsonError("权限不足", 403);
  }

  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) return jsonError("菜谱不存在", 404);
  if (recipe.familyId !== auth.familyId) return jsonError("无权访问", 403);

  const formData = await request.formData();
  const file = formData.get("image") as File | null;
  if (!file) return jsonError("请选择图片");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${id}.${ext}`;
  const uploadDir = join(process.cwd(), "public/uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), buffer);

  const imageUrl = `/uploads/${filename}`;
  await prisma.recipe.update({ where: { id }, data: { imageUrl } });

  return jsonSuccess({ imageUrl });
}
