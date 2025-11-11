-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoom" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRoom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoom_userId_roomId_key" ON "UserRoom"("userId", "roomId");

-- CreateIndex
CREATE INDEX "UserRoom_userId_idx" ON "UserRoom"("userId");

-- CreateIndex
CREATE INDEX "UserRoom_roomId_idx" ON "UserRoom"("roomId");

-- AddForeignKey
ALTER TABLE "UserRoom" ADD CONSTRAINT "UserRoom_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoom" ADD CONSTRAINT "UserRoom_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing room data to new structure
-- First, create Room entries for all unique rooms
INSERT INTO "Room" ("name")
SELECT DISTINCT 
    "room" as "name"
FROM "User"
WHERE "room" IS NOT NULL AND "room" != '';

-- Then, create UserRoom entries linking users to their rooms
INSERT INTO "UserRoom" ("userId", "roomId")
SELECT 
    u."id" as "userId",
    r."id" as "roomId"
FROM "User" u
INNER JOIN "Room" r ON u."room" = r."name"
WHERE u."room" IS NOT NULL AND u."room" != '';

