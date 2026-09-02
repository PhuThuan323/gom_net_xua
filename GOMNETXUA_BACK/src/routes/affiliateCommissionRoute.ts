import {
  Router,
} from "express";

import affiliateController
  from "../controllers/affiliateCommissionController";

import {
  requireAuth,
  requireAdmin,
} from "../middleware/authMiddleware";

const router =
  Router();

/* =========================================================
   DASHBOARD HOA HỒNG
   ADMIN + EMPLOYEE ĐỀU ĐƯỢC XEM
========================================================= */

router.get(
  "/dashboard",

  requireAuth,

  affiliateController
    .dashboard
    .bind(
      affiliateController
    )
);

/* =========================================================
   DANH SÁCH AFFILIATE
   ADMIN + EMPLOYEE ĐỀU ĐƯỢC XEM
========================================================= */

router.get(
  "/affiliates",

  requireAuth,

  affiliateController
    .affiliates
    .bind(
      affiliateController
    )
);

/* =========================================================
   THANH TOÁN
   Nếu sau này dùng trang quản trị thanh toán
   thì chỉ ADMIN xem
========================================================= */

router.get(
  "/payments",

  requireAuth,
  requireAdmin,

  affiliateController
    .payments
    .bind(
      affiliateController
    )
);

export default router;