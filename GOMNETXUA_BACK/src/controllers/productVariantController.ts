import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lấy tất cả biến thể
export const getAllVariants = async (
  req: Request,
  res: Response
) => {
  try {
    const variants =
      await prisma.productVariant.findMany({
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
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách biến thể",
    });
  }
};


// Tạo biến thể
export const createVariant = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      product_id,
      variant_code,
      size,
      barcode,
      purchase_price,
      selling_price,
      current_quantity,
      min_stock_quantity,
      image_url,
      status,
    } = req.body;

    if (!product_id || !variant_code) {
      return res.status(400).json({
        success: false,
        message:
          "product_id và variant_code là bắt buộc",
      });
    }

    const product =
      await prisma.product.findUnique({
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

    const variant =
      await prisma.productVariant.create({
        data: {
          product_id: Number(product_id),
          variant_code,
          size,
          barcode,
          purchase_price:
            Number(purchase_price) || 0,
          selling_price:
            Number(selling_price) || 0,
          current_quantity:
            Number(current_quantity) || 0,
          min_stock_quantity:
            Number(min_stock_quantity) || 0,
          image_url,
          status: status || "active",
        },
      });

    return res.status(201).json({
      success: true,
      message: "Tạo biến thể thành công",
      data: variant,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Không thể tạo biến thể",
    });
  }
};


// Cập nhật biến thể
export const updateVariant = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const variant =
      await prisma.productVariant.update({
        where: {
          id,
        },
        data: {
          ...req.body,

          purchase_price:
            req.body.purchase_price !== undefined
              ? Number(req.body.purchase_price)
              : undefined,

          selling_price:
            req.body.selling_price !== undefined
              ? Number(req.body.selling_price)
              : undefined,

          current_quantity:
            req.body.current_quantity !== undefined
              ? Number(req.body.current_quantity)
              : undefined,

          min_stock_quantity:
            req.body.min_stock_quantity !== undefined
              ? Number(req.body.min_stock_quantity)
              : undefined,
        },
      });

    return res.status(200).json({
      success: true,
      message: "Cập nhật biến thể thành công",
      data: variant,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật biến thể",
    });
  }
};


// Xóa biến thể
export const deleteVariant = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    await prisma.productVariant.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Xóa biến thể thành công",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Không thể xóa biến thể",
    });
  }
};