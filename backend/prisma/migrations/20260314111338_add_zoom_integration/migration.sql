-- CreateTable
CREATE TABLE "ZoomConfig" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "accessToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "therapistId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoomConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZoomMeeting" (
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

-- CreateTable
CREATE TABLE "ZoomRecording" (
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

-- CreateIndex
CREATE UNIQUE INDEX "ZoomConfig_accountId_key" ON "ZoomConfig"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "ZoomConfig_therapistId_key" ON "ZoomConfig"("therapistId");

-- CreateIndex
CREATE UNIQUE INDEX "ZoomMeeting_zoomMeetingId_key" ON "ZoomMeeting"("zoomMeetingId");

-- CreateIndex
CREATE UNIQUE INDEX "ZoomMeeting_bookingId_key" ON "ZoomMeeting"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "ZoomRecording_recordingId_key" ON "ZoomRecording"("recordingId");

-- AddForeignKey
ALTER TABLE "ZoomConfig" ADD CONSTRAINT "ZoomConfig_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "TherapistProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoomMeeting" ADD CONSTRAINT "ZoomMeeting_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoomRecording" ADD CONSTRAINT "ZoomRecording_zoomMeetingId_fkey" FOREIGN KEY ("zoomMeetingId") REFERENCES "ZoomMeeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
