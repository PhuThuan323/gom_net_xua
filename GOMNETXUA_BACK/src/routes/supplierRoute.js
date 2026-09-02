"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const suppliersController_1 = require("../controllers/suppliersController");
const router = express_1.default.Router();
router.get("/", suppliersController_1.getAllSuppliers);
router.get("/:id", suppliersController_1.getSupplierById);
router.post("/", suppliersController_1.createSupplier);
router.put("/:id", suppliersController_1.updateSupplier);
router.delete("/:id", suppliersController_1.deleteSupplier);
exports.default = router;
//# sourceMappingURL=supplierRoute.js.map