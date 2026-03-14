-- AlterTable
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "tidycalBookingId" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "meetingUrl" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "actualStartTime" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "actualEndTime" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "tidycalSyncedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_tidycalBookingId_key" ON "Booking"("tidycalBookingId");
