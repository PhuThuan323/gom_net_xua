import {
  Router,
} from "express";

import lossStockController from "../controllers/lossStockController";

const router =
  Router();

/* =========================================================
   PRODUCTS
========================================================= */

router.get(
  "/bootstrap",

  lossStockController.bootstrap.bind(
    lossStockController
  )
);

router.get(
  "/search",

  lossStockController.search.bind(
    lossStockController
  )
);

/* =========================================================
   DASHBOARD
========================================================= */

router.get(
  "/dashboard",

  lossStockController.dashboard.bind(
    lossStockController
  )
);

/* =========================================================
   HISTORY
========================================================= */

router.get(
  "/history",

  lossStockController.history.bind(
    lossStockController
  )
);

/* =========================================================
   SAVE
========================================================= */

router.post(
  "/commit",

  lossStockController.commit.bind(
    lossStockController
  )
);

export default router;