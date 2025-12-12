import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID is required'
        })
    }

    await prisma.merchant.delete({
        where: {
            id: parseInt(id)
        }
    })

    return { success: true }
})
