"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const importReceiptController_1 = require("../controllers/importReceiptController");
const router = (0, express_1.Router)();
/*
 * QUAN TRỌNG:
 * route cố định phải đặt TRƯỚC /:id
 */
router.get("/template", importReceiptController_1.getImportTemplateData);
router.post("/preview-excel", importReceiptController_1.previewImportExcel);
router.get("/", importReceiptController_1.getAllImportReceipts);
router.post("/", importReceiptController_1.createImportReceipt);
/*
 * Đây là route frontend đang gọi khi bấm "Cập nhật phiếu".
 * Nếu thiếu route này, Express thường trả trang HTML
 * "Cannot PUT /import-receipts/..."
 * => frontend báo Unexpected token '<'.
 */
router.put("/:id", importReceiptController_1.updateImportReceipt);
router.patch("/:id/payment", importReceiptController_1.updateImportPayment);
router.delete("/:id", importReceiptController_1.deleteImportReceipt);
router.get("/:id", importReceiptController_1.getImportReceiptById);
exports.default = router;
//# sourceMappingURL=importReceiptRoute.js.map