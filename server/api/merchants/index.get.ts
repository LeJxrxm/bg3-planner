import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const total = await prisma.merchant.count();

    const queryParams = getQuery(event);
    const page = parseInt((queryParams.page as string) || '1');
    const pageSize = parseInt((queryParams.pageSize as string) || '20');
    const skip = (page - 1) * pageSize;


    const merchants = await prisma.merchant.findMany({
        orderBy: {
            name: 'asc'
        },
        skip: skip,
        take: pageSize
    })
    return { merchants, total }
})
