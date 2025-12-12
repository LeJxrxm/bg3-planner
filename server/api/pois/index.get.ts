import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const total = await prisma.poi.count();

  const queryParams = getQuery(event);
  const page = parseInt((queryParams.page as string) || '1');
  const pageSize = parseInt((queryParams.pageSize as string) || '20');
  const skip = (page - 1) * pageSize;


  const pois = await prisma.poi.findMany({
    orderBy: {
      name: 'asc'
    },
    skip: skip,
    take: pageSize
  })
  return { pois, total }
})
