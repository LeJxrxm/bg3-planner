import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required'
    })
  }

  const poi = await prisma.poi.findUnique({
    where: {
      id: parseInt(id)
    }
  })

  if (!poi) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Poi not found'
    })
  }

  return poi
})
