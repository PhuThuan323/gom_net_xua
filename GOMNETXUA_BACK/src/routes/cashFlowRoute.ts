import {
  Router,
} from "express";

import cashFlowController from "../controllers/cashFlowController";

const router =
  Router();

/* =========================================================
   CONFIG
========================================================= */

router.get(
  "/bootstrap",

  cashFlowController.bootstrap.bind(
    cashFlowController
  )
);

/* =========================================================
   DASHBOARD
========================================================= */

router.get(
  "/dashboard",

  cashFlowController.dashboard.bind(
    cashFlowController
  )
);

/* =========================================================
   FULL REPORT
========================================================= */

router.get(
  "/report",

  cashFlowController.report.bind(
    cashFlowController
  )
);

/* =========================================================
   RECEIPT
========================================================= */

router.get(
  "/receipts",

  cashFlowController.receipts.bind(
    cashFlowController
  )
);

router.post(
  "/receipts",

  cashFlowController.createReceipt.bind(
    cashFlowController
  )
);

router.delete(
  "/receipts/:id",

  cashFlowController.deleteReceipt.bind(
    cashFlowController
  )
);

/* =========================================================
   EXPENSE
========================================================= */

router.get(
  "/expenses",

  cashFlowController.expenses.bind(
    cashFlowController
  )
);

router.post(
  "/expenses",

  cashFlowController.createExpense.bind(
    cashFlowController
  )
);

router.delete(
  "/expenses/:id",

  cashFlowController.deleteExpense.bind(
    cashFlowController
  )
);

export default router;