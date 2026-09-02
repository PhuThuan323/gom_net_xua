"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productGroupController_1 = require("../controllers/productGroupController");
const router = (0, express_1.Router)();
router.get("/", productGroupController_1.getAllGroups);
router.get("/:id", productGroupController_1.getGroupById);
router.post("/", productGroupController_1.createGroup);
router.put("/:id", productGroupController_1.updateGroup);
router.delete("/:id", productGroupController_1.deleteGroup);
exports.default = router;
//# sourceMappingURL=productGroupRoute.js.map