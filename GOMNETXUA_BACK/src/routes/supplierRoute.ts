import express from "express";

import {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier
} from "../controllers/suppliersController";

const router =
  express.Router();


router.get(
  "/",
  getAllSuppliers
);


router.get(
  "/:id",
  getSupplierById
);


router.post(
  "/",
  createSupplier
);


router.put(
  "/:id",
  updateSupplier
);


router.delete(
  "/:id",
  deleteSupplier
);


export default router;