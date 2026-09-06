"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../lib/prisma"));
/* =========================================================
   HELPERS
========================================================= */
const dec = (value) => {
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
};
const text = (value) => {
    if (typeof value !== "string") {
        return null;
    }
    const result = value.trim();
    return result || null;
};
const parseDate = (value) => {
    if (typeof value !== "string" ||
        !value) {
        return new Date();
    }
    const result = new Date(value);
    if (Number.isNaN(result.getTime())) {
        return new Date();
    }
    return result;
};
const sendError = (res, error, status = 400) => {
    console.error("INVOICE API ERROR:", error);
    return res.status(status).json({
        success: false,
        message: error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi",
    });
};
/* =========================================================
   GENERATE CUSTOMER CODE
========================================================= */
async function generateCustomerCode() {
    const last = await prisma_1.default.customer.findFirst({
        orderBy: {
            id: "desc",
        },
        select: {
            id: true,
        },
    });
    const number = (last?.id ?? 0) + 1;
    return `KH-${String(number).padStart(5, "0")}`;
}
/* =========================================================
   GENERATE INVOICE CODE
========================================================= */
async function generateInvoiceCode() {
    const year = new Date().getFullYear();
    const prefix = `HD-${year}-`;
    const last = await prisma_1.default.invoice.findFirst({
        where: {
            invoice_code: {
                startsWith: prefix,
            },
        },
        orderBy: {
            id: "desc",
        },
        select: {
            invoice_code: true,
        },
    });
    let next = 1;
    if (last) {
        const match = last.invoice_code.match(/(\d+)$/);
        if (match) {
            next =
                Number(match[1]) + 1;
        }
    }
    return `${prefix}${String(next).padStart(5, "0")}`;
}
const invoiceListInclude = {
    brand: true,
    customer: true,
    items: {
        include: {
            variant: {
                include: {
                    product: true,
                },
            },
        },
    },
};
/* =========================================================
   CONTROLLER
========================================================= */
class InvoiceController {
    /* =======================================================
       BOOTSTRAP
  
       GET /invoice/bootstrap
  
       Dùng khi load trang:
       - brands
       - customers
       - products/variants
       - next invoice code
    ======================================================= */
    async bootstrap(req, res) {
        try {
            const [brands, customers, variants, invoiceCode,] = await Promise.all([
                prisma_1.default.invoiceBrand.findMany({
                    where: {
                        status: "active",
                    },
                    orderBy: [
                        {
                            is_default: "desc",
                        },
                        {
                            id: "asc",
                        },
                    ],
                }),
                prisma_1.default.customer.findMany({
                    orderBy: {
                        customer_name: "asc",
                    },
                    take: 500,
                }),
                prisma_1.default.productVariant.findMany({
                    where: {
                        status: "active",
                        product: {
                            status: "active",
                        },
                    },
                    include: {
                        product: {
                            include: {
                                group: true,
                            },
                        },
                    },
                    orderBy: {
                        variant_code: "asc",
                    },
                }),
                generateInvoiceCode(),
            ]);
            return res.json({
                success: true,
                data: {
                    brands,
                    customers,
                    invoice_code: invoiceCode,
                    variants: variants.map((variant) => ({
                        id: variant.id,
                        variant_code: variant.variant_code,
                        barcode: variant.barcode,
                        size: variant.size,
                        selling_price: variant.selling_price.toString(),
                        purchase_price: variant.purchase_price.toString(),
                        current_quantity: variant.current_quantity,
                        product_id: variant.product_id,
                        product_code: variant.product.product_code,
                        product_name: variant.product.product_name,
                        group_name: variant.product.group.group_name,
                        display_name: [
                            variant.product.product_name,
                            variant.size,
                        ]
                            .filter(Boolean)
                            .join(" - "),
                    })),
                },
            });
        }
        catch (error) {
            return sendError(res, error, 500);
        }
    }
    /* =======================================================
       GET BRANDS
    ======================================================= */
    async brands(req, res) {
        try {
            const data = await prisma_1.default.invoiceBrand.findMany({
                where: {
                    status: "active",
                },
                orderBy: [
                    {
                        is_default: "desc",
                    },
                    {
                        id: "asc",
                    },
                ],
            });
            return res.json({
                success: true,
                data,
            });
        }
        catch (error) {
            return sendError(res, error, 500);
        }
    }
    /* =======================================================
       UPDATE BRAND
  
       PUT /invoice/brands/:id
    ======================================================= */
    async updateBrand(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) ||
                id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "ID thương hiệu không hợp lệ",
                });
            }
            const { brand_name, tax_code, phone, address, email, bank_name, bank_account, bank_holder, logo_text, is_default, } = req.body ?? {};
            if (typeof brand_name !==
                "string" ||
                !brand_name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Tên thương hiệu không được để trống",
                });
            }
            const result = await prisma_1.default.$transaction(async (tx) => {
                if (is_default === true) {
                    await tx.invoiceBrand.updateMany({
                        data: {
                            is_default: false,
                        },
                    });
                }
                return tx.invoiceBrand.update({
                    where: {
                        id,
                    },
                    data: {
                        brand_name: brand_name.trim(),
                        tax_code: text(tax_code),
                        phone: text(phone),
                        address: text(address),
                        email: text(email),
                        bank_name: text(bank_name),
                        bank_account: text(bank_account),
                        bank_holder: text(bank_holder),
                        logo_text: text(logo_text),
                        ...(typeof is_default ===
                            "boolean"
                            ? {
                                is_default,
                            }
                            : {}),
                    },
                });
            });
            return res.json({
                success: true,
                message: "Đã lưu cài đặt thương hiệu",
                data: result,
            });
        }
        catch (error) {
            return sendError(res, error);
        }
    }
    /* =======================================================
       CUSTOMERS
  
       GET /invoice/customers?search=
    ======================================================= */
    async customers(req, res) {
        try {
            const search = typeof req.query.search === "string"
                ? req.query.search.trim()
                : "";
            const where = search
                ? {
                    OR: [
                        { customer_name: { contains: search } },
                        { phone: { contains: search } },
                        { email: { contains: search } },
                        { tax_code: { contains: search } },
                        { customer_code: { contains: search } },
                    ],
                }
                : {};
            const data = await prisma_1.default.customer.findMany({
                where,
                orderBy: { customer_name: "asc" },
                take: 500,
            });
            return res.json({
                success: true,
                data,
            });
        }
        catch (error) {
            return sendError(res, error, 500);
        }
    }
    /* =======================================================
       CREATE CUSTOMER
  
       POST /invoice/customers
    ======================================================= */
    async createCustomer(req, res) {
        try {
            const { customer_name, phone, email, address, shipping_address, tax_code, note, } = req.body ?? {};
            if (typeof customer_name !==
                "string" ||
                !customer_name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng nhập tên khách hàng",
                });
            }
            const customerCode = await generateCustomerCode();
            const result = await prisma_1.default.customer.create({
                data: {
                    customer_code: customerCode,
                    customer_name: customer_name.trim(),
                    phone: text(phone),
                    email: text(email),
                    address: text(address),
                    shipping_address: text(shipping_address),
                    tax_code: text(tax_code),
                    note: text(note),
                },
            });
            return res
                .status(201)
                .json({
                success: true,
                message: "Đã thêm khách hàng",
                data: result,
            });
        }
        catch (error) {
            return sendError(res, error);
        }
    }
    /* =======================================================
       UPDATE CUSTOMER
    ======================================================= */
    async updateCustomer(req, res) {
        try {
            const id = Number(req.params.id);
            const { customer_name, phone, email, address, shipping_address, tax_code, note, } = req.body ?? {};
            if (!Number.isInteger(id) ||
                id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "ID khách hàng không hợp lệ",
                });
            }
            if (typeof customer_name !==
                "string" ||
                !customer_name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Tên khách hàng không được để trống",
                });
            }
            const result = await prisma_1.default.customer.update({
                where: {
                    id,
                },
                data: {
                    customer_name: customer_name.trim(),
                    phone: text(phone),
                    email: text(email),
                    address: text(address),
                    shipping_address: text(shipping_address),
                    tax_code: text(tax_code),
                    note: text(note),
                },
            });
            return res.json({
                success: true,
                message: "Đã cập nhật khách hàng",
                data: result,
            });
        }
        catch (error) {
            return sendError(res, error);
        }
    }
    /* =======================================================
       DELETE CUSTOMER
    ======================================================= */
    async deleteCustomer(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) ||
                id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "ID khách hàng không hợp lệ",
                });
            }
            const invoiceCount = await prisma_1.default.invoice.count({
                where: {
                    customer_id: id,
                },
            });
            if (invoiceCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Khách hàng đã có hóa đơn nên không thể xóa. Bạn có thể chỉnh sửa thông tin khách hàng.",
                });
            }
            await prisma_1.default.customer.delete({
                where: {
                    id,
                },
            });
            return res.json({
                success: true,
                message: "Đã xóa khách hàng",
            });
        }
        catch (error) {
            return sendError(res, error);
        }
    }
    /* =======================================================
       NEXT CODE
    ======================================================= */
    async nextCode(req, res) {
        try {
            const invoiceCode = await generateInvoiceCode();
            return res.json({
                success: true,
                data: {
                    invoice_code: invoiceCode,
                },
            });
        }
        catch (error) {
            return sendError(res, error, 500);
        }
    }
    /* =======================================================
       LIST INVOICES
  
       GET /invoice/invoices?search=
    ======================================================= */
    async invoices(req, res) {
        try {
            const search = typeof req.query.search === "string"
                ? req.query.search.trim()
                : "";
            const where = search
                ? {
                    OR: [
                        { invoice_code: { contains: search } },
                        { order_code: { contains: search } },
                        {
                            customer: {
                                is: {
                                    customer_name: { contains: search },
                                },
                            },
                        },
                        {
                            customer: {
                                is: {
                                    phone: { contains: search },
                                },
                            },
                        },
                    ],
                }
                : {};
            const data = await prisma_1.default.invoice.findMany({
                where,
                include: invoiceListInclude,
                orderBy: [
                    { invoice_date: "desc" },
                    { id: "desc" },
                ],
                take: 300,
            });
            const typedData = data;
            return res.json({
                success: true,
                data: typedData.map((invoice) => ({
                    ...invoice,
                    subtotal: invoice.subtotal.toString(),
                    shipping_fee: invoice.shipping_fee.toString(),
                    total_amount: invoice.total_amount.toString(),
                    paid_amount: invoice.paid_amount.toString(),
                    deposit_amount: invoice.deposit_amount.toString(),
                    items: invoice.items.map((item) => ({
                        ...item,
                        unit_price: item.unit_price.toString(),
                        total_price: item.total_price.toString(),
                    })),
                })),
            });
        }
        catch (error) {
            return sendError(res, error, 500);
        }
    }
    /* =======================================================
       GET ONE INVOICE
    ======================================================= */
    async invoiceDetail(req, res) {
        try {
            const id = Number(req.params.id);
            const invoice = await prisma_1.default.invoice.findUnique({
                where: {
                    id,
                },
                include: {
                    brand: true,
                    customer: true,
                    items: {
                        include: {
                            variant: {
                                include: {
                                    product: {
                                        include: {
                                            group: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy hóa đơn",
                });
            }
            return res.json({
                success: true,
                data: {
                    ...invoice,
                    subtotal: invoice.subtotal.toString(),
                    shipping_fee: invoice.shipping_fee.toString(),
                    total_amount: invoice.total_amount.toString(),
                    paid_amount: invoice.paid_amount.toString(),
                    deposit_amount: invoice.deposit_amount.toString(),
                    items: invoice.items.map((item) => ({
                        ...item,
                        unit_price: item.unit_price.toString(),
                        total_price: item.total_price.toString(),
                    })),
                },
            });
        }
        catch (error) {
            return sendError(res, error, 500);
        }
    }
    /* =======================================================
       CREATE INVOICE
  
       POST /invoice/invoices
  
       QUAN TRỌNG:
       - chỉ lưu hóa đơn
       - KHÔNG TRỪ KHO
    ======================================================= */
    async createInvoice(req, res) {
        try {
            const { invoice_code, invoice_date, brand_id, customer_id, channel, order_code, payment_method, deposit_amount, shipping_fee, shipping_address, note, items, } = req.body ?? {};
            const brandId = Number(brand_id);
            if (!Number.isInteger(brandId) ||
                brandId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng chọn thương hiệu phát hành hóa đơn",
                });
            }
            if (!Array.isArray(items) ||
                items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Hóa đơn phải có ít nhất 1 sản phẩm",
                });
            }
            const normalizedItems = [];
            for (const item of items) {
                const variantId = Number(item.variant_id);
                const quantity = Number(item.quantity);
                const unitPrice = dec(item.unit_price);
                if (!Number.isInteger(variantId) ||
                    variantId <= 0) {
                    throw new Error("Có sản phẩm chưa được chọn");
                }
                if (!Number.isFinite(quantity) ||
                    quantity <= 0) {
                    throw new Error("Số lượng sản phẩm phải lớn hơn 0");
                }
                if (unitPrice.lessThan(0)) {
                    throw new Error("Đơn giá không hợp lệ");
                }
                const variant = await prisma_1.default.productVariant.findUnique({
                    where: {
                        id: variantId,
                    },
                    select: {
                        current_quantity: true,
                        status: true,
                    },
                });
                if (!variant ||
                    variant.status !==
                        "active") {
                    throw new Error("Sản phẩm không tồn tại hoặc đã ngừng bán");
                }
                /*
                 * Chỉ kiểm tra tồn.
                 * KHÔNG trừ kho.
                 */
                if (quantity >
                    variant.current_quantity) {
                    throw new Error(`Số lượng bán (${quantity}) vượt tồn hiện tại (${variant.current_quantity})`);
                }
                normalizedItems.push({
                    variant_id: variantId,
                    quantity,
                    unit_price: unitPrice,
                    total_price: unitPrice.mul(quantity),
                });
            }
            const subtotal = normalizedItems.reduce((sum, item) => sum.plus(item.total_price), new client_1.Prisma.Decimal(0));
            const shipping = dec(shipping_fee);
            const deposit = dec(deposit_amount);
            const totalAmount = subtotal.plus(shipping);
            if (deposit.lessThan(0)) {
                throw new Error("Tiền cọc không hợp lệ");
            }
            if (deposit.greaterThan(totalAmount)) {
                throw new Error("Tiền cọc không được lớn hơn tổng thanh toán");
            }
            const finalCode = typeof invoice_code ===
                "string" &&
                invoice_code.trim()
                ? invoice_code.trim()
                : await generateInvoiceCode();
            const result = await prisma_1.default.invoice.create({
                data: {
                    invoice_code: finalCode,
                    invoice_date: parseDate(invoice_date),
                    brand_id: brandId,
                    customer_id: customer_id
                        ? Number(customer_id)
                        : null,
                    channel: text(channel),
                    order_code: text(order_code),
                    subtotal,
                    shipping_fee: shipping,
                    total_amount: totalAmount,
                    deposit_amount: deposit,
                    paid_amount: deposit,
                    payment_method: text(payment_method),
                    shipping_address: text(shipping_address),
                    warehouse_status: "not_processed",
                    status: "completed",
                    note: text(note),
                    items: {
                        create: normalizedItems,
                    },
                },
                include: {
                    brand: true,
                    customer: true,
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
                .status(201)
                .json({
                success: true,
                message: "Đã lưu hóa đơn",
                data: {
                    ...result,
                    subtotal: result.subtotal.toString(),
                    shipping_fee: result.shipping_fee.toString(),
                    total_amount: result.total_amount.toString(),
                    deposit_amount: result.deposit_amount.toString(),
                    paid_amount: result.paid_amount.toString(),
                },
            });
        }
        catch (error) {
            return sendError(res, error);
        }
    }
    /* =======================================================
       UPDATE INVOICE / BÁO GIÁ
  
       PUT /invoice/invoices/:id
  
       QUAN TRỌNG:
       - CHỈ sửa khi warehouse_status = "not_processed"
       - Nếu đã xuất kho ("processed") thì khóa sửa
       - KHÔNG trừ kho tại đây
       - Giữ nguyên logic xuất kho từ báo giá
    ======================================================= */
    async updateInvoice(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) ||
                id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "ID báo giá/hóa đơn không hợp lệ",
                });
            }
            const existing = await prisma_1.default.invoice.findUnique({
                where: {
                    id,
                },
                include: {
                    items: true,
                },
            });
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy báo giá/hóa đơn",
                });
            }
            /*
             * BẢO VỆ LOGIC XUẤT KHO:
             * exportStockController dùng warehouse_status
             * not_processed -> processed.
             *
             * Khi đã processed thì không cho sửa nội dung báo giá,
             * tránh dữ liệu báo giá khác với dữ liệu đã trừ kho.
             */
            if (existing.warehouse_status ===
                "processed") {
                return res.status(409).json({
                    success: false,
                    message: "Báo giá này đã được xuất kho nên không thể sửa. " +
                        "Dữ liệu xuất kho đã được chốt.",
                });
            }
            const { invoice_code, invoice_date, brand_id, customer_id, channel, order_code, payment_method, deposit_amount, shipping_fee, shipping_address, note, items, } = req.body ?? {};
            const brandId = Number(brand_id);
            if (!Number.isInteger(brandId) ||
                brandId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng chọn thương hiệu phát hành hóa đơn",
                });
            }
            if (!Array.isArray(items) ||
                items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Báo giá phải có ít nhất 1 sản phẩm",
                });
            }
            const normalizedItems = [];
            for (const item of items) {
                const variantId = Number(item.variant_id);
                const quantity = Number(item.quantity);
                const unitPrice = dec(item.unit_price);
                if (!Number.isInteger(variantId) ||
                    variantId <= 0) {
                    throw new Error("Có sản phẩm chưa được chọn");
                }
                if (!Number.isFinite(quantity) ||
                    quantity <= 0) {
                    throw new Error("Số lượng sản phẩm phải lớn hơn 0");
                }
                if (unitPrice.lessThan(0)) {
                    throw new Error("Đơn giá không hợp lệ");
                }
                const variant = await prisma_1.default.productVariant.findUnique({
                    where: {
                        id: variantId,
                    },
                    select: {
                        current_quantity: true,
                        status: true,
                    },
                });
                if (!variant ||
                    variant.status !==
                        "active") {
                    throw new Error("Sản phẩm không tồn tại hoặc đã ngừng bán");
                }
                /*
                 * Báo giá chỉ KIỂM TRA tồn hiện tại.
                 * KHÔNG trừ kho.
                 */
                if (quantity >
                    variant.current_quantity) {
                    throw new Error(`Số lượng bán (${quantity}) vượt tồn hiện tại (${variant.current_quantity})`);
                }
                normalizedItems.push({
                    variant_id: variantId,
                    quantity,
                    unit_price: unitPrice,
                    total_price: unitPrice.mul(quantity),
                });
            }
            const subtotal = normalizedItems.reduce((sum, item) => sum.plus(item.total_price), new client_1.Prisma.Decimal(0));
            const shipping = dec(shipping_fee);
            const deposit = dec(deposit_amount);
            const totalAmount = subtotal.plus(shipping);
            if (deposit.lessThan(0)) {
                throw new Error("Tiền cọc không hợp lệ");
            }
            if (deposit.greaterThan(totalAmount)) {
                throw new Error("Tiền cọc không được lớn hơn tổng thanh toán");
            }
            const finalCode = typeof invoice_code ===
                "string" &&
                invoice_code.trim()
                ? invoice_code.trim()
                : existing.invoice_code;
            const result = await prisma_1.default.$transaction(async (tx) => {
                /*
                 * InvoiceItem có relation cascade khi xóa invoice,
                 * nhưng khi UPDATE ta chủ động xóa dòng cũ rồi tạo lại.
                 */
                await tx.invoiceItem.deleteMany({
                    where: {
                        invoice_id: id,
                    },
                });
                return tx.invoice.update({
                    where: {
                        id,
                    },
                    data: {
                        invoice_code: finalCode,
                        invoice_date: parseDate(invoice_date),
                        brand_id: brandId,
                        customer_id: customer_id
                            ? Number(customer_id)
                            : null,
                        channel: text(channel),
                        order_code: text(order_code),
                        subtotal,
                        shipping_fee: shipping,
                        total_amount: totalAmount,
                        deposit_amount: deposit,
                        /*
                         * Giữ cách tính hiện tại của hệ thống:
                         * paid_amount = tiền cọc.
                         */
                        paid_amount: deposit,
                        payment_method: text(payment_method),
                        shipping_address: text(shipping_address),
                        note: text(note),
                        /*
                         * KHÔNG đụng warehouse_status.
                         * Nếu đang not_processed thì vẫn giữ nguyên để
                         * module Xuất kho tiếp tục nhận báo giá này.
                         */
                        items: {
                            create: normalizedItems,
                        },
                    },
                    include: {
                        brand: true,
                        customer: true,
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
            return res.json({
                success: true,
                message: "Đã cập nhật báo giá/hóa đơn",
                data: {
                    ...result,
                    subtotal: result.subtotal.toString(),
                    shipping_fee: result.shipping_fee.toString(),
                    total_amount: result.total_amount.toString(),
                    deposit_amount: result.deposit_amount.toString(),
                    paid_amount: result.paid_amount.toString(),
                    items: result.items.map((item) => ({
                        ...item,
                        unit_price: item.unit_price.toString(),
                        total_price: item.total_price.toString(),
                    })),
                },
            });
        }
        catch (error) {
            return sendError(res, error);
        }
    }
    /* =======================================================
       DELETE INVOICE / BÁO GIÁ
  
       DELETE /invoice/invoices/:id
  
       QUAN TRỌNG:
       - Chỉ xóa khi CHƯA xuất kho
       - Nếu warehouse_status = processed thì chặn
       - Không tác động dữ liệu InventoryTransaction
    ======================================================= */
    async deleteInvoice(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) ||
                id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "ID báo giá/hóa đơn không hợp lệ",
                });
            }
            const invoice = await prisma_1.default.invoice.findUnique({
                where: {
                    id,
                },
                select: {
                    id: true,
                    invoice_code: true,
                    warehouse_status: true,
                },
            });
            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy báo giá/hóa đơn",
                });
            }
            if (invoice.warehouse_status ===
                "processed") {
                return res.status(409).json({
                    success: false,
                    message: "Báo giá này đã được xuất kho nên không thể xóa. " +
                        "Cần giữ lại để đối chiếu lịch sử xuất kho.",
                });
            }
            await prisma_1.default.invoice.delete({
                where: {
                    id,
                },
            });
            return res.json({
                success: true,
                message: `Đã xóa báo giá ${invoice.invoice_code}`,
            });
        }
        catch (error) {
            return sendError(res, error);
        }
    }
}
exports.default = new InvoiceController();
//# sourceMappingURL=invoiceController.js.map