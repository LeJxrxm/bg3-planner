import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID is required'
        })
    }

    const merchant = await prisma.merchant.findUnique({
        where: {
            id: parseInt(id)
        }
    })

    if (!merchant) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Merchant not found'
        })
    }

    return merchant
})
