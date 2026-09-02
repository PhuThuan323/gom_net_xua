import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lấy tất cả nhóm sản phẩm
export const getAllGroups = async (
  req: Request,
  res: Response
) => {
  try {
    const groups = await prisma.productGroup.findMany({
      include: {
        products: {
          include: {
            variants: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("Lỗi lấy nhóm sản phẩm:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách nhóm sản phẩm",
    });
  }
};


// Lấy một nhóm sản phẩm
export const getGroupById = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const group = await prisma.productGroup.findUnique({
      where: {
        id,
      },
      include: {
        products: {
          include: {
            variants: true,
          },
        },
      },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm sản phẩm",
      });
    }

    return res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Lỗi lấy nhóm:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};


// Tạo nhóm sản phẩm
export const createGroup = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      group_code,
      group_name,
      description,
      image_url,
      status,
    } = req.body;

    if (!group_code || !group_name) {
      return res.status(400).json({
        success: false,
        message: "group_code và group_name là bắt buộc",
      });
    }

    const existingGroup =
      await prisma.productGroup.findUnique({
        where: {
          group_code,
        },
      });

    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: "Mã nhóm sản phẩm đã tồn tại",
      });
    }

    const group = await prisma.productGroup.create({
      data: {
        group_code,
        group_name,
        description,
        image_url,
        status: status || "active",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Tạo nhóm sản phẩm thành công",
      data: group,
    });
  } catch (error) {
    console.error("Lỗi tạo nhóm:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể tạo nhóm sản phẩm",
    });
  }
};


// Cập nhật nhóm
export const updateGroup = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const {
      group_code,
      group_name,
      description,
      image_url,
      status,
    } = req.body;

    const group = await prisma.productGroup.update({
      where: {
        id,
      },
      data: {
        group_code,
        group_name,
        description,
        image_url,
        status,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật nhóm thành công",
      data: group,
    });
  } catch (error: any) {
    console.error("Lỗi cập nhật nhóm:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật nhóm",
    });
  }
};


// Xóa nhóm
export const deleteGroup = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    await prisma.productGroup.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Xóa nhóm sản phẩm thành công",
    });
  } catch (error: any) {
    console.error("Lỗi xóa nhóm:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể xóa nhóm sản phẩm",
    });
  }
};