import { prisma } from '~~/server/utils/prisma';

export default defineEventHandler(async (event) => {
    const runId = getRouterParam(event, 'id');
    const characterId = getRouterParam(event, 'characterId');
    const itemId = getRouterParam(event, 'itemId');

    if (!runId || !characterId || !itemId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Run ID, Character ID and Item ID are required',
        });
    }

    // Trouver et supprimer l'assignation
    const characterItem = await prisma.characterItem.findUnique({
        where: {
            uniq_item_per_run: {
                runId: parseInt(runId),
                itemId: parseInt(itemId),
            }
        },
    });

    console.log('characterItem to delete:', characterItem);

    if (!characterItem) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Item assignment not found',
        });
    }

    await prisma.characterItem.delete({
        where: {
            id: characterItem.id,
        },
    });

    return { success: true };
});
