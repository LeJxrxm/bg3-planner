import { prisma } from "~~/server/utils/prisma"
import { z } from 'zod'

const createItemSchema = z.object({
  name: z.string(),
  type: z.string(),
  act: z.number().int().min(1).max(3),
  sourceType: z.enum(['MERCHANT', 'QUEST', 'POI']),
  image: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  rarity: z.enum(['COMMON', 'UNCOMMON', 'RARE', 'VERY_RARE', 'LEGENDARY', 'STORY']).optional().nullable()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = createItemSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.issues
    })
  }

  const item = await prisma.item.create({
    data: result.data
  })

  return item
})
