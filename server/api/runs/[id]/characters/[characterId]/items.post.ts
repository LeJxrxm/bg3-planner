import { prisma } from '~~/server/utils/prisma';
import { z } from 'zod';

const assignItemSchema = z.object({
  itemId: z.number(),
  status: z.enum(['TO_GET', 'IN_PROGRESS', 'OBTAINED']).optional().default('TO_GET'),
  note: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const runId = getRouterParam(event, 'id');
  const characterId = getRouterParam(event, 'characterId');

  if (!runId || !characterId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Run ID and Character ID are required',
    });
  }

  const body = await readBody(event);
  const validation = assignItemSchema.safeParse(body);

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body',
      data: validation.error.issues,
    });
  }

  const { itemId, status, note } = validation.data;

  // Vérifier que la run existe
  const run = await prisma.run.findUnique({ where: { id: parseInt(runId) } });
  if (!run) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Run not found',
    });
  }

  // Vérifier que le personnage existe et est assigné à cette run
  const runCharacter = await prisma.runCharacter.findFirst({
    where: {
      runId: parseInt(runId),
      characterId: parseInt(characterId),
    },
  });

  if (!runCharacter) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Character not assigned to this run',
    });
  }

  // Vérifier que l'item existe
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Item not found',
    });
  }

  // Vérifier que l'item n'est pas déjà assigné dans cette run
  const existing = await prisma.characterItem.findFirst({
    where: {
      runId: parseInt(runId),
      itemId,
    },
  });

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Item already assigned in this run',
    });
  }

  // Créer l'assignation
  const characterItem = await prisma.characterItem.create({
    data: {
      runId: parseInt(runId),
      characterId: parseInt(characterId),
      itemId,
      status,
      note,
    },
    include: {
      item: true,
    },
  });

  return characterItem;
});
