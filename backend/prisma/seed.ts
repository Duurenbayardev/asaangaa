import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  { id: "nariin-nogoo", label: "Нарийн Ногоо", order: 1 },
  { id: "jims-jimsgene", label: "Жимс Жимсгэнэ", order: 2 },
  { id: "hataasan-jims", label: "Хатаасан Жимс", order: 3 },
  { id: "amtlagch", label: "Амтлагч", order: 4 },
  { id: "jimsni-sav-baglaa-boodol", label: "Жимсний сав баглаа боодол", order: 5 },
];

const ADMIN_PHONE = process.env.ADMIN_PHONE ?? "+97699119911";
const ADMIN_NAME = "Admin";

async function main() {
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: c.id },
      create: c,
      update: { label: c.label, order: c.order },
    });
  }

  await prisma.product.deleteMany({});

  const existingAdmin = await prisma.user.findUnique({
    where: { phone: ADMIN_PHONE },
  });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        phone: ADMIN_PHONE,
        name: ADMIN_NAME,
        role: "admin",
        emailVerified: true,
      },
    });
    console.log("Admin created:", ADMIN_PHONE);
  } else {
    await prisma.user.update({
      where: { phone: ADMIN_PHONE },
      data: { role: "admin", name: ADMIN_NAME, emailVerified: true },
    });
    console.log("Admin updated:", ADMIN_PHONE);
  }

  console.log("Seeded categories and admin. Products cleared.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
