import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const prisma = new PrismaClient();
const seedConfig = z.object({
  ADMIN_EMAIL: z.string().email().transform((v) => v.toLowerCase().trim()),
  ADMIN_PASSWORD: z.string().min(12, "ADMIN_PASSWORD mora imati najmanje 12 karaktera"),
}).parse(process.env);

async function main() {
  const passwordHash = await bcrypt.hash(seedConfig.ADMIN_PASSWORD, 12);
  await prisma.user.upsert({ where: { email: seedConfig.ADMIN_EMAIL }, update: { passwordHash }, create: { email: seedConfig.ADMIN_EMAIL, passwordHash } });
  console.log(`Admin ${seedConfig.ADMIN_EMAIL} je kreiran/ažuriran.`);

  if (await prisma.menuItem.count() === 0) {
    const raw = await readFile(resolve(process.cwd(), "../frontend/data/menu.json"), "utf8");
    const menu = z.object({
      categories: z.array(z.object({
        id: z.string(), name: z.string(),
        items: z.array(z.object({ name: z.string(), size: z.string().optional(), price: z.number().int().nullable() })),
      })),
    }).parse(JSON.parse(raw));

    await prisma.menuItem.createMany({
      data: menu.categories.flatMap((category, categoryOrder) => category.items.map((item, itemOrder) => ({
        name: item.name, size: item.size, price: item.price, categoryId: category.id,
        categoryName: category.name, categoryOrder, itemOrder,
      }))),
    });
    console.log("Postojeći digitalni meni je ubačen u bazu.");
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
