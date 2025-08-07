-- CreateTable
CREATE TABLE "public"."JoinedChannel" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JoinedChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JoinedChannel_workspaceId_channelId_key" ON "public"."JoinedChannel"("workspaceId", "channelId");

-- AddForeignKey
ALTER TABLE "public"."JoinedChannel" ADD CONSTRAINT "JoinedChannel_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
