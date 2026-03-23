import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { execSync } from "child_process";
import * as path from "path";

const adapter = new PrismaPg({
  connectionString: "postgresql://postgres:postgres@localhost:5432/dinner",
} as any);
const prisma = new PrismaClient({ adapter });

const UPLOADS_DIR = path.join(__dirname, "../public/uploads");

// Recipe name -> Bing image OIP ID (extracted from URLs)
const imageMap: Record<string, string> = {
  "烤鱼": "OIP.-7ydnyVa8e_7tKdyaBZzrgHaNK",
  "三汁焖锅": "OIP.ALTgYkcbAS-JpoejkWfy8AAAAA",
  "黄焖鸡": "OIP.6T4f2nSXuudb_2tbNIGjIAHaEK",
  "牛奶麻辣烫": "OIP.gIY1mHwpssWw0p3B-h7PeAHaNK",
  "打卤面": "OIP.IFSx7LrSSWlOl6PuJrZxbwHaEK",
  "麻酱拌面": "OIP.Eya9YfYSkt6h2AMG81U_BwHaEK",
  "素三鲜水饺": "OIP.WkwJEOUkLucwUPRxlbVkvAHaEK",
  "卤肉饭": "OIP.A2DeHQSrS95nqS5CQKsSbAHaE7",
  "网红方便面": "OIP.K4Fj7bJtB2lxfUP6yrS_jgHaEK",
  "炝拌土豆丝": "OIP.c7bY7ACdIV_udLi8Zdsw-AHaNJ",
  "凉拌茄子": "OIP.jNnNciHg9DACniTyr2Q6-AHaEK",
  "肉末茄子": "OIP.0TLwZSA3XsYlSuaF-uzfpAHaE8",
  "水煮肉片": "OIP.F1Cnc7jcN-7KUJVJ_4UNHwHaEo",
  "芋头五花肉": "OIP.fvsQm4MJWS-0wYzJqhMTVgHaEK",
  "炖鲫鱼": "OIP.J8ICAEs5V8x2TFAD8lOzjgHaEK",
  "西红柿牛腩": "OIP.O_qnz-a67Di5kxjhFIULKQHaE8",
  "可乐鸡翅": "OIP.VvILipDTZ6LSsg84smTEsQHaEK",
  "小炒肉": "OIP.WU_YuOr9gcI52PHxE4k0oQHaFj",
  "鲍鱼红烧肉": "OIP.GtfM8-nCN3T6uJObIRvI4gHaFj",
  "红烧猪蹄": "OIP.oCV6bIBoTIFlKsMEl85iOwHaE8",
  "排骨炖土豆豆角": "OIP.E7HnRQcOqXMgyzxYL6-6UAHaEK",
  "荷兰豆炒腊肠": "OIP.osYcWv9KRWsuSC8XztHmTQHaEK",
  "鱼汤": "OIP.SB1GuFzGfsuEcYMvGgtPSAHaEK",
  "菌菇鸡汤": "OIP.iNTbRb9xTNWHms3gVqjArwHaE0",
  "玉米山药排骨汤": "OIP.kgsFNkjOygwkIWAL0rpEZwHaFj",
  "葱花口蘑汤": "OIP.Sh-IpYmHQ-vQ_368ek3sEgHaEK",
  "彩椒杏鲍菇炒虾仁": "OIP.uqTbWw6Ox-7MjgGLx7DqRgHaEK",
  "土豆牛肉粒": "OIP.G9rKT9SmmXScv0zSzicL1wAAAA",
  "凉拌杏鲍菇": "OIP.T5gosYUSjxWlxaj8uQW-nwHaNK",
  "香辣虾": "OIP.rRMBmY89aMX4_DpVhDDiFgHaEK",
  "茄子炖土豆": "OIP.rACwzmYkvnSy0xo5gp5fKwHaEK",
  "黄焖排骨": "OIP.Jv324zwaUwJrUul9fROFYgHaE8",
  "江西辣翅": "OIP.yGNQn5DRoLRe1Vm5xADOXAHaEK",
};

async function main() {
  const recipes = await prisma.recipe.findMany({
    where: { familyId: "cmn2n5vf6000clyecv2csc7bx" },
    select: { id: true, name: true },
  });

  console.log(`Processing ${recipes.length} recipes...`);

  for (const recipe of recipes) {
    const oipId = imageMap[recipe.name];
    if (!oipId) {
      console.log(`  [SKIP] ${recipe.name} - no image mapping`);
      continue;
    }

    const filename = `${recipe.id}.jpg`;
    const filepath = path.join(UPLOADS_DIR, filename);
    const imageUrl = `https://tse4.mm.bing.net/th/id/${oipId}?w=600&h=400&c=7&r=0&o=5&pid=1.7`;

    try {
      execSync(`curl -sL -o "${filepath}" "${imageUrl}"`, { timeout: 15000 });

      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { imageUrl: `/uploads/${filename}` },
      });

      console.log(`  [OK] ${recipe.name}`);
    } catch (err) {
      console.log(`  [FAIL] ${recipe.name}: ${err}`);
    }
  }

  console.log("\nDone!");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
