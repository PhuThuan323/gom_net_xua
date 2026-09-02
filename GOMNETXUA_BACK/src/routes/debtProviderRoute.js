"use strict";
// src/routes/debtProviderRoute.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const debtProviderController_1 = __importDefault(require("../controllers/debtProviderController"));
const router = (0, express_1.Router)();
/*
|--------------------------------------------------------------------------
| DASHBOARD CÔNG NỢ
|--------------------------------------------------------------------------
|
| GET /api/debts/dashboard
|
*/
router.get("/dashboard", debtProviderController_1.default.dashboard.bind(debtProviderController_1.default));
/*
|--------------------------------------------------------------------------
| DANH SÁCH NHÀ CUNG CẤP + SỐ DƯ
|--------------------------------------------------------------------------
|
| GET /api/debts/suppliers
|
*/
router.get("/suppliers", debtProviderController_1.default.suppliers.bind(debtProviderController_1.default));
/*
|--------------------------------------------------------------------------
| LỊCH SỬ TẤT CẢ GIAO DỊCH
|--------------------------------------------------------------------------
|
| GET /api/debts/transactions
|
| Query:
| ?supplier_id=1
| &transaction_type=DEBT
| &from=2026-08-01
| &to=2026-08-31
| &page=1
| &limit=100
|
*/
router.get("/transactions", debtProviderController_1.default.transactions.bind(debtProviderController_1.default));
/*
|--------------------------------------------------------------------------
| TỔNG QUAN CÔNG NỢ 1 NHÀ CUNG CẤP
|--------------------------------------------------------------------------
|
| GET /api/debts/suppliers/:id/summary
|
*/
router.get("/suppliers/:id/summary", debtProviderController_1.default.supplierSummary.bind(debtProviderController_1.default));
/*
|--------------------------------------------------------------------------
| LỊCH SỬ CÔNG NỢ 1 NHÀ CUNG CẤP
|--------------------------------------------------------------------------
|
| GET /api/debts/suppliers/:id/history
|
*/
router.get("/suppliers/:id/history", debtProviderController_1.default.supplierHistory.bind(debtProviderController_1.default));
/*
|--------------------------------------------------------------------------
| TẠO KHOẢN NỢ MỚI / NỢ THÊM
|--------------------------------------------------------------------------
|
| POST /api/debts
|
| Body:
|
| {
|   "supplier_id": 1,
|   "amount": 13800000,
|   "transaction_date": "2026-08-19",
|   "reference_code": "PN0001",
|   "note": "TỔNG 690 THÙNG XỐP"
| }
|
*/
router.post("/", debtProviderController_1.default.createDebt.bind(debtProviderController_1.default));
/*
|--------------------------------------------------------------------------
| TRẢ CÔNG NỢ
|--------------------------------------------------------------------------
|
| POST /debt/payment
|
| Body:
|
| {
|   "supplier_id": 1,
|   "amount": 50000000,
|   "transaction_date": "2026-08-30",
|   "payment_method": "Chuyển khoản",
|   "reference_code": "CK300826",
|   "note": "Thanh toán công nợ NCC"
| }
|
*/
router.post("/payment", debtProviderController_1.default.createPayment.bind(debtProviderController_1.default));
/*
|--------------------------------------------------------------------------
| ĐIỀU CHỈNH CÔNG NỢ
|--------------------------------------------------------------------------
|
| POST /api/debts/adjustment
|
| amount dương  = tăng công nợ
| amount âm     = giảm công nợ
|
*/
router.post("/adjustment", debtProviderController_1.default.createAdjustment.bind(debtProviderController_1.default));
exports.default = router;
//# sourceMappingURL=debtProviderRoute.js.map