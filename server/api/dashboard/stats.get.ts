import { prisma } from "~~/server/utils/prisma"

export default defineEventHandler(async () => {
    const [runs, items, characters, quests, merchants, pois, npcs] = await Promise.all([
        prisma.run.count(),
        prisma.item.count(),
        prisma.character.count(),
        prisma.quest.count(),
        prisma.merchant.count(),
        prisma.poi.count(),
        prisma.npc.count()
    ])

    return {
        runs,
        items,
        characters,
        quests,
        merchants,
        pois,
        npcs
    }
})
