import { prisma } from "~~/server/utils/prisma"

export default defineEventHandler(async (event) => {
    const total = await prisma.character.count();

    const query = getQuery(event);
    const itemsPerPage = parseInt(query.itemsPerPage as string) || 20;
    const page = parseInt((query.page as string) || '1', 10);
    const skip = (page - 1) * itemsPerPage;

    const characters = await prisma.character.findMany({
        orderBy: {
            name: 'asc'
        },
        skip: skip,
        take: itemsPerPage,
    })

    return {
        characters,
        total
    }
})
