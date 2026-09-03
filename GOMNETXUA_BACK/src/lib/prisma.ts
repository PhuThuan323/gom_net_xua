import { PrismaClient } from "@prisma/client";

/**
 * Giữ một PrismaClient duy nhất trong toàn bộ Node process.
 *
 * globalThis giúp tránh tạo nhiều PrismaClient
 * khi chạy development / hot reload.
 */
const globalForPrisma =
  globalThis as unknown as {
    prisma?: PrismaClient;
  };

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (
  process.env.NODE_ENV !== "production"
) {
  globalForPrisma.prisma = prisma;
}

export default prisma;