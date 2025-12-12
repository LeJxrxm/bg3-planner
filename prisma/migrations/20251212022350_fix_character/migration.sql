/*
  Warnings:

  - You are about to drop the column `runId` on the `Character` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Character" DROP CONSTRAINT "Character_runId_fkey";

-- AlterTable
ALTER TABLE "Character" DROP COLUMN "runId";

-- CreateTable
CREATE TABLE "RunCharacter" (
    "id" SERIAL NOT NULL,
    "runId" INTEGER NOT NULL,
    "characterId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RunCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RunCharacter_runId_characterId_key" ON "RunCharacter"("runId", "characterId");

-- AddForeignKey
ALTER TABLE "RunCharacter" ADD CONSTRAINT "RunCharacter_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunCharacter" ADD CONSTRAINT "RunCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
