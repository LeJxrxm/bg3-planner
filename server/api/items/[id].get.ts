import { prisma } from "~~/server/utils/prisma"

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required'
    })
  }

  const item = await prisma.item.findUnique({
    where: {
      id: parseInt(id)
    }
  })

  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Item not found'
    })
  }

  return item
})
