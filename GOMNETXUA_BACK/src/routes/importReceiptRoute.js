"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const importReceiptController_1 = require("../controllers/importReceiptController");
const router = express_1.default.Router();
router.get("/template-data", importReceiptController_1.getImportTemplateData);
router.post("/preview", importReceiptController_1.previewImportExcel);
// LẤY TẤT CẢ PHIẾU NHẬP
router.get("/", importReceiptController_1.getAllImportReceipts);
// LẤY CHI TIẾT PHIẾU NHẬP
router.get("/:id", importReceiptController_1.getImportReceiptById);
// TẠO PHIẾU NHẬP
router.post("/", importReceiptController_1.createImportReceipt);
// CẬP NHẬT TIỀN ĐÃ THANH TOÁN
router.patch("/:id/payment", importReceiptController_1.updateImportPayment);
// XÓA PHIẾU NHẬP
router.delete("/:id", importReceiptController_1.deleteImportReceipt);
exports.default = router;
//# sourceMappingURL=importReceiptRoute.js.map