-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "policyAgreedAt" TIMESTAMP(3),
ADD COLUMN     "policySignature" TEXT,
ADD COLUMN     "policySignedName" TEXT;
