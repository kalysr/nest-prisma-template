import { PrismaClient } from '@prisma/client';

export const getPrisma = (() => {
  let prisma: PrismaClient;

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
  });

  return () => {
    if (prisma) return prisma;

    prisma = new PrismaClient();

    return prisma;
  };
})();

export const prisma = getPrisma();

// Refer:
// https://www.prisma.io/docs/concepts/components/prisma-client/crud#deleting-all-data-with-raw-sql--truncate
export const cleanUpDatabase = (() => {
  const prisma = getPrisma();

  const getTablesToTruncate = async () => {
    const tablesNames = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const excludedTables = ['_prisma_migrations'];

    return tablesNames
      .map(({ tablename }) => tablename)
      .filter((name) => !excludedTables.includes(name))
      .map((name) => `"public"."${name}"`);
  };

  return async () => {
    const tablesToTruncate = await getTablesToTruncate();

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tablesToTruncate.join(', ')} CASCADE;`);
  };
})();

export const cleanUp = async () => {
  await cleanUpDatabase();
};
