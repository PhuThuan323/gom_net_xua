"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lossStockController_1 = __importDefault(require("../controllers/lossStockController"));
const router = (0, express_1.Router)();
/* =========================================================
   PRODUCTS
========================================================= */
router.get("/bootstrap", lossStockController_1.default.bootstrap.bind(lossStockController_1.default));
router.get("/search", lossStockController_1.default.search.bind(lossStockController_1.default));
/* =========================================================
   DASHBOARD
========================================================= */
router.get("/dashboard", lossStockController_1.default.dashboard.bind(lossStockController_1.default));
/* =========================================================
   HISTORY
========================================================= */
router.get("/history", lossStockController_1.default.history.bind(lossStockController_1.default));
/* =========================================================
   SAVE
========================================================= */
router.post("/commit", lossStockController_1.default.commit.bind(lossStockController_1.default));
exports.default = router;
//# sourceMappingURL=lossStockRoute.js.map