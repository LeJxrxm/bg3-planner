import { prisma } from '~~/server/utils/prisma';
import { z } from 'zod';

const assignCharacterSchema = z.object({
    characterId: z.number(),
});

export default defineEventHandler(async (event) => {
    const runId = getRouterParam(event, 'id');

    if (!runId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Run ID is required',
        });
    }

    const body = await readBody(event);
    const validation = assignCharacterSchema.safeParse(body);

    if (!validation.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid request body',
            data: validation.error.issues,
        });
    }

    const { characterId } = validation.data;

    // Vérifier que la run existe
    const run = await prisma.run.findUnique({ where: { id: parseInt(runId) } });
    if (!run) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Run not found',
        });
    }

    // Vérifier que le personnage existe
    const character = await prisma.character.findUnique({ where: { id: characterId } });
    if (!character) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Character not found',
        });
    }

    // Vérifier que le personnage n'est pas déjà assigné
    const existing = await prisma.runCharacter.findFirst({
        where: {
            runId: parseInt(runId),
            characterId,
        },
    });

    if (existing) {
        throw createError({
            statusCode: 409,
            statusMessage: 'Character already assigned to this run',
        });
    }

    // Vérifier la limite de personnages 
    const assignedCount = await prisma.runCharacter.count({
        where: { runId: parseInt(runId) },
    });

    if (assignedCount >= 4) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Run character limit reached',
        });
    }

    // Créer l'assignation
    const runCharacter = await prisma.runCharacter.create({
        data: {
            runId: parseInt(runId),
            characterId,
        },
        include: {
            character: true,
        },
    });

    return runCharacter;
});
