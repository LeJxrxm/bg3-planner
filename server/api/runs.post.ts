// server/api/runs.post.ts
import { prisma } from '../utils/prisma'

interface CreateRunBody {
    name: string
    description?: string
}

export default defineEventHandler(async (event) => {
    const body = await readBody<CreateRunBody>(event)

    if (!body.name || !body.name.trim()) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Name is required',
        })
    }

    const run = await prisma.run.create({
        data: {
            name: body.name.trim(),
            description: body.description?.trim() || 'test',
        },
    })

    return run
})
