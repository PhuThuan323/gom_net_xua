import {
  Router,
} from "express";

import exportStockController from "../controllers/XuatKhoController";

const router =
  Router();

/* =========================================================
   DATA LOAD
========================================================= */

router.get(
  "/bootstrap",

  exportStockController.bootstrap.bind(
    exportStockController
  )
);

/* =========================================================
   SEARCH PRODUCT / SKU / BARCODE
========================================================= */

router.get(
  "/search",

  exportStockController.search.bind(
    exportStockController
  )
);

/* =========================================================
   BARCODE / SKU SCAN
========================================================= */

router.get(
  "/scan",

  exportStockController.scan.bind(
    exportStockController
  )
);

/* =========================================================
   SAVE EXPORT
========================================================= */

router.post(
  "/commit",

  exportStockController.commit.bind(
    exportStockController
  )
);

/* =========================================================
   HISTORY / COST REPORT
========================================================= */

router.get(
  "/history",

  exportStockController.history.bind(
    exportStockController
  )
);
router.get(
  "/invoice-quotes",
  exportStockController.invoiceQuotes.bind(
    exportStockController
  )
);

export default router;