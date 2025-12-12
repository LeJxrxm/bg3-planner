import { prisma } from "~~/server/utils/prisma";

interface AssignItemBody {
  characterId: number;
  itemId: number;
  slotId: number;
}

export default defineEventHandler(async (event) => {
  const runId = parseInt(event.context.params!.id);
  const body = await readBody<AssignItemBody>(event);

  // Vérifier que le slot existe et correspond au type de l'item
  const [slot, item] = await Promise.all([
    prisma.equipmentSlot.findUnique({
      where: { id: body.slotId }
    }),
    prisma.item.findUnique({
      where: { id: body.itemId }
    })
  ]);

  if (!slot || !item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Slot ou item non trouvé'
    });
  }

  if (slot.itemType !== item.type) {
    throw createError({
      statusCode: 400,
      statusMessage: `Cet item de type ${item.type} ne peut pas être équipé dans ${slot.label} (${slot.itemType})`
    });
  }

  // Créer ou mettre à jour l'assignation
  const characterItem = await prisma.characterItem.upsert({
    where: {
      uniq_slot_per_character: {
        runId,
        characterId: body.characterId,
        slotId: body.slotId
      }
    },
    create: {
      run: { connect: { id: runId } },
      character: { connect: { id: body.characterId } },
      item: { connect: { id: body.itemId } },
      slot: { connect: { id: body.slotId } }
    },
    update: {
      item: { connect: { id: body.itemId } }
    },
    include: {
      item: true,
      slot: true
    }
  });

  return characterItem;
});
