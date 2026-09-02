import {
  Router,
} from "express";

import reportController from "../controllers/reportController";

const router =
  Router();

router.get(
  "/overview",
  reportController.overview.bind(
    reportController
  )
);

router.get(
  "/stock",
  reportController.stockReport.bind(
    reportController
  )
);

export default router;