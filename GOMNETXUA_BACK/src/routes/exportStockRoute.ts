import {
  Router,
} from "express";

import exportStockController
  from "../controllers/XuatKhoController";

const router =
  Router();

/*
 * Route cố định đặt trước route động.
 */

router.get(
  "/bootstrap",
  exportStockController.bootstrap.bind(
    exportStockController
  )
);

router.get(
  "/invoice-quotes",
  exportStockController.invoiceQuotes.bind(
    exportStockController
  )
);

router.get(
  "/search",
  exportStockController.search.bind(
    exportStockController
  )
);

router.get(
  "/scan",
  exportStockController.scan.bind(
    exportStockController
  )
);

router.post(
  "/commit",
  exportStockController.commit.bind(
    exportStockController
  )
);

router.get(
  "/history",
  exportStockController.history.bind(
    exportStockController
  )
);

/* =========================================================
   PHIẾU XUẤT - IN / SỬA / XÓA
========================================================= */

router.get(
  "/receipts/:exportCode",
  exportStockController.getReceipt.bind(
    exportStockController
  )
);

router.put(
  "/receipts/:exportCode",
  exportStockController.updateReceipt.bind(
    exportStockController
  )
);

router.delete(
  "/receipts/:exportCode",
  exportStockController.deleteReceipt.bind(
    exportStockController
  )
);

export default router;
