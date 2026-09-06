"use strict";
// src/routes/invoiceRoutes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoiceController_1 = __importDefault(require("../controllers/invoiceController"));
const router = (0, express_1.Router)();
/* =========================================================
   BOOTSTRAP + BRAND
========================================================= */
router.get("/bootstrap", invoiceController_1.default.bootstrap.bind(invoiceController_1.default));
router.get("/brands", invoiceController_1.default.brands.bind(invoiceController_1.default));
/*
 * Nút "Lưu cài đặt" thương hiệu gọi route này.
 */
router.put("/brands/:id", invoiceController_1.default.updateBrand.bind(invoiceController_1.default));
/* =========================================================
   CUSTOMERS
========================================================= */
router.get("/customers", invoiceController_1.default.customers.bind(invoiceController_1.default));
router.post("/customers", invoiceController_1.default.createCustomer.bind(invoiceController_1.default));
router.put("/customers/:id", invoiceController_1.default.updateCustomer.bind(invoiceController_1.default));
router.delete("/customers/:id", invoiceController_1.default.deleteCustomer.bind(invoiceController_1.default));
/* =========================================================
   INVOICE / BÁO GIÁ
========================================================= */
router.get("/next-code", invoiceController_1.default.nextCode.bind(invoiceController_1.default));
router.get("/invoices", invoiceController_1.default.invoices.bind(invoiceController_1.default));
router.post("/invoices", invoiceController_1.default.createInvoice.bind(invoiceController_1.default));
/*
 * SỬA / XÓA BÁO GIÁ.
 * Backend tự chặn nếu báo giá đã xuất kho.
 */
router.put("/invoices/:id", invoiceController_1.default.updateInvoice.bind(invoiceController_1.default));
router.delete("/invoices/:id", invoiceController_1.default.deleteInvoice.bind(invoiceController_1.default));
router.get("/invoices/:id", invoiceController_1.default.invoiceDetail.bind(invoiceController_1.default));
exports.default = router;
//# sourceMappingURL=invoiceRoute.js.map