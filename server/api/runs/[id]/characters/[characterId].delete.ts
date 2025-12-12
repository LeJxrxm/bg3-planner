import { prisma } from '~~/server/utils/prisma';

export default defineEventHandler(async (event) => {
    const runId = getRouterParam(event, 'id');
    const characterId = getRouterParam(event, 'characterId');

    if (!runId || !characterId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Run ID and Character ID are required',
        });
    }

    // Trouver et supprimer l'assignation
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

    await prisma.characterItem.deleteMany({
        where: {
            runId: parseInt(runId),
            characterId: parseInt(characterId),
        },
    });

    // Supprimer l'assignation 
    await prisma.runCharacter.delete({
        where: {
            id: runCharacter.id,
        },
    });

    return { success: true };
});
