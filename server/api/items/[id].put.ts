import { prisma } from "~~/server/utils/prisma"
import { z } from 'zod'

const updateItemSchema = z.object({
  name: z.string(),
  type: z.string(),
  act: z.number().int().min(1).max(3),
  sourceType: z.enum(['MERCHANT', 'QUEST', 'POI']),
  merchantId: z.number().optional().nullable(),
  questId: z.number().optional().nullable(),
  poiId: z.number().optional().nullable(),
  npcId: z.number().optional().nullable(),
  image: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  rarity: z.enum(['COMMON', 'UNCOMMON', 'RARE', 'VERY_RARE', 'LEGENDARY', 'STORY']).optional().nullable(),
  wikiLink: z.string().optional().nullable()
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
  const result = updateItemSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.issues
    })
  }

  const item = await prisma.item.update({
    where: {
      id: parseInt(id)
    },
    data: result.data
  })

  return item
})
