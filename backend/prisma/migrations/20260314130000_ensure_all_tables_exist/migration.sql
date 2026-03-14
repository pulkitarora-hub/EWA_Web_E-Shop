-- Ensure Role enum exists
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('CLIENT', 'THERAPIST', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ensure NoteVisibility enum exists  
DO $$ BEGIN
    CREATE TYPE "NoteVisibility" AS ENUM ('PRIVATE', 'SHARED', 'HOMEWORK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to User if not exists
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "Role" NOT NULL DEFAULT 'CLIENT';

-- Add therapistId column to Session if not exists
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "therapistId" TEXT;

-- CreateTable TherapistProfile if not exists
CREATE TABLE IF NOT EXISTS "TherapistProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "specializations" TEXT[],
    "qualifications" TEXT,
    "licenseNumber" TEXT,
    "profileImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TherapistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable ClientProfile if not exists
CREATE TABLE IF NOT EXISTS "ClientProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "therapyGoals" TEXT,
    "intakeNotes" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable TherapyNote if not exists
CREATE TABLE IF NOT EXISTS "TherapyNote" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sessionSummary" TEXT,
    "keyThemes" TEXT[],
    "emotionalState" TEXT,
    "moodRating" INTEGER,
    "observations" TEXT,
    "interventions" TEXT,
    "actionItems" TEXT,
    "nextSessionFocus" TEXT,
    "internalNotes" TEXT,
    "visibility" "NoteVisibility" NOT NULL DEFAULT 'PRIVATE',
    "sharedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TherapyNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable NoteAttachment if not exists
CREATE TABLE IF NOT EXISTS "NoteAttachment" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NoteAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable NoteTag if not exists
CREATE TABLE IF NOT EXISTS "NoteTag" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    CONSTRAINT "NoteTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable ZoomConfig if not exists
CREATE TABLE IF NOT EXISTS "ZoomConfig" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "accessToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "therapistId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ZoomConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable ZoomMeeting if not exists
CREATE TABLE IF NOT EXISTS "ZoomMeeting" (
    "id" TEXT NOT NULL,
    "zoomMeetingId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "joinUrl" TEXT NOT NULL,
    "startUrl" TEXT NOT NULL,
    "password" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ZoomMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable ZoomRecording if not exists
CREATE TABLE IF NOT EXISTS "ZoomRecording" (
    "id" TEXT NOT NULL,
    "zoomMeetingId" TEXT NOT NULL,
    "recordingId" TEXT NOT NULL,
    "recordingType" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "downloadUrl" TEXT,
    "localPath" TEXT,
    "transcriptText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ZoomRecording_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes if not exist
CREATE UNIQUE INDEX IF NOT EXISTS "TherapistProfile_userId_key" ON "TherapistProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "ClientProfile_userId_key" ON "ClientProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "TherapyNote_bookingId_key" ON "TherapyNote"("bookingId");
CREATE INDEX IF NOT EXISTS "NoteTag_tag_idx" ON "NoteTag"("tag");
CREATE INDEX IF NOT EXISTS "NoteTag_category_idx" ON "NoteTag"("category");
CREATE UNIQUE INDEX IF NOT EXISTS "ZoomConfig_accountId_key" ON "ZoomConfig"("accountId");
CREATE UNIQUE INDEX IF NOT EXISTS "ZoomConfig_therapistId_key" ON "ZoomConfig"("therapistId");
CREATE UNIQUE INDEX IF NOT EXISTS "ZoomMeeting_zoomMeetingId_key" ON "ZoomMeeting"("zoomMeetingId");
CREATE UNIQUE INDEX IF NOT EXISTS "ZoomMeeting_bookingId_key" ON "ZoomMeeting"("bookingId");
CREATE UNIQUE INDEX IF NOT EXISTS "ZoomRecording_recordingId_key" ON "ZoomRecording"("recordingId");

-- Add foreign keys (skip if already exist)
DO $$ BEGIN
    ALTER TABLE "TherapistProfile" ADD CONSTRAINT "TherapistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Session" ADD CONSTRAINT "Session_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "TherapistProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "TherapyNote" ADD CONSTRAINT "TherapyNote_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "TherapyNote" ADD CONSTRAINT "TherapyNote_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "TherapyNote" ADD CONSTRAINT "TherapyNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "NoteAttachment" ADD CONSTRAINT "NoteAttachment_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "TherapyNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "NoteTag" ADD CONSTRAINT "NoteTag_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "TherapyNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ZoomConfig" ADD CONSTRAINT "ZoomConfig_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "TherapistProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ZoomMeeting" ADD CONSTRAINT "ZoomMeeting_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ZoomRecording" ADD CONSTRAINT "ZoomRecording_zoomMeetingId_fkey" FOREIGN KEY ("zoomMeetingId") REFERENCES "ZoomMeeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
