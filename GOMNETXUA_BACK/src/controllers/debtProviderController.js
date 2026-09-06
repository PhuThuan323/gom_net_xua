"use strict";
// src/controllers/debtProviderController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../lib/prisma"));
/* =========================================================
   HELPERS
========================================================= */
function decimal(value) {
    try {
        return new client_1.Prisma.Decimal(value === undefined || value === null || value === ""
            ? 0
            : String(value));
    }
    catch {
        return new client_1.Prisma.Decimal(0);
    }
}
function parseDate(value) {
    if (typeof value !== "string" || !value.trim()) {
        return undefined;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }
    return date;
}
function parsePositiveInt(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
        return fallback;
    }
    return Math.floor(n);
}
function errorResponse(res, error, status = 400) {
    console.error("Debt API Error:", error);
    return res.status(status).json({
        success: false,
        message: error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi công nợ",
    });
}
/* =========================================================
   LẤY SỐ DƯ HIỆN TẠI CỦA NCC
========================================================= */
async function getCurrentBalance(supplierId, tx = prisma_1.default) {
    const latest = await tx.supplierDebt.findFirst({
        where: {
            supplier_id: supplierId,
        },
        orderBy: [
            {
                transaction_date: "desc",
            },
            {
                id: "desc",
            },
        ],
        select: {
            balance_after: true,
        },
    });
    return latest?.balance_after ?? new client_1.Prisma.Decimal(0);
}
/* =========================================================
   TẠO GIAO DỊCH CÔNG NỢ
========================================================= */
async function createDebtTransaction(input) {
    return prisma_1.default.$transaction(async (tx) => {
        const supplier = await tx.supplier.findUnique({
            where: {
                id: input.supplier_id,
            },
            select: {
                id: true,
                supplier_code: true,
                supplier_name: true,
                phone: true,
            },
        });
        if (!supplier) {
            throw new Error("Nhà cung cấp không tồn tại");
        }
        const amount = new client_1.Prisma.Decimal(input.amount);
        if (input.transaction_type !== "ADJUSTMENT" &&
            amount.lessThanOrEqualTo(0)) {
            throw new Error("Số tiền giao dịch phải lớn hơn 0");
        }
        if (input.transaction_type === "ADJUSTMENT" &&
            amount.equals(0)) {
            throw new Error("Số tiền điều chỉnh phải khác 0");
        }
        const currentBalance = await getCurrentBalance(input.supplier_id, tx);
        let balanceChange;
        switch (input.transaction_type) {
            case "DEBT":
                balanceChange = amount.abs();
                break;
            case "PAYMENT":
                balanceChange = amount.abs().negated();
                break;
            case "ADJUSTMENT":
                balanceChange = amount;
                break;
            default:
                throw new Error("Loại giao dịch công nợ không hợp lệ");
        }
        const balanceAfter = currentBalance.plus(balanceChange);
        if (balanceAfter.lessThan(0)) {
            throw new Error(`Số tiền trả vượt quá công nợ hiện tại (${currentBalance.toString()} đ)`);
        }
        return tx.supplierDebt.create({
            data: {
                supplier_id: input.supplier_id,
                transaction_type: input.transaction_type,
                amount: input.transaction_type === "ADJUSTMENT"
                    ? amount
                    : amount.abs(),
                balance_after: balanceAfter,
                reference_type: input.reference_type ?? null,
                reference_id: input.reference_id ?? null,
                reference_code: input.reference_code ?? null,
                note: input.note ?? null,
                transaction_date: input.transaction_date ?? new Date(),
            },
            include: {
                supplier: {
                    select: {
                        id: true,
                        supplier_code: true,
                        supplier_name: true,
                        phone: true,
                    },
                },
            },
        });
    });
}
/* =========================================================
   CONTROLLER
========================================================= */
class DebtProviderController {
    /* =======================================================
       GET /api/debts/dashboard
       
       4 ô trên giao diện:
       - Tổng phát sinh nợ
       - Tổng đã trả
       - Tổng còn nợ
       - Nợ quá hạn
    ======================================================= */
    async dashboard(req, res) {
        try {
            const [debtAggregate, paymentAggregate, adjustmentAggregate, suppliers,] = await Promise.all([
                prisma_1.default.supplierDebt.aggregate({
                    where: {
                        transaction_type: "DEBT",
                    },
                    _sum: {
                        amount: true,
                    },
                }),
                prisma_1.default.supplierDebt.aggregate({
                    where: {
                        transaction_type: "PAYMENT",
                    },
                    _sum: {
                        amount: true,
                    },
                }),
                prisma_1.default.supplierDebt.aggregate({
                    where: {
                        transaction_type: "ADJUSTMENT",
                    },
                    _sum: {
                        amount: true,
                    },
                }),
                prisma_1.default.supplier.findMany({
                    where: {
                        status: "active",
                    },
                    include: {
                        debts: {
                            orderBy: [
                                {
                                    transaction_date: "desc",
                                },
                                {
                                    id: "desc",
                                },
                            ],
                            take: 1,
                            select: {
                                balance_after: true,
                                transaction_date: true,
                            },
                        },
                    },
                }),
            ]);
            const totalDebt = debtAggregate._sum.amount ??
                new client_1.Prisma.Decimal(0);
            const totalPayment = paymentAggregate._sum.amount ??
                new client_1.Prisma.Decimal(0);
            const totalAdjustment = adjustmentAggregate._sum.amount ??
                new client_1.Prisma.Decimal(0);
            let totalBalance = new client_1.Prisma.Decimal(0);
            let suppliersWithDebt = 0;
            for (const supplier of suppliers) {
                const balance = supplier.debts[0]?.balance_after ??
                    new client_1.Prisma.Decimal(0);
                totalBalance =
                    totalBalance.plus(balance);
                if (balance.greaterThan(0)) {
                    suppliersWithDebt++;
                }
            }
            /*
             * Schema hiện tại của bạn chưa có due_date.
             *
             * Vì vậy backend không thể xác định chính xác
             * khoản nào đã "quá hạn".
             *
             * Trả 0 để KHÔNG báo sai dữ liệu.
             *
             * Sau này nếu thêm due_date vào SupplierDebt
             * thì mình chỉ cần cập nhật phần này.
             */
            const overdueBalance = new client_1.Prisma.Decimal(0);
            return res.json({
                success: true,
                data: {
                    total_debt: totalDebt.toString(),
                    total_payment: totalPayment.toString(),
                    total_adjustment: totalAdjustment.toString(),
                    total_balance: totalBalance.toString(),
                    overdue_balance: overdueBalance.toString(),
                    supplier_count: suppliers.length,
                    suppliers_with_debt: suppliersWithDebt,
                },
            });
        }
        catch (error) {
            return errorResponse(res, error, 500);
        }
    }
    /* =======================================================
       GET /api/debts/suppliers
  
       Dùng cho:
       - Dropdown tạo nợ
       - Dropdown trả nợ
       - Dropdown lọc
       - Hiện số dư từng NCC
    ======================================================= */
    async suppliers(req, res) {
        try {
            const suppliers = await prisma_1.default.supplier.findMany({
                where: {
                    status: "active",
                },
                include: {
                    debts: {
                        orderBy: [
                            {
                                transaction_date: "desc",
                            },
                            {
                                id: "desc",
                            },
                        ],
                        take: 1,
                        select: {
                            balance_after: true,
                            transaction_date: true,
                        },
                    },
                },
                orderBy: {
                    supplier_name: "asc",
                },
            });
            const data = suppliers.map((supplier) => ({
                id: supplier.id,
                /*
                 * Frontend phải dùng supplier_code
                 * chứ không phải code.
                 *
                 * Sửa lỗi:
                 * undefined – Chị Mai
                 */
                supplier_code: supplier.supplier_code,
                supplier_name: supplier.supplier_name,
                phone: supplier.phone,
                email: supplier.email,
                address: supplier.address,
                current_balance: (supplier.debts[0]
                    ?.balance_after ??
                    new client_1.Prisma.Decimal(0)).toString(),
                last_transaction_date: supplier.debts[0]
                    ?.transaction_date ??
                    null,
            }));
            return res.json({
                success: true,
                data,
            });
        }
        catch (error) {
            return errorResponse(res, error, 500);
        }
    }
    /* =======================================================
       GET /api/debts/transactions
  
       Query:
       supplier_id
       transaction_type
       from
       to
       page
       limit
    ======================================================= */
    async transactions(req, res) {
        try {
            const page = parsePositiveInt(req.query.page, 1);
            const limit = Math.min(parsePositiveInt(req.query.limit, 50), 200);
            const supplierId = req.query.supplier_id
                ? Number(req.query.supplier_id)
                : undefined;
            const rawType = typeof req.query.transaction_type ===
                "string"
                ? req.query.transaction_type
                : undefined;
            let transactionType;
            if (rawType === "DEBT" ||
                rawType === "PAYMENT" ||
                rawType === "ADJUSTMENT") {
                transactionType =
                    rawType;
            }
            const from = parseDate(req.query.from);
            const to = parseDate(req.query.to);
            const where = {
                ...(supplierId &&
                    Number.isFinite(supplierId)
                    ? {
                        supplier_id: supplierId,
                    }
                    : {}),
                ...(transactionType
                    ? {
                        transaction_type: transactionType,
                    }
                    : {}),
                ...(from || to
                    ? {
                        transaction_date: {
                            ...(from
                                ? {
                                    gte: from,
                                }
                                : {}),
                            ...(to
                                ? {
                                    lte: to,
                                }
                                : {}),
                        },
                    }
                    : {}),
            };
            const [rows, total] = await prisma_1.default.$transaction([
                prisma_1.default.supplierDebt.findMany({
                    where,
                    include: {
                        supplier: {
                            select: {
                                id: true,
                                supplier_code: true,
                                supplier_name: true,
                                phone: true,
                            },
                        },
                    },
                    /*
                     * Giao diện hình của bạn đang hiển thị
                     * giao dịch cũ -> mới.
                     */
                    orderBy: [
                        {
                            transaction_date: "asc",
                        },
                        {
                            id: "asc",
                        },
                    ],
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma_1.default.supplierDebt.count({
                    where,
                }),
            ]);
            const data = rows.map((row) => ({
                id: row.id,
                supplier_id: row.supplier_id,
                supplier: row.supplier,
                transaction_type: row.transaction_type,
                amount: row.amount.toString(),
                balance_after: row.balance_after.toString(),
                reference_type: row.reference_type,
                reference_id: row.reference_id,
                reference_code: row.reference_code,
                note: row.note,
                transaction_date: row.transaction_date,
                created_at: row.created_at,
            }));
            return res.json({
                success: true,
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        }
        catch (error) {
            return errorResponse(res, error, 500);
        }
    }
    /* =======================================================
       POST /api/debts
  
       Tạo khoản nợ mới / nợ thêm
    ======================================================= */
    async createDebt(req, res) {
        try {
            const { supplier_id, amount, reference_code, note, transaction_date, } = req.body ?? {};
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
            const debtAmount = decimal(amount);
            if (debtAmount.lessThanOrEqualTo(0)) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "Số tiền nợ phải lớn hơn 0",
                });
            }
            const parsedDate = parseDate(transaction_date);
            const result = await createDebtTransaction({
                supplier_id: supplierId,
                transaction_type: "DEBT",
                amount: debtAmount,
                reference_type: "MANUAL",
                ...(typeof reference_code ===
                    "string" &&
                    reference_code.trim()
                    ? {
                        reference_code: reference_code.trim(),
                    }
                    : {}),
                ...(typeof note ===
                    "string" &&
                    note.trim()
                    ? {
                        note: note.trim(),
                    }
                    : {}),
                ...(parsedDate
                    ? {
                        transaction_date: parsedDate,
                    }
                    : {}),
            });
            return res.status(201).json({
                success: true,
                message: "Đã ghi nhận khoản nợ",
                data: {
                    ...result,
                    amount: result.amount.toString(),
                    balance_after: result.balance_after.toString(),
                },
            });
        }
        catch (error) {
            return errorResponse(res, error);
        }
    }
    /* =======================================================
       POST /api/debts/payment
  
       Trả công nợ
    ======================================================= */
    async createPayment(req, res) {
        try {
            const { supplier_id, amount, reference_code, payment_method, note, transaction_date, } = req.body ?? {};
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
            const paymentAmount = decimal(amount);
            if (paymentAmount.lessThanOrEqualTo(0)) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "Số tiền trả phải lớn hơn 0",
                });
            }
            const parsedDate = parseDate(transaction_date);
            /*
             * Schema hiện tại chưa có payment_method.
             *
             * Để KHÔNG phải sửa Prisma,
             * mình lưu hình thức thanh toán vào note.
             */
            const noteParts = [];
            if (typeof payment_method ===
                "string" &&
                payment_method.trim()) {
                noteParts.push(`Hình thức thanh toán: ${payment_method.trim()}`);
            }
            if (typeof note === "string" &&
                note.trim()) {
                noteParts.push(note.trim());
            }
            const finalNote = noteParts.join(" | ");
            const result = await createDebtTransaction({
                supplier_id: supplierId,
                transaction_type: "PAYMENT",
                amount: paymentAmount,
                reference_type: "PAYMENT",
                ...(typeof reference_code ===
                    "string" &&
                    reference_code.trim()
                    ? {
                        reference_code: reference_code.trim(),
                    }
                    : {}),
                ...(finalNote
                    ? {
                        note: finalNote,
                    }
                    : {}),
                ...(parsedDate
                    ? {
                        transaction_date: parsedDate,
                    }
                    : {}),
            });
            return res.status(201).json({
                success: true,
                message: "Đã ghi nhận trả công nợ",
                data: {
                    ...result,
                    amount: result.amount.toString(),
                    balance_after: result.balance_after.toString(),
                },
            });
        }
        catch (error) {
            return errorResponse(res, error);
        }
    }
    /* =======================================================
       POST /api/debts/adjustment
  
       Điều chỉnh tăng/giảm công nợ
    ======================================================= */
    async createAdjustment(req, res) {
        try {
            const { supplier_id, amount, reference_code, note, transaction_date, } = req.body ?? {};
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
            const adjustmentAmount = decimal(amount);
            if (adjustmentAmount.equals(0)) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "Số tiền điều chỉnh phải khác 0",
                });
            }
            const parsedDate = parseDate(transaction_date);
            const result = await createDebtTransaction({
                supplier_id: supplierId,
                transaction_type: "ADJUSTMENT",
                amount: adjustmentAmount,
                reference_type: "MANUAL",
                ...(typeof reference_code ===
                    "string" &&
                    reference_code.trim()
                    ? {
                        reference_code: reference_code.trim(),
                    }
                    : {}),
                ...(typeof note ===
                    "string" &&
                    note.trim()
                    ? {
                        note: note.trim(),
                    }
                    : {}),
                ...(parsedDate
                    ? {
                        transaction_date: parsedDate,
                    }
                    : {}),
            });
            return res.status(201).json({
                success: true,
                message: "Đã điều chỉnh công nợ",
                data: {
                    ...result,
                    amount: result.amount.toString(),
                    balance_after: result.balance_after.toString(),
                },
            });
        }
        catch (error) {
            return errorResponse(res, error);
        }
    }
    /* =======================================================
       GET /api/debts/suppliers/:id/summary
  
       Khi chọn NCC ở ô "Trả công nợ"
       -> lấy còn nợ hiện tại
    ======================================================= */
    async supplierSummary(req, res) {
        try {
            const supplierId = Number(req.params.id);
            if (!Number.isInteger(supplierId) ||
                supplierId <= 0) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "ID nhà cung cấp không hợp lệ",
                });
            }
            const supplier = await prisma_1.default.supplier.findUnique({
                where: {
                    id: supplierId,
                },
                select: {
                    id: true,
                    supplier_code: true,
                    supplier_name: true,
                    phone: true,
                    email: true,
                    address: true,
                },
            });
            if (!supplier) {
                return res
                    .status(404)
                    .json({
                    success: false,
                    message: "Nhà cung cấp không tồn tại",
                });
            }
            const currentBalance = await getCurrentBalance(supplierId);
            const [debt, payment, adjustment,] = await Promise.all([
                prisma_1.default.supplierDebt.aggregate({
                    where: {
                        supplier_id: supplierId,
                        transaction_type: "DEBT",
                    },
                    _sum: {
                        amount: true,
                    },
                }),
                prisma_1.default.supplierDebt.aggregate({
                    where: {
                        supplier_id: supplierId,
                        transaction_type: "PAYMENT",
                    },
                    _sum: {
                        amount: true,
                    },
                }),
                prisma_1.default.supplierDebt.aggregate({
                    where: {
                        supplier_id: supplierId,
                        transaction_type: "ADJUSTMENT",
                    },
                    _sum: {
                        amount: true,
                    },
                }),
            ]);
            return res.json({
                success: true,
                data: {
                    supplier,
                    total_debt: (debt._sum.amount ??
                        new client_1.Prisma.Decimal(0)).toString(),
                    total_payment: (payment._sum.amount ??
                        new client_1.Prisma.Decimal(0)).toString(),
                    total_adjustment: (adjustment._sum.amount ??
                        new client_1.Prisma.Decimal(0)).toString(),
                    current_balance: currentBalance.toString(),
                },
            });
        }
        catch (error) {
            return errorResponse(res, error, 500);
        }
    }
    /* =======================================================
       GET /api/debts/suppliers/:id/history
    ======================================================= */
    async supplierHistory(req, res) {
        try {
            const supplierId = Number(req.params.id);
            if (!Number.isInteger(supplierId) ||
                supplierId <= 0) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "ID nhà cung cấp không hợp lệ",
                });
            }
            const page = parsePositiveInt(req.query.page, 1);
            const limit = Math.min(parsePositiveInt(req.query.limit, 50), 200);
            const [rows, total] = await prisma_1.default.$transaction([
                prisma_1.default.supplierDebt.findMany({
                    where: {
                        supplier_id: supplierId,
                    },
                    include: {
                        supplier: {
                            select: {
                                id: true,
                                supplier_code: true,
                                supplier_name: true,
                                phone: true,
                            },
                        },
                    },
                    orderBy: [
                        {
                            transaction_date: "asc",
                        },
                        {
                            id: "asc",
                        },
                    ],
                    skip: (page - 1) *
                        limit,
                    take: limit,
                }),
                prisma_1.default.supplierDebt.count({
                    where: {
                        supplier_id: supplierId,
                    },
                }),
            ]);
            return res.json({
                success: true,
                data: rows.map((row) => ({
                    ...row,
                    amount: row.amount.toString(),
                    balance_after: row.balance_after.toString(),
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        }
        catch (error) {
            return errorResponse(res, error, 500);
        }
    }
}
exports.default = new DebtProviderController();
//# sourceMappingURL=debtProviderController.js.map