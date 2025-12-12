import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required'
    })
  }

  const npc = await prisma.npc.findUnique({
    where: {
      id: parseInt(id)
    }
  })

  if (!npc) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Npc not found'
    })
  }

  return npc
})
