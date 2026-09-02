"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productVariantController_1 = require("../controllers/productVariantController");
const router = (0, express_1.Router)();
router.get("/", productVariantController_1.getAllVariants);
router.post("/", productVariantController_1.createVariant);
router.put("/:id", productVariantController_1.updateVariant);
router.delete("/:id", productVariantController_1.deleteVariant);
exports.default = router;
//# sourceMappingURL=productVariantRoute.js.map