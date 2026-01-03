-- DropForeignKey
ALTER TABLE "Invite" DROP CONSTRAINT "Invite_createdByUserId_fkey";

-- CreateIndex
CREATE INDEX "Invite_createdByUserId_idx" ON "Invite"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
