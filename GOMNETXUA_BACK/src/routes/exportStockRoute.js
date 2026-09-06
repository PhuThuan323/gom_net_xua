"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const XuatKhoController_1 = __importDefault(require("../controllers/XuatKhoController"));
const router = (0, express_1.Router)();
/*
 * Route cố định đặt trước route động.
 */
router.get("/bootstrap", XuatKhoController_1.default.bootstrap.bind(XuatKhoController_1.default));
router.get("/invoice-quotes", XuatKhoController_1.default.invoiceQuotes.bind(XuatKhoController_1.default));
router.get("/search", XuatKhoController_1.default.search.bind(XuatKhoController_1.default));
router.get("/scan", XuatKhoController_1.default.scan.bind(XuatKhoController_1.default));
router.post("/commit", XuatKhoController_1.default.commit.bind(XuatKhoController_1.default));
router.get("/history", XuatKhoController_1.default.history.bind(XuatKhoController_1.default));
/* =========================================================
   PHIẾU XUẤT - IN / SỬA / XÓA
========================================================= */
router.get("/receipts/:exportCode", XuatKhoController_1.default.getReceipt.bind(XuatKhoController_1.default));
router.put("/receipts/:exportCode", XuatKhoController_1.default.updateReceipt.bind(XuatKhoController_1.default));
router.delete("/receipts/:exportCode", XuatKhoController_1.default.deleteReceipt.bind(XuatKhoController_1.default));
exports.default = router;
//# sourceMappingURL=exportStockRoute.js.map