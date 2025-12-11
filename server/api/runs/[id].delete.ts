export default defineEventHandler((event) => {
    const runId = Number(event.context.params?.id)

    return prisma.run.delete({
        where: {
            id: runId,
        },
    })
});