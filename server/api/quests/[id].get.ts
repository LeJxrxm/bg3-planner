import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required'
    })
  }

  const quest = await prisma.quest.findUnique({
    where: {
      id: parseInt(id)
    },
    include: {
      npc: true
    }
  })

  if (!quest) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Quest not found'
    })
  }

  return quest
})
