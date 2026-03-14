import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// TidyCal URL mappings based on available booking types
const TIDYCAL_URLS = {
  online45: "https://tidycal.com/avadhisharma/individual-therapy-45-minutes-online",
  online60: "https://tidycal.com/avadhisharma/ic-off-ses-1hr",
  online75: "https://tidycal.com/avadhisharma/ic-off-ses-1hr", // TODO: Create 75 min in TidyCal
  online90: "https://tidycal.com/avadhisharma/ic-off-ses-1hr", // TODO: Create 90 min in TidyCal
  inPerson: "https://tidycal.com/avadhisharma/ic-off-ses-1hr-3lgq6nv",
};

async function main() {
  // Create test admin user
  const passwordHash = await bcrypt.hash("test1234", 10);
  
  await prisma.user.upsert({
    where: { referralCode: "TESTADMIN" },
    update: {},
    create: {
      email: "test@evolve.com",
      name: "Test Admin",
      passwordHash,
      isAdmin: true,
      onboardingComplete: true,
      referralCode: "TESTADMIN",
    },
  });

  console.log("✓ Created test admin user: test@evolve.com / test1234");

  // Update existing sessions with correct TidyCal URLs
  const sessionMappings = [
    // Standalone Clarity Sessions
    { titlePattern: "Standalone Clarity Session - 45 min", tidycalUrl: TIDYCAL_URLS.online45 },
    { titlePattern: "Standalone Clarity Session - 60 min", tidycalUrl: TIDYCAL_URLS.online60 },
    { titlePattern: "Standalone Clarity Session - 75 min", tidycalUrl: TIDYCAL_URLS.online75 },
    { titlePattern: "Standalone Clarity Session - 90 min", tidycalUrl: TIDYCAL_URLS.online90 },
    
    // Steady Inner Balance (4 sessions/month)
    { titlePattern: "Steady Inner Balance - 45 min", tidycalUrl: TIDYCAL_URLS.online45 },
    { titlePattern: "Steady Inner Balance - 60 min", tidycalUrl: TIDYCAL_URLS.online60 },
    { titlePattern: "Steady Inner Balance - 75 min", tidycalUrl: TIDYCAL_URLS.online75 },
    { titlePattern: "Steady Inner Balance - 90 min", tidycalUrl: TIDYCAL_URLS.online90 },
    
    // Deep Work Subscription (8 sessions/month)
    { titlePattern: "Deep Work Subscription - 45 min", tidycalUrl: TIDYCAL_URLS.online45 },
    { titlePattern: "Deep Work Subscription - 60 min", tidycalUrl: TIDYCAL_URLS.online60 },
    { titlePattern: "Deep Work Subscription - 75 min", tidycalUrl: TIDYCAL_URLS.online75 },
    { titlePattern: "Deep Work Subscription - 90 min", tidycalUrl: TIDYCAL_URLS.online90 },
  ];

  // Update TidyCal URLs for existing sessions
  for (const mapping of sessionMappings) {
    const result = await prisma.session.updateMany({
      where: { title: { startsWith: mapping.titlePattern } },
      data: { tidycalUrl: mapping.tidycalUrl },
    });
    if (result.count > 0) {
      console.log(`✓ Updated ${result.count} session(s): ${mapping.titlePattern}`);
    }
  }

  // Create sessions if they don't exist
  const sessions = [
    // A. Deep Work Subscription (8 Sessions/month)
    {
      title: "Deep Work Subscription - 45 min (8 sessions/month)",
      host: "Avadhi Sharma",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 19000,
      currency: "INR",
      tidycalUrl: TIDYCAL_URLS.online45,
    },
    {
      title: "Deep Work Subscription - 60 min (8 sessions/month)",
      host: "Avadhi Sharma",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 23000,
      currency: "INR",
      tidycalUrl: TIDYCAL_URLS.online60,
    },
    {
      title: "Deep Work Subscription - 75 min (8 sessions/month)",
      host: "Avadhi Sharma",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 27000,
      currency: "INR",
      tidycalUrl: TIDYCAL_URLS.online75,
    },
    {
      title: "Deep Work Subscription - 90 min (8 sessions/month)",
      host: "Avadhi Sharma",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 31000,
      currency: "INR",
      tidycalUrl: TIDYCAL_URLS.online90,
    },

    // B. Steady Inner Balance Plan (4 Sessions/month)
    {
      title: "Steady Inner Balance - 45 min (4 sessions/month)",
      host: "Avadhi Sharma",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 10000,
      currency: "INR",
      tidycalUrl: TIDYCAL_URLS.online45,
    },
    {
      title: "Steady Inner Balance - 60 min (4 sessions/month)",
      host: "Avadhi Sharma",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 12000,
      currency: "INR",
      tidycalUrl: TIDYCAL_URLS.online60,
    },
    {
      title: "Steady Inner Balance - 75 min (4 sessions/month)",
      host: "Avadhi Sharma",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 14000,
      currency: "INR",
      tidycalUrl: TIDYCAL_URLS.online75,
    },
    {
      title: "Steady Inner Balance - 90 min (4 sessions/month)",
      host: "Avadhi Sharma",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 16000,
      currency: "INR",
      tidycalUrl: TIDYCAL_URLS.online90,
    },

    // C. Standalone Clarity Session (Single session)
    {
      title: "Standalone Clarity Session - 45 min",
      host: "Avadhi Sharma",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 3500,
      currency: "INR",
      tidycalUrl: TIDYCAL_URLS.online45,
    },
    {
      title: "Standalone Clarity Session - 60 min",
      host: "Avadhi Sharma",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 4000,
      currency: "INR",
      tidycalUrl: TIDYCAL_URLS.online60,
    },
    {
      title: "Standalone Clarity Session - 75 min",
      host: "Avadhi Sharma",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 5000,
      currency: "INR",
      tidycalUrl: TIDYCAL_URLS.online75,
    },
    {
      title: "Standalone Clarity Session - 90 min",
      host: "Avadhi Sharma",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: 6000,
      currency: "INR",
      tidycalUrl: TIDYCAL_URLS.online90,
    },
  ];

  // Check existing session titles to avoid duplicates
  const existingTitles = (await prisma.session.findMany({ select: { title: true } }))
    .map(s => s.title);

  let created = 0;
  for (const session of sessions) {
    if (!existingTitles.includes(session.title)) {
      await prisma.session.create({ data: session });
      created++;
    }
  }

  if (created > 0) {
    console.log(`✓ Created ${created} new session types`);
  }

  console.log("\n✓ TidyCal URL mapping complete:");
  console.log("  - 45 min → individual-therapy-45-minutes-online");
  console.log("  - 60 min → ic-off-ses-1hr");
  console.log("  - 75 min → ic-off-ses-1hr (TODO: Create dedicated TidyCal type)");
  console.log("  - 90 min → ic-off-ses-1hr (TODO: Create dedicated TidyCal type)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
