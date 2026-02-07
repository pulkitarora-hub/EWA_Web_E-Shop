-- AlterTable
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
