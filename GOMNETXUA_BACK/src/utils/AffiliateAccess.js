"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAffiliateScope = resolveAffiliateScope;
exports.filterAffiliateListForUser = filterAffiliateListForUser;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../lib/prisma"));
/* =========================================================
   ERROR HELPER
========================================================= */
const createHttpError = (message, status) => {
    const error = new Error(message);
    error.status =
        status;
    return error;
};
/* =========================================================
   RESOLVE AFFILIATE SCOPE
========================================================= */
/*
 * ADMIN:
 * - được chọn ALL hoặc một Affiliate cụ thể.
 *
 * LIVESTREAMER:
 * - không tin affiliate frontend gửi lên.
 * - luôn lấy affiliate_code trong database.
 *
 * EMPLOYEE:
 * - không được xem hoa hồng.
 */
async function resolveAffiliateScope(req) {
    if (!req.user?.id) {
        throw createHttpError("Phiên đăng nhập không hợp lệ", 401);
    }
    const user = await prisma_1.default.user.findUnique({
        where: {
            id: req.user.id,
        },
        select: {
            id: true,
            role: true,
            affiliate_code: true,
        },
    });
    if (!user) {
        throw createHttpError("Không tìm thấy tài khoản", 404);
    }
    // ========================================
    // ADMIN
    // ========================================
    if (user.role ===
        client_1.UserRole.ADMIN) {
        const requestedAffiliate = String(req.query.affiliate ||
            "ALL").trim();
        return (requestedAffiliate ||
            "ALL");
    }
    // ========================================
    // LIVESTREAMER
    // ========================================
    if (user.role ===
        client_1.UserRole.LIVESTREAMER) {
        const affiliateCode = String(user.affiliate_code ||
            "").trim();
        if (!affiliateCode) {
            throw createHttpError("Tài khoản chưa được quản trị viên gắn với Affiliate", 403);
        }
        /*
         * Ví dụ:
         *
         * User Ái Loan:
         * affiliate_code = AILOAN
         *
         * Dù frontend gửi:
         *
         * ?affiliate=MYHANH
         *
         * backend vẫn trả:
         *
         * AILOAN
         */
        return affiliateCode;
    }
    // ========================================
    // ROLE KHÁC
    // ========================================
    throw createHttpError("Bạn không có quyền xem báo cáo hoa hồng", 403);
}
/* =========================================================
   FILTER AFFILIATE LIST
========================================================= */
async function filterAffiliateListForUser(req, rows) {
    if (!req.user?.id) {
        return [];
    }
    const user = await prisma_1.default.user.findUnique({
        where: {
            id: req.user.id,
        },
        select: {
            role: true,
            affiliate_code: true,
        },
    });
    if (!user) {
        return [];
    }
    // ========================================
    // ADMIN THẤY TẤT CẢ
    // ========================================
    if (user.role ===
        client_1.UserRole.ADMIN) {
        return rows;
    }
    // ========================================
    // LIVESTREAMER CHỈ THẤY CỦA MÌNH
    // ========================================
    if (user.role ===
        client_1.UserRole.LIVESTREAMER) {
        const assignedAffiliate = String(user.affiliate_code ||
            "")
            .trim()
            .toUpperCase();
        if (!assignedAffiliate) {
            return [];
        }
        return rows.filter((item) => String(item.ma_affiliate ||
            "")
            .trim()
            .toUpperCase() ===
            assignedAffiliate);
    }
    // Nhân viên kho hoặc role khác
    return [];
}
//# sourceMappingURL=AffiliateAccess.js.map