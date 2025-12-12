// server/api/runs.get.ts
import { prisma } from "~~/server/utils/prisma"

export default defineEventHandler(async () => {
  const runs = await prisma.run.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      runCharacters: true
    }
  })

  return runs
})
