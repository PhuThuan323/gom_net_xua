"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const affiliateCommissionController_1 = __importDefault(require("../controllers/affiliateCommissionController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/* =========================================================
   DASHBOARD HOA HỒNG
   ADMIN + EMPLOYEE ĐỀU ĐƯỢC XEM
========================================================= */
router.get("/dashboard", authMiddleware_1.requireAuth, affiliateCommissionController_1.default
    .dashboard
    .bind(affiliateCommissionController_1.default));
/* =========================================================
   DANH SÁCH AFFILIATE
   ADMIN + EMPLOYEE ĐỀU ĐƯỢC XEM
========================================================= */
router.get("/affiliates", authMiddleware_1.requireAuth, affiliateCommissionController_1.default
    .affiliates
    .bind(affiliateCommissionController_1.default));
/* =========================================================
   THANH TOÁN
   Nếu sau này dùng trang quản trị thanh toán
   thì chỉ ADMIN xem
========================================================= */
router.get("/payments", authMiddleware_1.requireAuth, authMiddleware_1.requireAdmin, affiliateCommissionController_1.default
    .payments
    .bind(affiliateCommissionController_1.default));
exports.default = router;
//# sourceMappingURL=affiliateCommissionRoute.js.map