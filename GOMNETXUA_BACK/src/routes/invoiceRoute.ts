// src/routes/invoiceRoutes.ts

import {
  Router,
} from "express";

import invoiceController
  from "../controllers/invoiceController";

const router =
  Router();

/* =========================================================
   BOOTSTRAP + BRAND
========================================================= */

router.get(
  "/bootstrap",
  invoiceController.bootstrap.bind(
    invoiceController
  )
);

router.get(
  "/brands",
  invoiceController.brands.bind(
    invoiceController
  )
);

/*
 * Nút "Lưu cài đặt" thương hiệu gọi route này.
 */
router.put(
  "/brands/:id",
  invoiceController.updateBrand.bind(
    invoiceController
  )
);

/* =========================================================
   CUSTOMERS
========================================================= */

router.get(
  "/customers",
  invoiceController.customers.bind(
    invoiceController
  )
);

router.post(
  "/customers",
  invoiceController.createCustomer.bind(
    invoiceController
  )
);

router.put(
  "/customers/:id",
  invoiceController.updateCustomer.bind(
    invoiceController
  )
);

router.delete(
  "/customers/:id",
  invoiceController.deleteCustomer.bind(
    invoiceController
  )
);

/* =========================================================
   INVOICE / BÁO GIÁ
========================================================= */

router.get(
  "/next-code",
  invoiceController.nextCode.bind(
    invoiceController
  )
);

router.get(
  "/invoices",
  invoiceController.invoices.bind(
    invoiceController
  )
);

router.post(
  "/invoices",
  invoiceController.createInvoice.bind(
    invoiceController
  )
);

/*
 * SỬA / XÓA BÁO GIÁ.
 * Backend tự chặn nếu báo giá đã xuất kho.
 */
router.put(
  "/invoices/:id",
  invoiceController.updateInvoice.bind(
    invoiceController
  )
);

router.delete(
  "/invoices/:id",
  invoiceController.deleteInvoice.bind(
    invoiceController
  )
);

router.get(
  "/invoices/:id",
  invoiceController.invoiceDetail.bind(
    invoiceController
  )
);

export default router;
