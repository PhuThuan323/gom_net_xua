import express from "express";

import {
  createImportReceipt,
  getAllImportReceipts,
  getImportReceiptById,
  updateImportPayment,
  deleteImportReceipt,
  getImportTemplateData,
  previewImportExcel
} from "../controllers/importReceiptController";


const router =
  express.Router();

router.get(
  "/template-data",
  getImportTemplateData
);

router.post(
  "/preview",
  previewImportExcel
);

// LẤY TẤT CẢ PHIẾU NHẬP
router.get(
  "/",
  getAllImportReceipts
);


// LẤY CHI TIẾT PHIẾU NHẬP
router.get(
  "/:id",
  getImportReceiptById
);


// TẠO PHIẾU NHẬP
router.post(
  "/",
  createImportReceipt
);


// CẬP NHẬT TIỀN ĐÃ THANH TOÁN
router.patch(
  "/:id/payment",
  updateImportPayment
);


// XÓA PHIẾU NHẬP
router.delete(
  "/:id",
  deleteImportReceipt
);


export default router;