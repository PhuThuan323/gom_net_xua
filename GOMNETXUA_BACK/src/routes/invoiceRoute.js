"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoiceController_1 = __importDefault(require("../controllers/invoiceController"));
const router = (0, express_1.Router)();
/* =========================================================
   BOOTSTRAP
========================================================= */
router.get("/bootstrap", invoiceController_1.default.bootstrap.bind(invoiceController_1.default));
/* =========================================================
   BRANDS
========================================================= */
router.get("/brands", invoiceController_1.default.brands.bind(invoiceController_1.default));
router.put("/brands/:id", invoiceController_1.default.updateBrand.bind(invoiceController_1.default));
/* =========================================================
   CUSTOMERS
========================================================= */
router.get("/customers", invoiceController_1.default.customers.bind(invoiceController_1.default));
router.post("/customers", invoiceController_1.default.createCustomer.bind(invoiceController_1.default));
router.put("/customers/:id", invoiceController_1.default.updateCustomer.bind(invoiceController_1.default));
router.delete("/customers/:id", invoiceController_1.default.deleteCustomer.bind(invoiceController_1.default));
/* =========================================================
   INVOICE CODE
========================================================= */
router.get("/next-code", invoiceController_1.default.nextCode.bind(invoiceController_1.default));
/* =========================================================
   INVOICES
========================================================= */
router.get("/invoices", invoiceController_1.default.invoices.bind(invoiceController_1.default));
router.get("/invoices/:id", invoiceController_1.default.invoiceDetail.bind(invoiceController_1.default));
router.post("/invoices", invoiceController_1.default.createInvoice.bind(invoiceController_1.default));
exports.default = router;
//# sourceMappingURL=invoiceRoute.js.map