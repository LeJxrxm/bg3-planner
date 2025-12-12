import { prisma } from "~~/server/utils/prisma"

export default defineEventHandler(async (event) => {
    // Get query parameters for pagination
    const query = getQuery(event);

    const itemsPerPage = parseInt(query.itemsPerPage as string) || 20;
    const page = parseInt((query.page as string) || '1', 10);
    const skip = (page - 1) * itemsPerPage;
    
    const search = query.search as string | undefined;

    // Build where clause for search
    const where = search ? {
        name: {
            contains: search,
            mode: 'insensitive' as const
        }
    } : {};

    const [items, total] = await Promise.all([
        prisma.item.findMany({
            where,
            orderBy: {
                name: 'asc'
            },
            skip: skip,
            take: itemsPerPage
        }),
        prisma.item.count({ where })
    ]);

    const res = {
        items,
        total
    }

    return res
})
