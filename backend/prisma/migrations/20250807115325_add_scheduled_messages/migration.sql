/*
  Warnings:

  - You are about to drop the column `error` on the `ScheduledMessage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ScheduledMessage" DROP COLUMN "error",
ALTER COLUMN "status" SET DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "ScheduledMessage_workspaceId_scheduledAt_idx" ON "public"."ScheduledMessage"("workspaceId", "scheduledAt");

-- CreateIndex
CREATE INDEX "ScheduledMessage_status_scheduledAt_idx" ON "public"."ScheduledMessage"("status", "scheduledAt");
