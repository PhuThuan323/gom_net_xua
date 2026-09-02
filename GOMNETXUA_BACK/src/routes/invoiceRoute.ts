import { Router } from "express";

import invoiceController from "../controllers/invoiceController";

const router =
  Router();

/* =========================================================
   BOOTSTRAP
========================================================= */

router.get(
  "/bootstrap",
  invoiceController.bootstrap.bind(
    invoiceController
  )
);

/* =========================================================
   BRANDS
========================================================= */

router.get(
  "/brands",
  invoiceController.brands.bind(
    invoiceController
  )
);

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
   INVOICE CODE
========================================================= */

router.get(
  "/next-code",
  invoiceController.nextCode.bind(
    invoiceController
  )
);

/* =========================================================
   INVOICES
========================================================= */

router.get(
  "/invoices",
  invoiceController.invoices.bind(
    invoiceController
  )
);

router.get(
  "/invoices/:id",
  invoiceController.invoiceDetail.bind(
    invoiceController
  )
);

router.post(
  "/invoices",
  invoiceController.createInvoice.bind(
    invoiceController
  )
);

export default router;