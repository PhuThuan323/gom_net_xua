"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cashFlowController_1 = __importDefault(require("../controllers/cashFlowController"));
const router = (0, express_1.Router)();
/* =========================================================
   CONFIG
========================================================= */
router.get("/bootstrap", cashFlowController_1.default.bootstrap.bind(cashFlowController_1.default));
/* =========================================================
   DASHBOARD
========================================================= */
router.get("/dashboard", cashFlowController_1.default.dashboard.bind(cashFlowController_1.default));
/* =========================================================
   FULL REPORT
========================================================= */
router.get("/report", cashFlowController_1.default.report.bind(cashFlowController_1.default));
/* =========================================================
   RECEIPT
========================================================= */
router.get("/receipts", cashFlowController_1.default.receipts.bind(cashFlowController_1.default));
router.post("/receipts", cashFlowController_1.default.createReceipt.bind(cashFlowController_1.default));
router.delete("/receipts/:id", cashFlowController_1.default.deleteReceipt.bind(cashFlowController_1.default));
/* =========================================================
   EXPENSE
========================================================= */
router.get("/expenses", cashFlowController_1.default.expenses.bind(cashFlowController_1.default));
router.post("/expenses", cashFlowController_1.default.createExpense.bind(cashFlowController_1.default));
router.delete("/expenses/:id", cashFlowController_1.default.deleteExpense.bind(cashFlowController_1.default));
exports.default = router;
//# sourceMappingURL=cashFlowRoute.js.map