import { prisma } from "~~/server/utils/prisma"
import { z } from 'zod'

const updateCharacterSchema = z.object({
    name: z.string().min(1),
    classe: z.string().optional().nullable(),
    subclass: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
    const id = parseInt(getRouterParam(event, 'id') || '')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid character ID'
        })
    }

    const body = await readBody(event)
    const result = updateCharacterSchema.safeParse(body)

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Validation Error',
            data: result.error.issues
        })
    }

    const character = await prisma.character.update({
        where: { id },
        data: result.data
    })

    return character
})
