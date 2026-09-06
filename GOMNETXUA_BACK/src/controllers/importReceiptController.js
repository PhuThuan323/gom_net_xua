"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewImportExcel = exports.getImportTemplateData = exports.deleteImportReceipt = exports.updateImportPayment = exports.updateImportReceipt = exports.getImportReceiptById = exports.getAllImportReceipts = exports.createImportReceipt = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../lib/prisma"));
/* =========================================================
   HELPERS
========================================================= */
const toDecimal = (value) => new client_1.Prisma.Decimal(value);
const parseImportDate = (value) => {
    if (typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T12:00:00+07:00`);
    }
    if (typeof value === "string" && value.trim()) {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    }
    return new Date();
};
const serializeReceipt = (receipt) => {
    const items = Array.isArray(receipt.items)
        ? receipt.items
        : [];
    return {
        ...receipt,
        total_amount: receipt.total_amount?.toString?.() ??
            String(receipt.total_amount ?? 0),
        paid_amount: receipt.paid_amount?.toString?.() ??
            String(receipt.paid_amount ?? 0),
        debt_amount: receipt.debt_amount?.toString?.() ??
            String(receipt.debt_amount ?? 0),
        variant_count: items.length,
        total_quantity: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        items: items.map((item) => ({
            ...item,
            purchase_price: item.purchase_price?.toString?.() ??
                String(item.purchase_price ?? 0),
            total_price: item.total_price?.toString?.() ??
                String(item.total_price ?? 0),
        })),
    };
};
const validateAndPrepareItems = async (rawItems) => {
    if (!Array.isArray(rawItems) ||
        rawItems.length === 0) {
        throw new Error("Phiếu nhập phải có ít nhất một sản phẩm");
    }
    const merged = new Map();
    for (const raw of rawItems) {
        if (!raw || typeof raw !== "object") {
            throw new Error("Dữ liệu sản phẩm nhập kho không hợp lệ");
        }
        const item = raw;
        const variantId = Number(item.variant_id);
        const quantity = Number(item.quantity);
        const purchasePrice = Number(item.purchase_price);
        if (!Number.isInteger(variantId) ||
            variantId <= 0 ||
            !Number.isInteger(quantity) ||
            quantity <= 0 ||
            !Number.isFinite(purchasePrice) ||
            purchasePrice < 0) {
            throw new Error("Dữ liệu sản phẩm nhập kho không hợp lệ");
        }
        const variant = await prisma_1.default.productVariant.findUnique({
            where: {
                id: variantId,
            },
            select: {
                id: true,
            },
        });
        if (!variant) {
            throw new Error(`Không tìm thấy biến thể có ID ${variantId}`);
        }
        const old = merged.get(variantId);
        if (old) {
            old.quantity += quantity;
            /*
             * Nếu cùng SKU bị gửi trùng,
             * lấy giá nhập ở dòng cuối cùng.
             */
            old.purchase_price = purchasePrice;
        }
        else {
            merged.set(variantId, {
                quantity,
                purchase_price: purchasePrice,
            });
        }
    }
    return Array.from(merged.entries()).map(([variant_id, value,]) => ({
        variant_id,
        quantity: value.quantity,
        purchase_price: value.purchase_price,
        total_price: value.quantity *
            value.purchase_price,
    }));
};
const getCurrentSupplierBalance = async (tx, supplierId) => {
    /*
     * KHÔNG dùng dòng balance_after mới nhất.
     *
     * Công thức nguồn sự thật:
     * DEBT + ADJUSTMENT - PAYMENT.
     *
     * Cách này không sai khi sửa phiếu cũ
     * hoặc nhập giao dịch lùi ngày.
     */
    const [debt, payment, adjustment,] = await Promise.all([
        tx.supplierDebt.aggregate({
            where: {
                supplier_id: supplierId,
                transaction_type: "DEBT",
            },
            _sum: {
                amount: true,
            },
        }),
        tx.supplierDebt.aggregate({
            where: {
                supplier_id: supplierId,
                transaction_type: "PAYMENT",
            },
            _sum: {
                amount: true,
            },
        }),
        tx.supplierDebt.aggregate({
            where: {
                supplier_id: supplierId,
                transaction_type: "ADJUSTMENT",
            },
            _sum: {
                amount: true,
            },
        }),
    ]);
    const totalDebt = debt._sum.amount ??
        new client_1.Prisma.Decimal(0);
    const totalPayment = payment._sum.amount ??
        new client_1.Prisma.Decimal(0);
    const totalAdjustment = adjustment._sum.amount ??
        new client_1.Prisma.Decimal(0);
    return totalDebt
        .plus(totalAdjustment)
        .minus(totalPayment);
};
const appendSupplierDebt = async (tx, input) => {
    const amount = toDecimal(input.amount);
    if (input.transaction_type !==
        "ADJUSTMENT" &&
        amount.lessThanOrEqualTo(0)) {
        return null;
    }
    if (input.transaction_type ===
        "ADJUSTMENT" &&
        amount.equals(0)) {
        return null;
    }
    const currentBalance = await getCurrentSupplierBalance(tx, input.supplier_id);
    let change = new client_1.Prisma.Decimal(0);
    if (input.transaction_type ===
        "DEBT") {
        change =
            amount.abs();
    }
    else if (input.transaction_type ===
        "PAYMENT") {
        change =
            amount.abs().negated();
    }
    else {
        change =
            amount;
    }
    const balanceAfter = currentBalance.plus(change);
    if (balanceAfter.lessThan(0)) {
        throw new Error(`Không thể thực hiện vì công nợ nhà cung cấp sẽ bị âm. ` +
            `Công nợ hiện tại: ${currentBalance.toString()} đ`);
    }
    return tx.supplierDebt.create({
        data: {
            supplier_id: input.supplier_id,
            transaction_type: input.transaction_type,
            amount: input.transaction_type ===
                "ADJUSTMENT"
                ? amount
                : amount.abs(),
            balance_after: balanceAfter,
            reference_type: input.reference_type ??
                null,
            reference_id: input.reference_id ??
                null,
            reference_code: input.reference_code ??
                null,
            note: input.note ??
                null,
            transaction_date: input.transaction_date ??
                new Date(),
        },
    });
};
const createInventoryTransaction = async (tx, input) => {
    return tx.inventoryTransaction.create({
        data: {
            variant_id: input.variant_id,
            transaction_type: input.transaction_type,
            quantity: input.quantity,
            quantity_before: input.quantity_before,
            quantity_after: input.quantity_after,
            unit_price: input.unit_price,
            total_value: input.total_value,
            note: input.note,
            ...(input.created_at
                ? {
                    created_at: input.created_at,
                }
                : {}),
        },
    });
};
/* =========================================================
   CREATE IMPORT RECEIPT
========================================================= */
const createImportReceipt = async (req, res) => {
    try {
        const { supplier_id, paid_amount = 0, received_by = "", note = "", import_date, items, } = req.body ?? {};
        const supplierId = Number(supplier_id);
        if (!Number.isInteger(supplierId) ||
            supplierId <= 0) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Vui lòng chọn nhà cung cấp",
            });
        }
        const supplier = await prisma_1.default.supplier.findUnique({
            where: {
                id: supplierId,
            },
        });
        if (!supplier) {
            return res
                .status(404)
                .json({
                success: false,
                message: "Không tìm thấy nhà cung cấp",
            });
        }
        const processedItems = await validateAndPrepareItems(items);
        const totalAmount = processedItems.reduce((total, item) => total +
            item.total_price, 0);
        const paidAmount = Number(paid_amount || 0);
        if (!Number.isFinite(paidAmount) ||
            paidAmount < 0) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Số tiền đã trả không hợp lệ",
            });
        }
        if (paidAmount >
            totalAmount) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Số tiền đã trả không được lớn hơn tổng tiền phiếu nhập",
            });
        }
        const debtAmount = totalAmount -
            paidAmount;
        const receiptCode = `PN-${Date.now()}`;
        const importDate = parseImportDate(import_date);
        const result = await prisma_1.default.$transaction(async (tx) => {
            const receipt = await tx.importReceipt.create({
                data: {
                    receipt_code: receiptCode,
                    supplier_id: supplierId,
                    total_amount: totalAmount,
                    paid_amount: paidAmount,
                    debt_amount: debtAmount,
                    status: debtAmount === 0
                        ? "paid"
                        : "debt",
                    received_by: typeof received_by ===
                        "string" &&
                        received_by.trim()
                        ? received_by.trim()
                        : null,
                    note: typeof note ===
                        "string" &&
                        note.trim()
                        ? note.trim()
                        : null,
                    import_date: importDate,
                    items: {
                        create: processedItems,
                    },
                },
                include: {
                    supplier: true,
                    items: {
                        include: {
                            variant: {
                                include: {
                                    product: true,
                                },
                            },
                        },
                    },
                },
            });
            /*
             * Cập nhật tồn + ghi lịch sử kho.
             */
            for (const item of processedItems) {
                const before = await tx.productVariant.findUnique({
                    where: {
                        id: item.variant_id,
                    },
                    select: {
                        current_quantity: true,
                    },
                });
                if (!before) {
                    throw new Error(`Không tìm thấy biến thể ${item.variant_id}`);
                }
                const quantityBefore = Number(before.current_quantity ||
                    0);
                const quantityAfter = quantityBefore +
                    item.quantity;
                await tx.productVariant.update({
                    where: {
                        id: item.variant_id,
                    },
                    data: {
                        current_quantity: quantityAfter,
                        purchase_price: item.purchase_price,
                    },
                });
                await createInventoryTransaction(tx, {
                    variant_id: item.variant_id,
                    transaction_type: "IMPORT",
                    quantity: item.quantity,
                    quantity_before: quantityBefore,
                    quantity_after: quantityAfter,
                    unit_price: item.purchase_price,
                    total_value: item.total_price,
                    note: `IMPORT_RECEIPT:${receipt.id}:${receipt.receipt_code}`,
                    created_at: importDate,
                });
            }
            /*
             * TỰ ĐỘNG PHÁT SINH CÔNG NỢ.
             * Frontend hiện chưa gửi paid_amount,
             * nên mặc định paid_amount = 0
             * => toàn bộ tổng tiền phiếu sẽ vào công nợ.
             */
            if (debtAmount > 0) {
                await appendSupplierDebt(tx, {
                    supplier_id: supplierId,
                    transaction_type: "DEBT",
                    amount: debtAmount,
                    reference_type: "IMPORT_RECEIPT",
                    reference_id: receipt.id,
                    reference_code: receipt.receipt_code,
                    note: `Phát sinh công nợ từ phiếu nhập ${receipt.receipt_code}`,
                    transaction_date: importDate,
                });
            }
            return receipt;
        });
        return res
            .status(201)
            .json({
            success: true,
            message: debtAmount > 0
                ? "Tạo phiếu nhập kho thành công và đã cập nhật công nợ nhà cung cấp"
                : "Tạo phiếu nhập kho thành công",
            data: serializeReceipt(result),
        });
    }
    catch (error) {
        console.error("Lỗi tạo phiếu nhập:", error);
        return res
            .status(500)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Không thể tạo phiếu nhập kho",
        });
    }
};
exports.createImportReceipt = createImportReceipt;
/* =========================================================
   LIST IMPORT RECEIPTS
   BỔ SUNG:
   - variant_count
   - total_quantity
========================================================= */
const getAllImportReceipts = async (req, res) => {
    try {
        const receipts = await prisma_1.default.importReceipt.findMany({
            orderBy: [
                {
                    import_date: "desc",
                },
                {
                    id: "desc",
                },
            ],
            include: {
                supplier: true,
                items: {
                    include: {
                        variant: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
            },
        });
        return res
            .status(200)
            .json({
            success: true,
            data: receipts.map(serializeReceipt),
        });
    }
    catch (error) {
        console.error("Lỗi lấy phiếu nhập:", error);
        return res
            .status(500)
            .json({
            success: false,
            message: "Không thể lấy danh sách phiếu nhập",
        });
    }
};
exports.getAllImportReceipts = getAllImportReceipts;
/* =========================================================
   GET ONE
========================================================= */
const getImportReceiptById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) ||
            id <= 0) {
            return res
                .status(400)
                .json({
                success: false,
                message: "ID phiếu nhập không hợp lệ",
            });
        }
        const receipt = await prisma_1.default.importReceipt.findUnique({
            where: {
                id,
            },
            include: {
                supplier: true,
                items: {
                    include: {
                        variant: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
            },
        });
        if (!receipt) {
            return res
                .status(404)
                .json({
                success: false,
                message: "Không tìm thấy phiếu nhập",
            });
        }
        return res
            .status(200)
            .json({
            success: true,
            data: serializeReceipt(receipt),
        });
    }
    catch (error) {
        console.error("Lỗi lấy phiếu nhập:", error);
        return res
            .status(500)
            .json({
            success: false,
            message: "Không thể lấy chi tiết phiếu nhập",
        });
    }
};
exports.getImportReceiptById = getImportReceiptById;
/* =========================================================
   UPDATE FULL IMPORT RECEIPT

   PUT /import-receipts/:id
========================================================= */
const updateImportReceipt = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) ||
            id <= 0) {
            return res
                .status(400)
                .json({
                success: false,
                message: "ID phiếu nhập không hợp lệ",
            });
        }
        const { supplier_id, received_by = "", note = "", import_date, items, } = req.body ?? {};
        const supplierId = Number(supplier_id);
        if (!Number.isInteger(supplierId) ||
            supplierId <= 0) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Vui lòng chọn nhà cung cấp",
            });
        }
        const supplier = await prisma_1.default.supplier.findUnique({
            where: {
                id: supplierId,
            },
            select: {
                id: true,
            },
        });
        if (!supplier) {
            return res
                .status(404)
                .json({
                success: false,
                message: "Không tìm thấy nhà cung cấp",
            });
        }
        const processedItems = await validateAndPrepareItems(items);
        const totalAmount = processedItems.reduce((total, item) => total +
            item.total_price, 0);
        const oldReceipt = await prisma_1.default.importReceipt.findUnique({
            where: {
                id,
            },
            include: {
                items: true,
            },
        });
        if (!oldReceipt) {
            return res
                .status(404)
                .json({
                success: false,
                message: "Không tìm thấy phiếu nhập",
            });
        }
        const oldPaidAmount = Number(oldReceipt.paid_amount ||
            0);
        if (oldPaidAmount >
            totalAmount) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Tổng tiền mới nhỏ hơn số tiền đã thanh toán của phiếu. Hãy cập nhật thanh toán trước.",
            });
        }
        const oldDebtAmount = Number(oldReceipt.debt_amount ||
            0);
        const newDebtAmount = totalAmount -
            oldPaidAmount;
        const importDate = parseImportDate(import_date);
        const result = await prisma_1.default.$transaction(async (tx) => {
            /*
             * Tính CHÊNH LỆCH tồn theo từng variant.
             *
             * Ví dụ cũ 10, mới 15
             * => +5.
             *
             * Cũ 10, mới 4
             * => -6.
             */
            const oldMap = new Map();
            for (const item of oldReceipt.items) {
                oldMap.set(item.variant_id, Number(item.quantity ||
                    0));
            }
            const newMap = new Map();
            for (const item of processedItems) {
                newMap.set(item.variant_id, item);
            }
            const allVariantIds = new Set([
                ...oldMap.keys(),
                ...newMap.keys(),
            ]);
            for (const variantId of allVariantIds) {
                const oldQty = oldMap.get(variantId) || 0;
                const newItem = newMap.get(variantId);
                const newQty = newItem?.quantity ||
                    0;
                const delta = newQty -
                    oldQty;
                const variant = await tx.productVariant.findUnique({
                    where: {
                        id: variantId,
                    },
                    select: {
                        current_quantity: true,
                        purchase_price: true,
                    },
                });
                if (!variant) {
                    throw new Error(`Không tìm thấy biến thể ${variantId}`);
                }
                const before = Number(variant.current_quantity ||
                    0);
                const after = before +
                    delta;
                if (after < 0) {
                    throw new Error(`Không thể cập nhật phiếu vì tồn kho SKU ID ${variantId} không đủ để hoàn lại số lượng cũ.`);
                }
                const price = newItem
                    ? newItem.purchase_price
                    : Number(variant.purchase_price ||
                        0);
                if (delta !== 0) {
                    await tx.productVariant.update({
                        where: {
                            id: variantId,
                        },
                        data: {
                            current_quantity: after,
                            ...(newItem
                                ? {
                                    purchase_price: price,
                                }
                                : {}),
                        },
                    });
                    await createInventoryTransaction(tx, {
                        variant_id: variantId,
                        transaction_type: "IMPORT_EDIT",
                        /*
                         * quantity giữ trị tuyệt đối,
                         * chênh lệch thật nằm ở before/after.
                         */
                        quantity: Math.abs(delta),
                        quantity_before: before,
                        quantity_after: after,
                        unit_price: price,
                        total_value: Math.abs(delta) * price,
                        note: `Điều chỉnh phiếu nhập ${oldReceipt.receipt_code}`,
                    });
                }
                else if (newItem) {
                    /*
                     * Không đổi SL nhưng có thể đổi giá nhập.
                     */
                    await tx.productVariant.update({
                        where: {
                            id: variantId,
                        },
                        data: {
                            purchase_price: newItem.purchase_price,
                        },
                    });
                }
            }
            /*
             * Thay danh sách chi tiết phiếu.
             */
            await tx.importItem.deleteMany({
                where: {
                    import_receipt_id: id,
                },
            });
            await tx.importItem.createMany({
                data: processedItems.map((item) => ({
                    import_receipt_id: id,
                    variant_id: item.variant_id,
                    quantity: item.quantity,
                    purchase_price: item.purchase_price,
                    total_price: item.total_price,
                })),
            });
            /*
             * Điều chỉnh công nợ.
             */
            const oldSupplierId = oldReceipt.supplier_id;
            if (oldSupplierId &&
                oldSupplierId ===
                    supplierId) {
                const debtDelta = newDebtAmount -
                    oldDebtAmount;
                if (debtDelta !== 0) {
                    await appendSupplierDebt(tx, {
                        supplier_id: supplierId,
                        transaction_type: "ADJUSTMENT",
                        amount: debtDelta,
                        reference_type: "IMPORT_RECEIPT",
                        reference_id: id,
                        reference_code: oldReceipt.receipt_code,
                        note: `Điều chỉnh công nợ do sửa phiếu nhập ${oldReceipt.receipt_code}`,
                    });
                }
            }
            else {
                /*
                 * Đổi nhà cung cấp:
                 * hoàn công nợ NCC cũ,
                 * sau đó phát sinh cho NCC mới.
                 */
                if (oldSupplierId &&
                    oldDebtAmount >
                        0) {
                    await appendSupplierDebt(tx, {
                        supplier_id: oldSupplierId,
                        transaction_type: "ADJUSTMENT",
                        amount: -oldDebtAmount,
                        reference_type: "IMPORT_RECEIPT",
                        reference_id: id,
                        reference_code: oldReceipt.receipt_code,
                        note: `Hoàn công nợ do đổi nhà cung cấp của phiếu ${oldReceipt.receipt_code}`,
                    });
                }
                if (newDebtAmount >
                    0) {
                    await appendSupplierDebt(tx, {
                        supplier_id: supplierId,
                        transaction_type: "DEBT",
                        amount: newDebtAmount,
                        reference_type: "IMPORT_RECEIPT",
                        reference_id: id,
                        reference_code: oldReceipt.receipt_code,
                        note: `Phát sinh công nợ sau khi sửa phiếu nhập ${oldReceipt.receipt_code}`,
                    });
                }
            }
            const updated = await tx.importReceipt.update({
                where: {
                    id,
                },
                data: {
                    supplier_id: supplierId,
                    total_amount: totalAmount,
                    debt_amount: newDebtAmount,
                    status: newDebtAmount ===
                        0
                        ? "paid"
                        : "debt",
                    received_by: typeof received_by ===
                        "string" &&
                        received_by.trim()
                        ? received_by.trim()
                        : null,
                    note: typeof note ===
                        "string" &&
                        note.trim()
                        ? note.trim()
                        : null,
                    import_date: importDate,
                },
                include: {
                    supplier: true,
                    items: {
                        include: {
                            variant: {
                                include: {
                                    product: true,
                                },
                            },
                        },
                    },
                },
            });
            return updated;
        });
        return res
            .status(200)
            .json({
            success: true,
            message: "Cập nhật phiếu nhập kho thành công",
            data: serializeReceipt(result),
        });
    }
    catch (error) {
        console.error("Lỗi cập nhật phiếu nhập:", error);
        return res
            .status(500)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Không thể cập nhật phiếu nhập kho",
        });
    }
};
exports.updateImportReceipt = updateImportReceipt;
/* =========================================================
   UPDATE PAYMENT
   Đồng bộ luôn SupplierDebt.
========================================================= */
const updateImportPayment = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const newPaidAmount = Number(req.body?.paid_amount);
        if (!Number.isInteger(id) ||
            id <= 0) {
            return res
                .status(400)
                .json({
                success: false,
                message: "ID phiếu nhập không hợp lệ",
            });
        }
        if (!Number.isFinite(newPaidAmount) ||
            newPaidAmount < 0) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Số tiền thanh toán không hợp lệ",
            });
        }
        const receipt = await prisma_1.default.importReceipt.findUnique({
            where: {
                id,
            },
            include: {
                items: true,
                supplier: true,
            },
        });
        if (!receipt) {
            return res
                .status(404)
                .json({
                success: false,
                message: "Không tìm thấy phiếu nhập",
            });
        }
        const totalAmount = Number(receipt.total_amount ||
            0);
        if (newPaidAmount >
            totalAmount) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Số tiền thanh toán không được lớn hơn tổng tiền phiếu nhập",
            });
        }
        const oldDebtAmount = Number(receipt.debt_amount ||
            0);
        const newDebtAmount = totalAmount -
            newPaidAmount;
        const result = await prisma_1.default.$transaction(async (tx) => {
            if (receipt.supplier_id) {
                const delta = newDebtAmount -
                    oldDebtAmount;
                if (delta !== 0) {
                    await appendSupplierDebt(tx, {
                        supplier_id: receipt.supplier_id,
                        transaction_type: "ADJUSTMENT",
                        amount: delta,
                        reference_type: "IMPORT_RECEIPT",
                        reference_id: receipt.id,
                        reference_code: receipt.receipt_code,
                        note: `Điều chỉnh công nợ theo thanh toán phiếu ${receipt.receipt_code}`,
                    });
                }
            }
            return tx.importReceipt.update({
                where: {
                    id,
                },
                data: {
                    paid_amount: newPaidAmount,
                    debt_amount: newDebtAmount,
                    status: newDebtAmount ===
                        0
                        ? "paid"
                        : "debt",
                },
                include: {
                    supplier: true,
                    items: {
                        include: {
                            variant: {
                                include: {
                                    product: true,
                                },
                            },
                        },
                    },
                },
            });
        });
        return res
            .status(200)
            .json({
            success: true,
            message: "Cập nhật thanh toán và công nợ thành công",
            data: serializeReceipt(result),
        });
    }
    catch (error) {
        console.error("Lỗi cập nhật thanh toán:", error);
        return res
            .status(500)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Không thể cập nhật thanh toán",
        });
    }
};
exports.updateImportPayment = updateImportPayment;
/* =========================================================
   DELETE IMPORT RECEIPT
   - Hoàn tồn
   - Ghi transaction điều chỉnh
   - Hoàn công nợ
   - Xóa phiếu
========================================================= */
const deleteImportReceipt = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) ||
            id <= 0) {
            return res
                .status(400)
                .json({
                success: false,
                message: "ID phiếu nhập không hợp lệ",
            });
        }
        const receipt = await prisma_1.default.importReceipt.findUnique({
            where: {
                id,
            },
            include: {
                items: true,
            },
        });
        if (!receipt) {
            return res
                .status(404)
                .json({
                success: false,
                message: "Không tìm thấy phiếu nhập",
            });
        }
        await prisma_1.default.$transaction(async (tx) => {
            for (const item of receipt.items) {
                const variant = await tx.productVariant.findUnique({
                    where: {
                        id: item.variant_id,
                    },
                    select: {
                        current_quantity: true,
                        purchase_price: true,
                    },
                });
                if (!variant) {
                    throw new Error(`Không tìm thấy biến thể ${item.variant_id}`);
                }
                const before = Number(variant.current_quantity ||
                    0);
                const after = before -
                    Number(item.quantity ||
                        0);
                if (after < 0) {
                    throw new Error(`Không thể xóa phiếu ${receipt.receipt_code} vì tồn hiện tại của một sản phẩm thấp hơn số lượng đã nhập từ phiếu.`);
                }
                await tx.productVariant.update({
                    where: {
                        id: item.variant_id,
                    },
                    data: {
                        current_quantity: after,
                    },
                });
                await createInventoryTransaction(tx, {
                    variant_id: item.variant_id,
                    transaction_type: "IMPORT_DELETE",
                    quantity: Number(item.quantity ||
                        0),
                    quantity_before: before,
                    quantity_after: after,
                    unit_price: Number(item.purchase_price ||
                        0),
                    total_value: Number(item.total_price ||
                        0),
                    note: `Xóa phiếu nhập ${receipt.receipt_code}`,
                });
            }
            const debtAmount = Number(receipt.debt_amount ||
                0);
            if (receipt.supplier_id &&
                debtAmount > 0) {
                await appendSupplierDebt(tx, {
                    supplier_id: receipt.supplier_id,
                    transaction_type: "ADJUSTMENT",
                    amount: -debtAmount,
                    reference_type: "IMPORT_RECEIPT",
                    reference_id: receipt.id,
                    reference_code: receipt.receipt_code,
                    note: `Hoàn công nợ do xóa phiếu nhập ${receipt.receipt_code}`,
                });
            }
            await tx.importReceipt.delete({
                where: {
                    id,
                },
            });
        });
        return res
            .status(200)
            .json({
            success: true,
            message: "Xóa phiếu nhập thành công, đã hoàn tồn và cập nhật công nợ",
        });
    }
    catch (error) {
        console.error("Lỗi xóa phiếu nhập:", error);
        return res
            .status(500)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Không thể xóa phiếu nhập",
        });
    }
};
exports.deleteImportReceipt = deleteImportReceipt;
/* =========================================================
   IMPORT TEMPLATE
========================================================= */
const getImportTemplateData = async (req, res) => {
    try {
        const variants = await prisma_1.default.productVariant.findMany({
            where: {
                status: "active",
            },
            include: {
                product: true,
            },
            orderBy: {
                id: "asc",
            },
        });
        const data = variants.map((variant, index) => ({
            stt: index + 1,
            product_name: variant.product.product_name,
            size: variant.size ||
                "",
            sku: variant.variant_code,
            current_quantity: variant.current_quantity,
            import_quantity: "",
            purchase_price: Number(variant.purchase_price),
            note: "",
        }));
        return res
            .status(200)
            .json({
            success: true,
            data,
        });
    }
    catch (error) {
        console.error("Lỗi lấy dữ liệu mẫu nhập kho:", error);
        return res
            .status(500)
            .json({
            success: false,
            message: "Không thể lấy dữ liệu mẫu nhập kho",
        });
    }
};
exports.getImportTemplateData = getImportTemplateData;
/* =========================================================
   PREVIEW EXCEL
========================================================= */
const previewImportExcel = async (req, res) => {
    try {
        const { items = [], } = req.body ?? {};
        if (!Array.isArray(items)) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Dữ liệu sản phẩm không hợp lệ",
            });
        }
        const processedItems = [];
        for (const item of items) {
            const sku = String(item?.sku ||
                "").trim();
            const quantity = Number(item?.quantity ||
                0);
            const purchasePrice = Number(item?.purchase_price ||
                0);
            if (!sku ||
                quantity <= 0) {
                continue;
            }
            const variant = await prisma_1.default.productVariant.findUnique({
                where: {
                    variant_code: sku,
                },
                include: {
                    product: true,
                },
            });
            if (!variant) {
                processedItems.push({
                    sku,
                    valid: false,
                    message: "Không tìm thấy SKU",
                });
                continue;
            }
            processedItems.push({
                valid: true,
                variant_id: variant.id,
                product_name: variant.product.product_name,
                size: variant.size,
                sku: variant.variant_code,
                current_quantity: variant.current_quantity,
                import_quantity: quantity,
                purchase_price: purchasePrice,
                total_price: quantity *
                    purchasePrice,
                note: item?.note ||
                    "",
            });
        }
        return res
            .status(200)
            .json({
            success: true,
            data: processedItems,
        });
    }
    catch (error) {
        console.error("Lỗi preview Excel:", error);
        return res
            .status(500)
            .json({
            success: false,
            message: "Không thể đọc dữ liệu nhập kho",
        });
    }
};
exports.previewImportExcel = previewImportExcel;
//# sourceMappingURL=importReceiptController.js.map