/*
  Warnings:

  - A unique constraint covering the columns `[runId,characterId,slotId]` on the table `CharacterItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slotId` to the `CharacterItem` table without a default value. This is not possible if the table is not empty.

*/

-- CreateTable: Equipment Slots
CREATE TABLE "EquipmentSlot" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "itemType" "ItemType" NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentSlot_key_key" ON "EquipmentSlot"("key");

-- Insert predefined equipment slots
INSERT INTO "EquipmentSlot" ("key", "label", "itemType", "icon", "order") VALUES
  ('HELMET', 'Casque', 'HELMET', 'i-lucide-hard-hat', 1),
  ('CLOAK', 'Cape', 'CLOAK', 'i-lucide-shirt', 2),
  ('AMULET', 'Amulette', 'AMULET', 'i-lucide-gem', 3),
  ('ARMOR', 'Armure', 'ARMOR', 'i-lucide-shield', 4),
  ('GLOVES', 'Gants', 'GLOVES', 'i-lucide-hand', 5),
  ('RING_1', 'Anneau gauche', 'RING', 'i-lucide-circle-dot', 6),
  ('RING_2', 'Anneau droit', 'RING', 'i-lucide-circle-dot', 7),
  ('BOOTS', 'Bottes', 'BOOTS', 'i-lucide-footprints', 8),
  ('MAIN_HAND', 'Main principale', 'WEAPON', 'i-lucide-sword', 9),
  ('OFF_HAND', 'Main secondaire', 'OFFHAND', 'i-lucide-shield', 10),
  ('RANGED', 'Arme à distance', 'RANGED_WEAPON', 'i-lucide-crosshair', 11),
  ('INSTRUMENT', 'Instrument', 'INSTRUMENT', 'i-lucide-music', 12);

-- AlterTable: Add slotId column with temporary nullable constraint
ALTER TABLE "CharacterItem" ADD COLUMN "slotId" INTEGER;

-- Assign existing items to a default slot based on their item type
UPDATE "CharacterItem" ci
SET "slotId" = (
  SELECT es.id 
  FROM "EquipmentSlot" es 
  JOIN "Item" i ON i.id = ci."itemId"
  WHERE es."itemType" = i.type
  AND es."key" NOT LIKE '%_2' -- Prefer first slot for duplicates (RING_1 over RING_2)
  ORDER BY es."order"
  LIMIT 1
);

-- Make slotId required
ALTER TABLE "CharacterItem" ALTER COLUMN "slotId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CharacterItem_runId_characterId_slotId_key" ON "CharacterItem"("runId", "characterId", "slotId");

-- AddForeignKey
ALTER TABLE "CharacterItem" ADD CONSTRAINT "CharacterItem_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "EquipmentSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
