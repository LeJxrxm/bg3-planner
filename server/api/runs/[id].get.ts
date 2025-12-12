import { prisma } from '~~/server/utils/prisma';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Run ID is required',
        });
    }

    const run = await prisma.run.findUnique({
        where: { id: parseInt(id) },
        include: {
            runCharacters: {
                include: {
                    character: {
                        include: {
                            items: {
                                where: {
                                    runId: parseInt(id)
                                },
                                include: {
                                    item: true
                                }
                            }
                        }
                    },
                },
            },
        },
    });

    if (!run) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Run not found',
        });
    }

    return run;
});
