import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.session.createMany({
    data: [
      {
        title: "Intro Session",
        host: "Coach A",
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        price: 499,
        currency: "INR",
        tidycalUrl: "https://tidycal.com/avadhisharma",
      },
      {
        title: "Goal Planning",
        host: "Coach B",
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        price: 799,
        currency: "INR",
        tidycalUrl: "https://tidycal.com/avadhisharma",
      },
      {
        title: "Progress Review",
        host: "Coach C",
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        price: 999,
        currency: "INR",
        tidycalUrl: "https://tidycal.com/avadhisharma",
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
