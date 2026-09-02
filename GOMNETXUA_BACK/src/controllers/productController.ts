import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lấy danh sách sản phẩm
export const getAllProducts = async (
  req: Request,
  res: Response
) => {
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
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách sản phẩm",
    });
  }
};


// Tạo sản phẩm
export const createProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      group_id,
      product_code,
      product_name,
      description,
      image_url,
      status,
    } = req.body;

    if (
      !group_id ||
      !product_code ||
      !product_name
    ) {
      return res.status(400).json({
        success: false,
        message:
          "group_id, product_code và product_name là bắt buộc",
      });
    }

    const group =
      await prisma.productGroup.findUnique({
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

    const product =
      await prisma.product.create({
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
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Không thể tạo sản phẩm",
    });
  }
};


// Cập nhật sản phẩm
export const updateProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const product =
      await prisma.product.update({
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
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật sản phẩm",
    });
  }
};


// Xóa sản phẩm
export const deleteProduct = async (
  req: Request,
  res: Response
) => {
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
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Không thể xóa sản phẩm",
    });
  }
};