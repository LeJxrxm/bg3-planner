// server/api/runs/demo.post.ts
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async () => {
    const run = await prisma.run.create({
        data: {
            name: 'BG3 Demo Run',
            description: 'Run de test avec Tav, Karlach, Gale et Wyll',
            characters: {
                create: [
                    { name: 'Tav', classe: 'Custom', subclass: null },
                    { name: 'Karlach', classe: 'Barbarian', subclass: 'Berserker' },
                    { name: 'Gale', classe: 'Wizard', subclass: 'Evocation' },
                    { name: 'Wyll', classe: 'Warlock', subclass: 'The Fiend' },
                ],
            },
        },
        include: {
            characters: true,
        },
    })

    return run
})
