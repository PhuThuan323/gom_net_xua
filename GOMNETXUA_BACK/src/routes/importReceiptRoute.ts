import { Router } from "express";

import {
  createImportReceipt,
  getAllImportReceipts,
  getImportReceiptById,
  updateImportReceipt,
  updateImportPayment,
  deleteImportReceipt,
  getImportTemplateData,
  previewImportExcel,
} from "../controllers/importReceiptController";

const router = Router();

/*
 * QUAN TRỌNG:
 * route cố định phải đặt TRƯỚC /:id
 */
router.get(
  "/template",
  getImportTemplateData
);

router.post(
  "/preview-excel",
  previewImportExcel
);

router.get(
  "/",
  getAllImportReceipts
);

router.post(
  "/",
  createImportReceipt
);

/*
 * Đây là route frontend đang gọi khi bấm "Cập nhật phiếu".
 * Nếu thiếu route này, Express thường trả trang HTML
 * "Cannot PUT /import-receipts/..."
 * => frontend báo Unexpected token '<'.
 */
router.put(
  "/:id",
  updateImportReceipt
);

router.patch(
  "/:id/payment",
  updateImportPayment
);

router.delete(
  "/:id",
  deleteImportReceipt
);

router.get(
  "/:id",
  getImportReceiptById
);

export default router;
