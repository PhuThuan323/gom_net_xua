// src/routes/debtProviderRoutes.ts

import { Router } from "express";

import debtController from "../controllers/debtProviderController";

const router =
  Router();

/*
 * Route cố định đặt trước route có :id
 */

router.get(
  "/dashboard",
  debtController.dashboard.bind(
    debtController
  )
);

router.get(
  "/suppliers",
  debtController.suppliers.bind(
    debtController
  )
);

router.get(
  "/transactions",
  debtController.transactions.bind(
    debtController
  )
);

router.get(
  "/suppliers/:id/summary",
  debtController.supplierSummary.bind(
    debtController
  )
);

router.get(
  "/suppliers/:id/history",
  debtController.supplierHistory.bind(
    debtController
  )
);

/*
 * Tạo công nợ thủ công
 */
router.post(
  "/",
  debtController.createDebt.bind(
    debtController
  )
);

router.post(
  "/payment",
  debtController.createPayment.bind(
    debtController
  )
);

router.post(
  "/adjustment",
  debtController.createAdjustment.bind(
    debtController
  )
);

/*
 * SỬA / XÓA 1 giao dịch công nợ
 */
router.put(
  "/transactions/:id",
  debtController.updateTransaction.bind(
    debtController
  )
);

router.delete(
  "/transactions/:id",
  debtController.deleteTransaction.bind(
    debtController
  )
);

export default router;
