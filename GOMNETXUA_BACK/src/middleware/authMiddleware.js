"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET chưa được cấu hình");
    }
    return secret;
};
/* =========================================================
   REQUIRE LOGIN
========================================================= */
const requireAuth = (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        if (!authorization ||
            !authorization.startsWith("Bearer ")) {
            return res
                .status(401)
                .json({
                success: false,
                message: "Bạn chưa đăng nhập",
            });
        }
        const token = authorization.slice(7);
        const decoded = jsonwebtoken_1.default.verify(token, getSecret());
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        };
        next();
    }
    catch {
        return res
            .status(401)
            .json({
            success: false,
            message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn",
        });
    }
};
exports.requireAuth = requireAuth;
/* =========================================================
   ADMIN ONLY
========================================================= */
const requireAdmin = (req, res, next) => {
    if (req.user?.role !==
        "ADMIN") {
        return res
            .status(403)
            .json({
            success: false,
            message: "Chức năng này chỉ dành cho quản trị viên",
        });
    }
    next();
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=authMiddleware.js.map