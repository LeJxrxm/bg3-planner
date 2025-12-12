import { prisma } from "~~/server/utils/prisma"

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid character ID'
    })
  }

  await prisma.character.delete({
    where: { id }
  })

  return { success: true }
})
