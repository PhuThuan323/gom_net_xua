"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const XuatKhoController_1 = __importDefault(require("../controllers/XuatKhoController"));
const router = (0, express_1.Router)();
/* =========================================================
   DATA LOAD
========================================================= */
router.get("/bootstrap", XuatKhoController_1.default.bootstrap.bind(XuatKhoController_1.default));
/* =========================================================
   SEARCH PRODUCT / SKU / BARCODE
========================================================= */
router.get("/search", XuatKhoController_1.default.search.bind(XuatKhoController_1.default));
/* =========================================================
   BARCODE / SKU SCAN
========================================================= */
router.get("/scan", XuatKhoController_1.default.scan.bind(XuatKhoController_1.default));
/* =========================================================
   SAVE EXPORT
========================================================= */
router.post("/commit", XuatKhoController_1.default.commit.bind(XuatKhoController_1.default));
/* =========================================================
   HISTORY / COST REPORT
========================================================= */
router.get("/history", XuatKhoController_1.default.history.bind(XuatKhoController_1.default));
router.get("/invoice-quotes", XuatKhoController_1.default.invoiceQuotes.bind(XuatKhoController_1.default));
exports.default = router;
//# sourceMappingURL=exportStockRoute.js.map