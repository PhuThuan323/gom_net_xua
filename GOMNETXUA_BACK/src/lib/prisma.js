"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
/**
 * Giữ một PrismaClient duy nhất trong toàn bộ Node process.
 *
 * globalThis giúp tránh tạo nhiều PrismaClient
 * khi chạy development / hot reload.
 */
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development"
            ? ["warn", "error"]
            : ["error"],
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
exports.default = prisma;
//# sourceMappingURL=prisma.js.map