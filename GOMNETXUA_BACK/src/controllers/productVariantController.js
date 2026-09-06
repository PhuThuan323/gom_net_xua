"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVariant = exports.updateVariant = exports.createVariant = exports.getAllVariants = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Lấy tất cả biến thể
const getAllVariants = async (req, res) => {
    try {
        const variants = await prisma_1.default.productVariant.findMany({
            include: {
                product: {
                    include: {
                        group: true,
                    },
                },
            },
            orderBy: {
                id: "desc",
            },
        });
        return res.status(200).json({
            success: true,
            data: variants,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách biến thể",
        });
    }
};
exports.getAllVariants = getAllVariants;
// Tạo biến thể
const createVariant = async (req, res) => {
    try {
        const { product_id, variant_code, size, barcode, purchase_price, selling_price, current_quantity, min_stock_quantity, image_url, status, } = req.body;
        if (!product_id || !variant_code) {
            return res.status(400).json({
                success: false,
                message: "product_id và variant_code là bắt buộc",
            });
        }
        const product = await prisma_1.default.product.findUnique({
            where: {
                id: Number(product_id),
            },
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm",
            });
        }
        const variant = await prisma_1.default.productVariant.create({
            data: {
                product_id: Number(product_id),
                variant_code,
                size,
                barcode,
                purchase_price: Number(purchase_price) || 0,
                selling_price: Number(selling_price) || 0,
                current_quantity: Number(current_quantity) || 0,
                min_stock_quantity: Number(min_stock_quantity) || 0,
                image_url,
                status: status || "active",
            },
        });
        return res.status(201).json({
            success: true,
            message: "Tạo biến thể thành công",
            data: variant,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Không thể tạo biến thể",
        });
    }
};
exports.createVariant = createVariant;
// Cập nhật biến thể
const updateVariant = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const variant = await prisma_1.default.productVariant.update({
            where: {
                id,
            },
            data: {
                ...req.body,
                purchase_price: req.body.purchase_price !== undefined
                    ? Number(req.body.purchase_price)
                    : undefined,
                selling_price: req.body.selling_price !== undefined
                    ? Number(req.body.selling_price)
                    : undefined,
                current_quantity: req.body.current_quantity !== undefined
                    ? Number(req.body.current_quantity)
                    : undefined,
                min_stock_quantity: req.body.min_stock_quantity !== undefined
                    ? Number(req.body.min_stock_quantity)
                    : undefined,
            },
        });
        return res.status(200).json({
            success: true,
            message: "Cập nhật biến thể thành công",
            data: variant,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật biến thể",
        });
    }
};
exports.updateVariant = updateVariant;
// Xóa biến thể
const deleteVariant = async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma_1.default.productVariant.delete({
            where: {
                id,
            },
        });
        return res.status(200).json({
            success: true,
            message: "Xóa biến thể thành công",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Không thể xóa biến thể",
        });
    }
};
exports.deleteVariant = deleteVariant;
//# sourceMappingURL=productVariantController.js.map