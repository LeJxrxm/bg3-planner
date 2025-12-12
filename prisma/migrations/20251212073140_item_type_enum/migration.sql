/*
  Warnings:

  - Changed the type of `type` on the `Item` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('AMULET', 'ARMOR', 'CLOAK', 'BOOTS', 'GLOVES', 'HELMET', 'RING', 'WEAPON', 'OFFHAND', 'RANGED_WEAPON', 'INSTRUMENT');

-- AlterTable: Convert existing string values to enum
ALTER TABLE "Item" 
  ADD COLUMN "type_new" "ItemType";

-- Migrate data: map common string values to enum values
UPDATE "Item" 
SET "type_new" = 
  CASE 
    WHEN LOWER("type") LIKE '%arme%' OR LOWER("type") LIKE '%weapon%' THEN 'WEAPON'::"ItemType"
    WHEN LOWER("type") LIKE '%armure%' OR LOWER("type") LIKE '%armor%' THEN 'ARMOR'::"ItemType"
    WHEN LOWER("type") LIKE '%anneau%' OR LOWER("type") LIKE '%ring%' THEN 'RING'::"ItemType"
    WHEN LOWER("type") LIKE '%amulette%' OR LOWER("type") LIKE '%necklace%' THEN 'AMULET'::"ItemType"
    WHEN LOWER("type") LIKE '%botte%' OR LOWER("type") LIKE '%boot%' THEN 'BOOTS'::"ItemType"
    WHEN LOWER("type") LIKE '%gant%' OR LOWER("type") LIKE '%glove%' THEN 'GLOVES'::"ItemType"
    WHEN LOWER("type") LIKE '%casque%' OR LOWER("type") LIKE '%helmet%' THEN 'HELMET'::"ItemType"
    WHEN LOWER("type") LIKE '%cape%' OR LOWER("type") LIKE '%cloak%' THEN 'CLOAK'::"ItemType"
    WHEN LOWER("type") LIKE '%arc%' OR LOWER("type") LIKE '%ranged%' THEN 'RANGED_WEAPON'::"ItemType"
    WHEN LOWER("type") LIKE '%bouclier%' OR LOWER("type") LIKE '%shield%' OR LOWER("type") LIKE '%offhand%' THEN 'OFFHAND'::"ItemType"
    WHEN LOWER("type") LIKE '%instrument%' THEN 'INSTRUMENT'::"ItemType"
    ELSE 'WEAPON'::"ItemType" -- Valeur par défaut pour les autres cas
  END;

-- Drop old column and rename new one
ALTER TABLE "Item" DROP COLUMN "type";
ALTER TABLE "Item" RENAME COLUMN "type_new" TO "type";

-- Make column required
ALTER TABLE "Item" ALTER COLUMN "type" SET NOT NULL;
