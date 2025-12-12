import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'

const createPoiSchema = z.object({
  name: z.string().min(1),
  act: z.number().int().min(1).max(3),
  pos_x: z.number().int().optional().nullable(),
  pos_y: z.number().int().optional().nullable(),
  wikiLink: z.string().optional().nullable(),
  image: z.string().optional().nullable()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = createPoiSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.issues
    })
  }

  const poi = await prisma.poi.create({
    data: result.data
  })

  return poi
})
