"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getAllProducts = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Lấy danh sách sản phẩm
const getAllProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: {
                group: true,
                variants: true,
            },
            orderBy: {
                id: "desc",
            },
        });
        return res.status(200).json({
            success: true,
            data: products,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách sản phẩm",
        });
    }
};
exports.getAllProducts = getAllProducts;
// Tạo sản phẩm
const createProduct = async (req, res) => {
    try {
        const { group_id, product_code, product_name, description, image_url, status, } = req.body;
        if (!group_id ||
            !product_code ||
            !product_name) {
            return res.status(400).json({
                success: false,
                message: "group_id, product_code và product_name là bắt buộc",
            });
        }
        const group = await prisma.productGroup.findUnique({
            where: {
                id: Number(group_id),
            },
        });
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhóm sản phẩm",
            });
        }
        const product = await prisma.product.create({
            data: {
                group_id: Number(group_id),
                product_code,
                product_name,
                description,
                image_url,
                status: status || "active",
            },
        });
        return res.status(201).json({
            success: true,
            message: "Tạo sản phẩm thành công",
            data: product,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Không thể tạo sản phẩm",
        });
    }
};
exports.createProduct = createProduct;
// Cập nhật sản phẩm
const updateProduct = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const product = await prisma.product.update({
            where: {
                id,
            },
            data: req.body,
        });
        return res.status(200).json({
            success: true,
            message: "Cập nhật sản phẩm thành công",
            data: product,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật sản phẩm",
        });
    }
};
exports.updateProduct = updateProduct;
// Xóa sản phẩm
const deleteProduct = async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.product.delete({
            where: {
                id,
            },
        });
        return res.status(200).json({
            success: true,
            message: "Xóa sản phẩm thành công",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Không thể xóa sản phẩm",
        });
    }
};
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=productController.js.map