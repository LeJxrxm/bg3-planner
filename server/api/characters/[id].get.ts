import { prisma } from "~~/server/utils/prisma"

export default defineEventHandler(async (event) => {
    const id = parseInt(getRouterParam(event, 'id') || '')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid character ID'
        })
    }

    const character = await prisma.character.findUnique({
        where: { id },
    })

    if (!character) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Character not found'
        })
    }

    return character
})
