"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupplier = exports.updateSupplier = exports.getSupplierById = exports.getAllSuppliers = exports.createSupplier = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// =====================================================
// TẠO MÃ NHÀ CUNG CẤP
// =====================================================
const generateSupplierCode = (name) => {
    return name
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "-");
};
// =====================================================
// TẠO NHÀ CUNG CẤP
// =====================================================
const createSupplier = async (req, res) => {
    try {
        const { supplier_name, name, address, phone, email, note, status } = req.body;
        // Hỗ trợ cả name và supplier_name
        const finalName = supplier_name || name;
        // Kiểm tra tên
        if (!finalName ||
            !finalName.trim()) {
            return res.status(400).json({
                success: false,
                message: "Tên nhà cung cấp không được để trống"
            });
        }
        const supplierCode = generateSupplierCode(finalName);
        // Kiểm tra mã đã tồn tại
        const existingSupplier = await prisma.supplier.findUnique({
            where: {
                supplier_code: supplierCode
            }
        });
        if (existingSupplier) {
            return res.status(409).json({
                success: false,
                message: "Nhà cung cấp đã tồn tại"
            });
        }
        // Tạo nhà cung cấp
        const newSupplier = await prisma.supplier.create({
            data: {
                supplier_code: supplierCode,
                supplier_name: finalName.trim(),
                address: address?.trim() || null,
                phone: phone?.trim() || null,
                email: email?.trim() || null,
                note: note?.trim() || null,
                status: status || "active"
            }
        });
        return res.status(201).json({
            success: true,
            message: "Tạo nhà cung cấp thành công",
            data: newSupplier
        });
    }
    catch (error) {
        console.error("Lỗi tạo nhà cung cấp:", error);
        // Lỗi trùng unique
        if (error instanceof
            client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                return res.status(409).json({
                    success: false,
                    message: "Mã nhà cung cấp đã tồn tại"
                });
            }
        }
        return res.status(500).json({
            success: false,
            message: "Không thể tạo nhà cung cấp"
        });
    }
};
exports.createSupplier = createSupplier;
// =====================================================
// LẤY TẤT CẢ NHÀ CUNG CẤP
// =====================================================
const getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: {
                id: "desc"
            }
        });
        return res.status(200).json({
            success: true,
            data: suppliers
        });
    }
    catch (error) {
        console.error("Lỗi lấy danh sách nhà cung cấp:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách nhà cung cấp"
        });
    }
};
exports.getAllSuppliers = getAllSuppliers;
// =====================================================
// LẤY 1 NHÀ CUNG CẤP THEO ID
// =====================================================
const getSupplierById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id ||
            isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "ID nhà cung cấp không hợp lệ"
            });
        }
        const supplier = await prisma.supplier.findUnique({
            where: {
                id
            }
        });
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhà cung cấp"
            });
        }
        return res.status(200).json({
            success: true,
            data: supplier
        });
    }
    catch (error) {
        console.error("Lỗi lấy nhà cung cấp:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể lấy thông tin nhà cung cấp"
        });
    }
};
exports.getSupplierById = getSupplierById;
// =====================================================
// CẬP NHẬT NHÀ CUNG CẤP
// =====================================================
const updateSupplier = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { supplier_name, name, address, phone, email, note, status } = req.body;
        const finalName = supplier_name || name;
        // Kiểm tra ID
        if (!id ||
            isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "ID nhà cung cấp không hợp lệ"
            });
        }
        // Kiểm tra tên
        if (!finalName ||
            !finalName.trim()) {
            return res.status(400).json({
                success: false,
                message: "Tên nhà cung cấp không được để trống"
            });
        }
        // Kiểm tra nhà cung cấp có tồn tại không
        const existingSupplier = await prisma.supplier.findUnique({
            where: {
                id
            }
        });
        if (!existingSupplier) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhà cung cấp"
            });
        }
        const supplierCode = generateSupplierCode(finalName);
        // Kiểm tra code mới có bị trùng không
        const duplicateSupplier = await prisma.supplier.findFirst({
            where: {
                supplier_code: supplierCode,
                NOT: {
                    id
                }
            }
        });
        if (duplicateSupplier) {
            return res.status(409).json({
                success: false,
                message: "Tên nhà cung cấp đã tồn tại"
            });
        }
        // Cập nhật
        const updatedSupplier = await prisma.supplier.update({
            where: {
                id
            },
            data: {
                supplier_code: supplierCode,
                supplier_name: finalName.trim(),
                address: address?.trim() || null,
                phone: phone?.trim() || null,
                email: email?.trim() || null,
                note: note?.trim() || null,
                status: status || "active"
            }
        });
        return res.status(200).json({
            success: true,
            message: "Cập nhật nhà cung cấp thành công",
            data: updatedSupplier
        });
    }
    catch (error) {
        console.error("Lỗi cập nhật nhà cung cấp:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật nhà cung cấp"
        });
    }
};
exports.updateSupplier = updateSupplier;
// =====================================================
// XÓA NHÀ CUNG CẤP
// =====================================================
const deleteSupplier = async (req, res) => {
    try {
        const id = Number(req.params.id);
        // Kiểm tra ID
        if (!id ||
            isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "ID nhà cung cấp không hợp lệ"
            });
        }
        // Kiểm tra tồn tại
        const supplier = await prisma.supplier.findUnique({
            where: {
                id
            }
        });
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhà cung cấp"
            });
        }
        // Xóa
        await prisma.supplier.delete({
            where: {
                id
            }
        });
        return res.status(200).json({
            success: true,
            message: "Xóa nhà cung cấp thành công"
        });
    }
    catch (error) {
        console.error("Lỗi xóa nhà cung cấp:", error);
        return res.status(500).json({
            success: false,
            message: "Không thể xóa nhà cung cấp"
        });
    }
};
exports.deleteSupplier = deleteSupplier;
//# sourceMappingURL=suppliersController.js.map