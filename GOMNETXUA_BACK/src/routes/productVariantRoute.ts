import { Router } from "express";

import {
  getAllVariants,
  createVariant,
  updateVariant,
  deleteVariant,
} from "../controllers/productVariantController";

const router = Router();

router.get("/", getAllVariants);

router.post("/", createVariant);

router.put("/:id", updateVariant);

router.delete("/:id", deleteVariant);

export default router;