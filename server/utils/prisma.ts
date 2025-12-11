import { PrismaClient } from '~~/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = useRuntimeConfig().databaseUrl || '';

const adapter = new PrismaPg({
    connectionString,
});

const prisma = new PrismaClient({
    adapter,
});

export { prisma };