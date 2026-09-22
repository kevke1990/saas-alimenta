import { PrismaClient } from "@prisma/client";
import { ControlModeError, getSessionContext, isSystemControlWriteAllowed } from "./control-mode";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const basePrisma = globalForPrisma.prisma ?? new PrismaClient();

const modelWriteOperations = new Set([
  "create",
  "createMany",
  "createManyAndReturn",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "upsert",
  "delete",
  "deleteMany",
]);

const rawWriteOperations = new Set(["$executeRaw", "$executeRawUnsafe"]);

const extendedPrisma = basePrisma.$extends({
  query: {
    async $allOperations({ model, operation, args, query }: any) {
      const isWrite = model ? modelWriteOperations.has(operation) : rawWriteOperations.has(operation);
      if (!isWrite) return query(args);

      const context = await getSessionContext();
      if (!context.sessionHash) return query(args);

      const session = await basePrisma.authSession.findFirst({
        where: {
          tokenHash: context.sessionHash,
          userId: context.userId ?? undefined,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: { controlMode: true },
      });

      if (
        session?.controlMode === "READ_ONLY" &&
        !isSystemControlWriteAllowed(model, operation, args, context.sessionHash)
      ) {
        throw new ControlModeError();
      }

      return query(args);
    },
  },
});

export const db = extendedPrisma as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;
