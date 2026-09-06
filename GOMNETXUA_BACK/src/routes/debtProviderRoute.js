"use strict";
// src/routes/debtProviderRoutes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const debtProviderController_1 = __importDefault(require("../controllers/debtProviderController"));
const router = (0, express_1.Router)();
/*
 * Route cố định đặt trước route có :id
 */
router.get("/dashboard", debtProviderController_1.default.dashboard.bind(debtProviderController_1.default));
router.get("/suppliers", debtProviderController_1.default.suppliers.bind(debtProviderController_1.default));
router.get("/transactions", debtProviderController_1.default.transactions.bind(debtProviderController_1.default));
router.get("/suppliers/:id/summary", debtProviderController_1.default.supplierSummary.bind(debtProviderController_1.default));
router.get("/suppliers/:id/history", debtProviderController_1.default.supplierHistory.bind(debtProviderController_1.default));
/*
 * Tạo công nợ thủ công
 */
router.post("/", debtProviderController_1.default.createDebt.bind(debtProviderController_1.default));
router.post("/payment", debtProviderController_1.default.createPayment.bind(debtProviderController_1.default));
router.post("/adjustment", debtProviderController_1.default.createAdjustment.bind(debtProviderController_1.default));
/*
 * SỬA / XÓA 1 giao dịch công nợ
 */
router.put("/transactions/:id", debtProviderController_1.default.updateTransaction.bind(debtProviderController_1.default));
router.delete("/transactions/:id", debtProviderController_1.default.deleteTransaction.bind(debtProviderController_1.default));
exports.default = router;
//# sourceMappingURL=debtProviderRoute.js.map