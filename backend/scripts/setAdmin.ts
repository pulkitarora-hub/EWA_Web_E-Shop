import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const phone = process.argv[2];

if (!phone) {
  console.error("Usage: tsx scripts/setAdmin.ts <phone>");
  process.exit(1);
}

async function main() {
  const user = await prisma.user.upsert({
    where: { phone },
    create: { phone, isAdmin: true },
    update: { isAdmin: true },
  });
  console.log(`Admin set for user ${user.id} (${user.phone})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
