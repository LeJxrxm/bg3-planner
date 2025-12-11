import { prisma } from "~~/server/utils/prisma"

export default defineEventHandler(async (event) => {
    const total = await prisma.item.count();

    console.log(event);

    // Get query parameters for pagination
    const query = getQuery(event);

    console.log('Query parameters:', Object.keys(query));
    const itemsPerPage = parseInt(query.itemsPerPage as string) || 20;
    const page = parseInt((query.page as string) || '1', 10);
    console.log(`Fetching items - Page: ${page}, Items per page: ${itemsPerPage}, Total items: ${total}`);
    const skip = (page - 1) * itemsPerPage;

    const items = await prisma.item.findMany({
        orderBy: {
            name: 'asc'
        },
        skip: skip,
        take: itemsPerPage
    })

    const res = {
        items,
        total
    }

    console.log('Items fetched:', res);
    return res
})
