import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'

const updateQuestSchema = z.object({
  name: z.string().min(1),
  act: z.number().int().min(1).max(3),
  npcId: z.number().int().optional().nullable(),
  phase: z.string().optional().nullable(),
  wikiLink: z.string().optional().nullable(),
  image: z.string().optional().nullable()
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required'
    })
  }

  const body = await readBody(event)
  const result = updateQuestSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.issues
    })
  }

  const quest = await prisma.quest.update({
    where: {
      id: parseInt(id)
    },
    data: result.data
  })

  return quest
})
