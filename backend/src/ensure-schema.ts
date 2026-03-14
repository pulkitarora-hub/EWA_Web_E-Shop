import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureSchema() {
  console.log("Running pre-migration schema check...");

  try {
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('CLIENT', 'THERAPIST', 'ADMIN');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("  Role enum: OK");

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "NoteVisibility" AS ENUM ('PRIVATE', 'SHARED', 'HOMEWORK');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("  NoteVisibility enum: OK");

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "Role" NOT NULL DEFAULT 'CLIENT';
    `);
    console.log("  User.role: OK");

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "therapistId" TEXT;
    `);
    console.log("  Session.therapistId: OK");

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "tidycalBookingId" INTEGER;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "meetingUrl" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "actualStartTime" TIMESTAMP(3);
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "actualEndTime" TIMESTAMP(3);
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "tidycalSyncedAt" TIMESTAMP(3);
    `);
    console.log("  Booking TidyCal columns: OK");

    const tables = [
      {
        name: "TherapistProfile",
        sql: `CREATE TABLE IF NOT EXISTS "TherapistProfile" (
          "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "bio" TEXT,
          "specializations" TEXT[], "qualifications" TEXT, "licenseNumber" TEXT,
          "profileImageUrl" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "TherapistProfile_pkey" PRIMARY KEY ("id")
        );`,
      },
      {
        name: "ClientProfile",
        sql: `CREATE TABLE IF NOT EXISTS "ClientProfile" (
          "id" TEXT NOT NULL, "userId" TEXT NOT NULL,
          "emergencyContact" TEXT, "emergencyPhone" TEXT,
          "therapyGoals" TEXT, "intakeNotes" TEXT, "dateOfBirth" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("id")
        );`,
      },
      {
        name: "TherapyNote",
        sql: `CREATE TABLE IF NOT EXISTS "TherapyNote" (
          "id" TEXT NOT NULL, "bookingId" TEXT NOT NULL,
          "therapistId" TEXT NOT NULL, "clientId" TEXT NOT NULL,
          "sessionSummary" TEXT, "keyThemes" TEXT[], "emotionalState" TEXT,
          "moodRating" INTEGER, "observations" TEXT, "interventions" TEXT,
          "actionItems" TEXT, "nextSessionFocus" TEXT, "internalNotes" TEXT,
          "visibility" "NoteVisibility" NOT NULL DEFAULT 'PRIVATE',
          "sharedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "TherapyNote_pkey" PRIMARY KEY ("id")
        );`,
      },
      {
        name: "NoteAttachment",
        sql: `CREATE TABLE IF NOT EXISTS "NoteAttachment" (
          "id" TEXT NOT NULL, "noteId" TEXT NOT NULL,
          "fileName" TEXT NOT NULL, "fileUrl" TEXT NOT NULL,
          "fileType" TEXT NOT NULL, "fileSizeBytes" INTEGER NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "NoteAttachment_pkey" PRIMARY KEY ("id")
        );`,
      },
      {
        name: "NoteTag",
        sql: `CREATE TABLE IF NOT EXISTS "NoteTag" (
          "id" TEXT NOT NULL, "noteId" TEXT NOT NULL,
          "tag" TEXT NOT NULL, "category" TEXT NOT NULL,
          CONSTRAINT "NoteTag_pkey" PRIMARY KEY ("id")
        );`,
      },
      {
        name: "ZoomConfig",
        sql: `CREATE TABLE IF NOT EXISTS "ZoomConfig" (
          "id" TEXT NOT NULL, "accountId" TEXT NOT NULL,
          "clientId" TEXT NOT NULL, "clientSecret" TEXT NOT NULL,
          "accessToken" TEXT, "tokenExpiry" TIMESTAMP(3),
          "therapistId" TEXT, "isDefault" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ZoomConfig_pkey" PRIMARY KEY ("id")
        );`,
      },
      {
        name: "ZoomMeeting",
        sql: `CREATE TABLE IF NOT EXISTS "ZoomMeeting" (
          "id" TEXT NOT NULL, "zoomMeetingId" TEXT NOT NULL,
          "bookingId" TEXT NOT NULL, "joinUrl" TEXT NOT NULL,
          "startUrl" TEXT NOT NULL, "password" TEXT,
          "status" TEXT NOT NULL DEFAULT 'scheduled',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ZoomMeeting_pkey" PRIMARY KEY ("id")
        );`,
      },
      {
        name: "ZoomRecording",
        sql: `CREATE TABLE IF NOT EXISTS "ZoomRecording" (
          "id" TEXT NOT NULL, "zoomMeetingId" TEXT NOT NULL,
          "recordingId" TEXT NOT NULL, "recordingType" TEXT NOT NULL,
          "fileType" TEXT NOT NULL, "fileSize" INTEGER,
          "downloadUrl" TEXT, "localPath" TEXT, "transcriptText" TEXT,
          "status" TEXT NOT NULL DEFAULT 'processing',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ZoomRecording_pkey" PRIMARY KEY ("id")
        );`,
      },
    ];

    for (const t of tables) {
      await prisma.$executeRawUnsafe(t.sql);
      console.log(`  ${t.name}: OK`);
    }

    // Indexes
    const indexes = [
      `CREATE UNIQUE INDEX IF NOT EXISTS "TherapistProfile_userId_key" ON "TherapistProfile"("userId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "ClientProfile_userId_key" ON "ClientProfile"("userId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "TherapyNote_bookingId_key" ON "TherapyNote"("bookingId")`,
      `CREATE INDEX IF NOT EXISTS "NoteTag_tag_idx" ON "NoteTag"("tag")`,
      `CREATE INDEX IF NOT EXISTS "NoteTag_category_idx" ON "NoteTag"("category")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "ZoomConfig_accountId_key" ON "ZoomConfig"("accountId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "ZoomConfig_therapistId_key" ON "ZoomConfig"("therapistId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "ZoomMeeting_zoomMeetingId_key" ON "ZoomMeeting"("zoomMeetingId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "ZoomMeeting_bookingId_key" ON "ZoomMeeting"("bookingId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "ZoomRecording_recordingId_key" ON "ZoomRecording"("recordingId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Booking_tidycalBookingId_key" ON "Booking"("tidycalBookingId")`,
    ];
    for (const idx of indexes) {
      await prisma.$executeRawUnsafe(idx);
    }
    console.log("  Indexes: OK");

    // Foreign keys
    const fkeys = [
      `ALTER TABLE "TherapistProfile" ADD CONSTRAINT "TherapistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "Session" ADD CONSTRAINT "Session_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "TherapistProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
      `ALTER TABLE "TherapyNote" ADD CONSTRAINT "TherapyNote_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "TherapyNote" ADD CONSTRAINT "TherapyNote_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "TherapyNote" ADD CONSTRAINT "TherapyNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "NoteAttachment" ADD CONSTRAINT "NoteAttachment_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "TherapyNote"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "NoteTag" ADD CONSTRAINT "NoteTag_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "TherapyNote"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "ZoomConfig" ADD CONSTRAINT "ZoomConfig_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "TherapistProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
      `ALTER TABLE "ZoomMeeting" ADD CONSTRAINT "ZoomMeeting_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "ZoomRecording" ADD CONSTRAINT "ZoomRecording_zoomMeetingId_fkey" FOREIGN KEY ("zoomMeetingId") REFERENCES "ZoomMeeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    ];
    for (const fk of fkeys) {
      try {
        await prisma.$executeRawUnsafe(fk);
      } catch {
        // FK already exists - that's fine
      }
    }
    console.log("  Foreign keys: OK");

    // Mark migrations as applied so prisma migrate deploy doesn't re-run them
    const migrationsToMark = [
      "20260314102209_add_therapy_management_models",
      "20260314111338_add_zoom_integration",
      "20260314120000_add_tidycal_booking_fields",
      "20260314130000_ensure_all_tables_exist",
    ];
    for (const name of migrationsToMark) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
        SELECT gen_random_uuid(), 'manual', '${name}', NOW(), 1
        WHERE NOT EXISTS (
          SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '${name}'
        );
      `);
    }
    console.log("  Migration records: OK");

    console.log("Pre-migration schema check complete.");
  } catch (error) {
    console.error("Schema ensure error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

ensureSchema();
