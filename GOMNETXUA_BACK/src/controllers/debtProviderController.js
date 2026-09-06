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
        return new client_1.Prisma.Decimal(value === undefined ||
            value === null ||
            value === ""
            ? 0
            : String(value));
    }
    catch {
        return new client_1.Prisma.Decimal(0);
    }
}
function parseDate(value) {
    if (typeof value !== "string" ||
        !value.trim()) {
        return undefined;
    }
    /*
     * input type="date" gửi YYYY-MM-DD.
     * Dùng 12:00 +07:00 để tránh lệch ngày khi hiển thị ở VN.
     */
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T12:00:00+07:00`)
        : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }
    return date;
}
function parsePositiveInt(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n) ||
        n <= 0) {
        return fallback;
    }
    return Math.floor(n);
}
function errorResponse(res, error, status = 400) {
    console.error("Debt API Error:", error);
    return res
        .status(status)
        .json({
        success: false,
        message: error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi công nợ",
    });
}
/* =========================================================
   CÔNG THỨC CHUẨN

   NỢ SAU ĐIỀU CHỈNH
     = DEBT + ADJUSTMENT

   CÒN NỢ
     = DEBT + ADJUSTMENT - PAYMENT

   QUAN TRỌNG:
   Không lấy "dòng balance_after mới nhất" làm nguồn sự thật nữa.
   Vì giao dịch có thể được nhập lùi ngày / sửa phiếu cũ.
========================================================= */
async function getDebtTotals(supplierId, tx = prisma_1.default) {
    const whereSupplier = supplierId
        ? {
            supplier_id: supplierId,
        }
        : {};
    const [debt, payment, adjustment,] = await Promise.all([
        tx.supplierDebt.aggregate({
            where: {
                ...whereSupplier,
                transaction_type: "DEBT",
            },
            _sum: {
                amount: true,
            },
        }),
        tx.supplierDebt.aggregate({
            where: {
                ...whereSupplier,
                transaction_type: "PAYMENT",
            },
            _sum: {
                amount: true,
            },
        }),
        tx.supplierDebt.aggregate({
            where: {
                ...whereSupplier,
                transaction_type: "ADJUSTMENT",
            },
            _sum: {
                amount: true,
            },
        }),
    ]);
    const grossDebt = debt._sum.amount ??
        new client_1.Prisma.Decimal(0);
    const totalPayment = payment._sum.amount ??
        new client_1.Prisma.Decimal(0);
    /*
     * ADJUSTMENT được lưu có dấu:
     * + = tăng công nợ
     * - = giảm/hoàn công nợ
     */
    const totalAdjustment = adjustment._sum.amount ??
        new client_1.Prisma.Decimal(0);
    /*
     * "Tổng phát sinh nợ" trên giao diện:
     * dùng số NỢ SAU ĐIỀU CHỈNH để phép tính luôn khớp:
     *
     * Tổng phát sinh nợ - Đã trả = Còn nợ.
     */
    const totalDebt = grossDebt.plus(totalAdjustment);
    const currentBalance = totalDebt.minus(totalPayment);
    return {
        grossDebt,
        totalDebt,
        totalPayment,
        totalAdjustment,
        currentBalance,
    };
}
async function getCurrentBalance(supplierId, tx = prisma_1.default) {
    const totals = await getDebtTotals(supplierId, tx);
    return totals.currentBalance;
}
function transactionDelta(type, amount) {
    const value = new client_1.Prisma.Decimal(amount);
    if (type === "DEBT") {
        return value.abs();
    }
    if (type === "PAYMENT") {
        return value
            .abs()
            .negated();
    }
    if (type === "ADJUSTMENT") {
        return value;
    }
    return new client_1.Prisma.Decimal(0);
}
/*
 * Tính lại balance_after theo lịch sử thực tế.
 * Dùng để sửa các dòng balance_after cũ từng bị sai.
 */
function calculateRunningBalances(rows) {
    const balanceMap = new Map();
    return rows.map((row) => {
        const before = balanceMap.get(row.supplier_id) ??
            new client_1.Prisma.Decimal(0);
        const after = before.plus(transactionDelta(row.transaction_type, row.amount));
        balanceMap.set(row.supplier_id, after);
        return {
            ...row,
            calculated_balance_after: after,
        };
    });
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
        if (input.transaction_type !==
            "ADJUSTMENT" &&
            amount.lessThanOrEqualTo(0)) {
            throw new Error("Số tiền giao dịch phải lớn hơn 0");
        }
        if (input.transaction_type ===
            "ADJUSTMENT" &&
            amount.equals(0)) {
            throw new Error("Số tiền điều chỉnh phải khác 0");
        }
        /*
         * QUAN TRỌNG:
         * lấy số dư bằng tổng giao dịch,
         * KHÔNG lấy balance_after của dòng cuối.
         */
        const currentBalance = await getCurrentBalance(input.supplier_id, tx);
        const change = transactionDelta(input.transaction_type, amount);
        const balanceAfter = currentBalance.plus(change);
        if (balanceAfter.lessThan(0)) {
            throw new Error(`Số tiền trả/điều chỉnh vượt quá công nợ hiện tại (${currentBalance.toString()} đ)`);
        }
        return tx.supplierDebt.create({
            data: {
                supplier_id: input.supplier_id,
                transaction_type: input.transaction_type,
                /*
                 * DEBT/PAYMENT luôn dương.
                 * ADJUSTMENT giữ dấu +/-.
                 */
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
   REBUILD BALANCE_AFTER CHO 1 NHÀ CUNG CẤP

   Sau khi sửa / xóa giao dịch cũ:
   - chạy lại toàn bộ lịch sử theo ngày + id
   - cập nhật balance_after từng dòng
   - không cho phép số dư âm tại bất kỳ thời điểm nào
========================================================= */
async function rebuildSupplierBalances(tx, supplierId) {
    const rows = await tx.supplierDebt.findMany({
        where: {
            supplier_id: supplierId,
        },
        orderBy: [
            {
                transaction_date: "asc",
            },
            {
                id: "asc",
            },
        ],
    });
    let running = new client_1.Prisma.Decimal(0);
    for (const row of rows) {
        running =
            running.plus(transactionDelta(row.transaction_type, row.amount));
        /*
         * CHO PHÉP SỐ DƯ ÂM TẠM THỜI Ở GIỮA LỊCH SỬ.
         *
         * Ví dụ cùng ngày:
         * - Nợ 2.500.000
         * - Trả 3.000.000
         * - Sau đó phát sinh thêm nợ 6.000.000
         *
         * Nếu xóa/sửa một giao dịch cũ, số dư tại một dòng giữa kỳ
         * có thể âm tạm thời nhưng số dư cuối cùng vẫn dương.
         *
         * Trước đây hệ thống chặn ngay tại dòng âm tạm thời,
         * nên người dùng không thể sửa/xóa giao dịch hợp lệ.
         */
        if (!row.balance_after.equals(running)) {
            await tx.supplierDebt.update({
                where: {
                    id: row.id,
                },
                data: {
                    balance_after: running,
                },
            });
        }
    }
    /*
     * Chỉ chặn nếu SỐ DƯ CUỐI CÙNG bị âm.
     * Nếu throw ở đây, toàn bộ transaction sẽ rollback,
     * nên các balance_after vừa update phía trên cũng không bị lưu sai.
     */
    if (running.lessThan(0)) {
        throw new Error(`Không thể sửa/xóa giao dịch vì tổng công nợ cuối cùng sẽ âm ${running
            .abs()
            .toString()} đ.`);
    }
    return running;
}
/* =========================================================
   GIAO DỊCH ĐƯỢC PHÉP SỬA/XÓA TRỰC TIẾP?

   Giao dịch sinh tự động từ phiếu nhập:
   reference_type = IMPORT_RECEIPT

   => KHÔNG sửa/xóa ở màn Công nợ.
   => Phải sửa/xóa từ Phiếu nhập để tồn kho + công nợ đồng bộ.
========================================================= */
function isLockedImportTransaction(referenceType) {
    return (referenceType ===
        "IMPORT_RECEIPT");
}
/* =========================================================
   CONTROLLER
========================================================= */
class DebtProviderController {
    /* =======================================================
       GET /debt/dashboard
    ======================================================= */
    async dashboard(req, res) {
        try {
            const totals = await getDebtTotals();
            const [suppliers, grouped,] = await Promise.all([
                prisma_1.default.supplier.findMany({
                    where: {
                        status: "active",
                    },
                    select: {
                        id: true,
                    },
                }),
                prisma_1.default.supplierDebt.groupBy({
                    by: [
                        "supplier_id",
                        "transaction_type",
                    ],
                    _sum: {
                        amount: true,
                    },
                }),
            ]);
            const bySupplier = new Map();
            for (const row of grouped) {
                const current = bySupplier.get(row.supplier_id) ?? {
                    debt: new client_1.Prisma.Decimal(0),
                    payment: new client_1.Prisma.Decimal(0),
                    adjustment: new client_1.Prisma.Decimal(0),
                };
                const amount = row._sum.amount ??
                    new client_1.Prisma.Decimal(0);
                if (row.transaction_type ===
                    "DEBT") {
                    current.debt =
                        amount;
                }
                else if (row.transaction_type ===
                    "PAYMENT") {
                    current.payment =
                        amount;
                }
                else if (row.transaction_type ===
                    "ADJUSTMENT") {
                    current.adjustment =
                        amount;
                }
                bySupplier.set(row.supplier_id, current);
            }
            let suppliersWithDebt = 0;
            for (const supplier of suppliers) {
                const values = bySupplier.get(supplier.id);
                if (!values) {
                    continue;
                }
                const balance = values.debt
                    .plus(values.adjustment)
                    .minus(values.payment);
                if (balance.greaterThan(0)) {
                    suppliersWithDebt++;
                }
            }
            /*
             * Schema chưa có due_date.
             * Không tự suy đoán nợ quá hạn.
             */
            const overdueBalance = new client_1.Prisma.Decimal(0);
            return res.json({
                success: true,
                data: {
                    /*
                     * total_debt = nợ sau điều chỉnh.
                     * Nhờ vậy:
                     * total_debt - total_payment = total_balance
                     */
                    total_debt: totals.totalDebt.toString(),
                    gross_debt: totals.grossDebt.toString(),
                    total_payment: totals.totalPayment.toString(),
                    total_adjustment: totals.totalAdjustment.toString(),
                    total_balance: totals.currentBalance.toString(),
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
       GET /debt/suppliers
  
       Trả ĐỦ dữ liệu cho:
       - Dropdown công nợ
       - Danh mục nhà cung cấp
       - Tổng phát sinh / đã trả / còn nợ
    ======================================================= */
    async suppliers(req, res) {
        try {
            const [suppliers, grouped,] = await Promise.all([
                prisma_1.default.supplier.findMany({
                    where: {
                        status: "active",
                    },
                    select: {
                        id: true,
                        supplier_code: true,
                        supplier_name: true,
                        phone: true,
                        email: true,
                        address: true,
                        tax_code: true,
                        note: true,
                        status: true,
                    },
                    orderBy: {
                        supplier_name: "asc",
                    },
                }),
                prisma_1.default.supplierDebt.groupBy({
                    by: [
                        "supplier_id",
                        "transaction_type",
                    ],
                    _sum: {
                        amount: true,
                    },
                }),
            ]);
            const debtMap = new Map();
            for (const row of grouped) {
                const current = debtMap.get(row.supplier_id) ?? {
                    grossDebt: new client_1.Prisma.Decimal(0),
                    payment: new client_1.Prisma.Decimal(0),
                    adjustment: new client_1.Prisma.Decimal(0),
                };
                const amount = row._sum.amount ??
                    new client_1.Prisma.Decimal(0);
                if (row.transaction_type ===
                    "DEBT") {
                    current.grossDebt =
                        amount;
                }
                else if (row.transaction_type ===
                    "PAYMENT") {
                    current.payment =
                        amount;
                }
                else if (row.transaction_type ===
                    "ADJUSTMENT") {
                    current.adjustment =
                        amount;
                }
                debtMap.set(row.supplier_id, current);
            }
            const data = suppliers.map((supplier) => {
                const values = debtMap.get(supplier.id) ?? {
                    grossDebt: new client_1.Prisma.Decimal(0),
                    payment: new client_1.Prisma.Decimal(0),
                    adjustment: new client_1.Prisma.Decimal(0),
                };
                const totalDebt = values.grossDebt.plus(values.adjustment);
                const currentBalance = totalDebt.minus(values.payment);
                return {
                    ...supplier,
                    /*
                     * Tổng DEBT nguyên gốc,
                     * giữ để đối chiếu.
                     */
                    gross_debt: values.grossDebt.toString(),
                    /*
                     * Tổng phát sinh nợ SAU điều chỉnh.
                     */
                    total_debt: totalDebt.toString(),
                    total_adjustment: values.adjustment.toString(),
                    total_payment: values.payment.toString(),
                    /*
                     * Alias cho SupplierTable cũ.
                     */
                    paid_amount: values.payment.toString(),
                    current_balance: currentBalance.toString(),
                    remaining_debt: currentBalance.toString(),
                };
            });
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
       GET /debt/transactions
  
       balance_after được TÍNH LẠI,
       không tin dữ liệu balance_after cũ nữa.
    ======================================================= */
    async transactions(req, res) {
        try {
            const page = parsePositiveInt(req.query.page, 1);
            const limit = Math.min(parsePositiveInt(req.query.limit, 200), 1000);
            const supplierId = req.query.supplier_id
                ? Number(req.query.supplier_id)
                : undefined;
            const rawType = typeof req.query
                .transaction_type ===
                "string"
                ? req.query
                    .transaction_type
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
            /*
             * Để tính balance đúng tại mỗi dòng,
             * phải lấy cả giao dịch trước "from".
             * Vì vậy chỉ chặn "to" ở query DB,
             * còn "from" lọc sau khi đã tính running balance.
             */
            const where = {
                ...(supplierId &&
                    Number.isFinite(supplierId)
                    ? {
                        supplier_id: supplierId,
                    }
                    : {}),
                ...(to
                    ? {
                        transaction_date: {
                            lte: to,
                        },
                    }
                    : {}),
            };
            const allRows = await prisma_1.default.supplierDebt.findMany({
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
                orderBy: [
                    {
                        transaction_date: "asc",
                    },
                    {
                        id: "asc",
                    },
                ],
            });
            const calculated = calculateRunningBalances(allRows);
            const filtered = calculated.filter((row) => {
                if (from &&
                    row.transaction_date <
                        from) {
                    return false;
                }
                if (transactionType &&
                    row.transaction_type !==
                        transactionType) {
                    return false;
                }
                return true;
            });
            const total = filtered.length;
            const pageRows = filtered.slice((page - 1) *
                limit, page * limit);
            const data = pageRows.map((row) => ({
                id: row.id,
                supplier_id: row.supplier_id,
                supplier: row.supplier,
                transaction_type: row.transaction_type,
                amount: row.amount.toString(),
                /*
                 * Gửi balance đã tính lại.
                 */
                balance_after: row.calculated_balance_after.toString(),
                stored_balance_after: row.balance_after.toString(),
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
       POST /debt
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
            return res
                .status(201)
                .json({
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
       POST /debt/payment
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
            const noteParts = [];
            if (typeof payment_method ===
                "string" &&
                payment_method.trim()) {
                noteParts.push(`Hình thức thanh toán: ${payment_method.trim()}`);
            }
            if (typeof note ===
                "string" &&
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
            return res
                .status(201)
                .json({
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
       POST /debt/adjustment
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
            return res
                .status(201)
                .json({
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
       GET /debt/suppliers/:id/summary
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
            const totals = await getDebtTotals(supplierId);
            return res.json({
                success: true,
                data: {
                    supplier,
                    total_debt: totals.totalDebt.toString(),
                    gross_debt: totals.grossDebt.toString(),
                    total_payment: totals.totalPayment.toString(),
                    total_adjustment: totals.totalAdjustment.toString(),
                    current_balance: totals.currentBalance.toString(),
                    remaining_debt: totals.currentBalance.toString(),
                },
            });
        }
        catch (error) {
            return errorResponse(res, error, 500);
        }
    }
    /* =======================================================
       PUT /debt/transactions/:id
  
       Cho phép sửa:
       - DEBT thủ công
       - PAYMENT
       - ADJUSTMENT thủ công
  
       KHÔNG cho sửa giao dịch sinh từ IMPORT_RECEIPT.
    ======================================================= */
    async updateTransaction(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) ||
                id <= 0) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "ID giao dịch không hợp lệ",
                });
            }
            const existing = await prisma_1.default.supplierDebt.findUnique({
                where: {
                    id,
                },
                include: {
                    supplier: {
                        select: {
                            id: true,
                            supplier_code: true,
                            supplier_name: true,
                        },
                    },
                },
            });
            if (!existing) {
                return res
                    .status(404)
                    .json({
                    success: false,
                    message: "Không tìm thấy giao dịch công nợ",
                });
            }
            if (isLockedImportTransaction(existing.reference_type)) {
                return res
                    .status(409)
                    .json({
                    success: false,
                    message: "Giao dịch này được sinh tự động từ phiếu nhập. " +
                        "Vui lòng sửa phiếu nhập thay vì sửa trực tiếp công nợ.",
                });
            }
            const rawType = typeof req.body
                ?.transaction_type ===
                "string"
                ? req.body.transaction_type
                : existing.transaction_type;
            let transactionType;
            if (rawType === "DEBT" ||
                rawType === "PAYMENT" ||
                rawType === "ADJUSTMENT") {
                transactionType =
                    rawType;
            }
            else {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "Loại giao dịch không hợp lệ",
                });
            }
            const amount = decimal(req.body?.amount ??
                existing.amount);
            if (transactionType !==
                "ADJUSTMENT" &&
                amount.lessThanOrEqualTo(0)) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "Số tiền phải lớn hơn 0",
                });
            }
            if (transactionType ===
                "ADJUSTMENT" &&
                amount.equals(0)) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "Số tiền điều chỉnh phải khác 0",
                });
            }
            const transactionDate = parseDate(req.body
                ?.transaction_date) ??
                existing.transaction_date;
            const referenceCode = typeof req.body
                ?.reference_code ===
                "string"
                ? req.body.reference_code
                    .trim()
                : existing.reference_code ??
                    "";
            const note = typeof req.body
                ?.note ===
                "string"
                ? req.body.note.trim()
                : existing.note ??
                    "";
            const result = await prisma_1.default.$transaction(async (tx) => {
                await tx.supplierDebt.update({
                    where: {
                        id,
                    },
                    data: {
                        transaction_type: transactionType,
                        amount: transactionType ===
                            "ADJUSTMENT"
                            ? amount
                            : amount.abs(),
                        transaction_date: transactionDate,
                        reference_code: referenceCode
                            ? referenceCode
                            : null,
                        note: note
                            ? note
                            : null,
                        /*
                         * balance_after sẽ được rebuild ngay phía dưới.
                         */
                    },
                });
                const currentBalance = await rebuildSupplierBalances(tx, existing.supplier_id);
                const updated = await tx.supplierDebt.findUnique({
                    where: {
                        id,
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
                return {
                    updated,
                    currentBalance,
                };
            });
            if (!result.updated) {
                throw new Error("Không thể đọc lại giao dịch sau khi cập nhật");
            }
            return res.json({
                success: true,
                message: "Cập nhật giao dịch công nợ thành công",
                data: {
                    ...result.updated,
                    amount: result.updated.amount.toString(),
                    balance_after: result.updated.balance_after.toString(),
                    current_balance: result.currentBalance.toString(),
                },
            });
        }
        catch (error) {
            return errorResponse(res, error, 400);
        }
    }
    /* =======================================================
       DELETE /debt/transactions/:id
  
       KHÔNG cho xóa giao dịch sinh từ IMPORT_RECEIPT.
       Sau khi xóa sẽ rebuild toàn bộ balance_after của NCC.
    ======================================================= */
    async deleteTransaction(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) ||
                id <= 0) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "ID giao dịch không hợp lệ",
                });
            }
            const existing = await prisma_1.default.supplierDebt.findUnique({
                where: {
                    id,
                },
                include: {
                    supplier: {
                        select: {
                            id: true,
                            supplier_code: true,
                            supplier_name: true,
                        },
                    },
                },
            });
            if (!existing) {
                return res
                    .status(404)
                    .json({
                    success: false,
                    message: "Không tìm thấy giao dịch công nợ",
                });
            }
            if (isLockedImportTransaction(existing.reference_type)) {
                return res
                    .status(409)
                    .json({
                    success: false,
                    message: "Giao dịch này được sinh tự động từ phiếu nhập. " +
                        "Vui lòng xóa/sửa phiếu nhập để hệ thống hoàn tồn và công nợ đúng.",
                });
            }
            const result = await prisma_1.default.$transaction(async (tx) => {
                await tx.supplierDebt.delete({
                    where: {
                        id,
                    },
                });
                const currentBalance = await rebuildSupplierBalances(tx, existing.supplier_id);
                return {
                    currentBalance,
                };
            });
            return res.json({
                success: true,
                message: "Xóa giao dịch công nợ thành công",
                data: {
                    deleted_id: id,
                    supplier_id: existing.supplier_id,
                    current_balance: result.currentBalance.toString(),
                },
            });
        }
        catch (error) {
            return errorResponse(res, error, 400);
        }
    }
    /* =======================================================
       GET /debt/suppliers/:id/history
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
            const limit = Math.min(parsePositiveInt(req.query.limit, 200), 1000);
            const allRows = await prisma_1.default.supplierDebt.findMany({
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
            });
            const calculated = calculateRunningBalances(allRows);
            const total = calculated.length;
            const rows = calculated.slice((page - 1) *
                limit, page * limit);
            return res.json({
                success: true,
                data: rows.map((row) => ({
                    ...row,
                    amount: row.amount.toString(),
                    balance_after: row.calculated_balance_after.toString(),
                    stored_balance_after: row.balance_after.toString(),
                    calculated_balance_after: undefined,
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