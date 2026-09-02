// src/routes/debtProviderRoute.ts

import { Router } from "express";

import debtProviderController from "../controllers/debtProviderController";

const router = Router();

/*
|--------------------------------------------------------------------------
| DASHBOARD CÔNG NỢ
|--------------------------------------------------------------------------
|
| GET /api/debts/dashboard
|
*/

router.get(
  "/dashboard",
  debtProviderController.dashboard.bind(
    debtProviderController
  )
);

/*
|--------------------------------------------------------------------------
| DANH SÁCH NHÀ CUNG CẤP + SỐ DƯ
|--------------------------------------------------------------------------
|
| GET /api/debts/suppliers
|
*/

router.get(
  "/suppliers",
  debtProviderController.suppliers.bind(
    debtProviderController
  )
);

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

router.get(
  "/transactions",
  debtProviderController.transactions.bind(
    debtProviderController
  )
);

/*
|--------------------------------------------------------------------------
| TỔNG QUAN CÔNG NỢ 1 NHÀ CUNG CẤP
|--------------------------------------------------------------------------
|
| GET /api/debts/suppliers/:id/summary
|
*/

router.get(
  "/suppliers/:id/summary",
  debtProviderController.supplierSummary.bind(
    debtProviderController
  )
);

/*
|--------------------------------------------------------------------------
| LỊCH SỬ CÔNG NỢ 1 NHÀ CUNG CẤP
|--------------------------------------------------------------------------
|
| GET /api/debts/suppliers/:id/history
|
*/

router.get(
  "/suppliers/:id/history",
  debtProviderController.supplierHistory.bind(
    debtProviderController
  )
);

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

router.post(
  "/",
  debtProviderController.createDebt.bind(
    debtProviderController
  )
);

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

router.post(
  "/payment",
  debtProviderController.createPayment.bind(
    debtProviderController
  )
);

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

router.post(
  "/adjustment",
  debtProviderController.createAdjustment.bind(
    debtProviderController
  )
);

export default router;