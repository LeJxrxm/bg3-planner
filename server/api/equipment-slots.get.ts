import { prisma } from "~~/server/utils/prisma";

export default defineEventHandler(async () => {
  const slots = await prisma.equipmentSlot.findMany({
    orderBy: {
      order: 'asc'
    }
  });

  return slots;
});
