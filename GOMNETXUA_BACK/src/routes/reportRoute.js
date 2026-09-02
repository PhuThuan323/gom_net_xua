"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController_1 = __importDefault(require("../controllers/reportController"));
const router = (0, express_1.Router)();
router.get("/overview", reportController_1.default.overview.bind(reportController_1.default));
router.get("/stock", reportController_1.default.stockReport.bind(reportController_1.default));
exports.default = router;
//# sourceMappingURL=reportRoute.js.map