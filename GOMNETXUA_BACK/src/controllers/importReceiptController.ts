import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


// =====================================================
// TẠO PHIẾU NHẬP KHO
// =====================================================

export const createImportReceipt = async (
  req: Request,
  res: Response
) => {
  try {

    const {
      supplier_id,
      paid_amount = 0,
      received_by = "",
      note = "",
      import_date,
      items
    } = req.body;


    // ================================================
    // KIỂM TRA DỮ LIỆU
    // ================================================

    if (!supplier_id) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn nhà cung cấp"
      });
    }


    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Phiếu nhập phải có ít nhất một sản phẩm"
      });
    }


    // ================================================
    // KIỂM TRA NHÀ CUNG CẤP
    // ================================================

    const supplier =
      await prisma.supplier.findUnique({
        where: {
          id: Number(supplier_id)
        }
      });


    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhà cung cấp"
      });
    }


    // ================================================
    // XỬ LÝ TỪNG SẢN PHẨM
    // ================================================

    const processedItems: {
  variant_id: number;
  quantity: number;
  purchase_price: number;
  total_price: number;
}[] = [];


    for (const item of items) {

      const variantId =
        Number(item.variant_id);

      const quantity =
        Number(item.quantity);

      const purchasePrice =
        Number(item.purchase_price);


      if (
        !variantId ||
        quantity <= 0 ||
        purchasePrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Dữ liệu sản phẩm nhập kho không hợp lệ"
        });
      }


      // Kiểm tra biến thể
      const variant =
        await prisma.productVariant.findUnique({
          where: {
            id: variantId
          }
        });


      if (!variant) {
        return res.status(404).json({
          success: false,
          message:
            `Không tìm thấy biến thể có ID ${variantId}`
        });
      }


      const totalPrice =
        quantity * purchasePrice;


      processedItems.push({

        variant_id: variantId,

        quantity,

        purchase_price: purchasePrice,

        total_price: totalPrice

      });

    }


    // ================================================
    // TÍNH TỔNG TIỀN
    // ================================================

    const totalAmount =
      processedItems.reduce(
        (
          total,
          item
        ) =>
          total + item.total_price,
        0
      );


    const paidAmount =
      Number(paid_amount);


    if (paidAmount < 0) {
      return res.status(400).json({
        success: false,
        message:
          "Số tiền đã trả không được âm"
      });
    }


    if (paidAmount > totalAmount) {
      return res.status(400).json({
        success: false,
        message:
          "Số tiền đã trả không được lớn hơn tổng tiền phiếu nhập"
      });
    }


    const debtAmount =
      totalAmount - paidAmount;


    // ================================================
    // TẠO MÃ PHIẾU
    // ================================================

    const receiptCode =
      `PN-${Date.now()}`;


    // ================================================
    // TRANSACTION
    // ================================================

    const result =
      await prisma.$transaction(
        async (tx) => {


          // ============================================
          // TẠO PHIẾU NHẬP
          // ============================================

          const receipt = await tx.importReceipt.create({
  data: {
    receipt_code: receiptCode,

    supplier_id: supplier_id
      ? Number(supplier_id)
      : null,

    total_amount: totalAmount,

    paid_amount: paidAmount,

    debt_amount: debtAmount,

    status: debtAmount === 0
      ? "paid"
      : "debt",

    received_by: received_by?.trim() || null,

    note: note?.trim() || null,

    import_date: import_date
      ? new Date(import_date)
      : new Date(),

    items: {
      create: processedItems
    }
  },

  include: {
    supplier: true,

    items: {
      include: {
        variant: {
          include: {
            product: true
          }
        }
      }
    }
  }
});

          // ============================================
          // CẬP NHẬT TỒN KHO
          // ============================================

          for (
            const item of processedItems
          ) {

            await tx.productVariant.update({

              where: {
                id: item.variant_id
              },

              data: {

                current_quantity: {
                  increment:
                    item.quantity
                },

                purchase_price:
                  item.purchase_price

              }

            }
            
            
        )
        ;
            

          }


          return receipt;

        }
      );


    return res.status(201).json({

      success: true,

      message:
        "Tạo phiếu nhập kho thành công",

      data: result

    });


  } catch (error: any) {

    console.error(
      "Lỗi tạo phiếu nhập:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Không thể tạo phiếu nhập kho",

      error:
        error.message

    });

  }

};


// =====================================================
// LẤY TẤT CẢ PHIẾU NHẬP
// =====================================================

export const getAllImportReceipts =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const receipts =
        await prisma.importReceipt.findMany({

          orderBy: {
            import_date: "desc"
          },

          include: {

            supplier: true,

            items: {

              include: {

                variant: {

                  include: {

                    product: true

                  }

                }

              }

            }

          }

        });


      return res.status(200).json({

        success: true,

        data: receipts

      });


    } catch (error: any) {

      console.error(
        "Lỗi lấy phiếu nhập:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Không thể lấy danh sách phiếu nhập"

      });

    }

  };


// =====================================================
// LẤY CHI TIẾT PHIẾU NHẬP
// =====================================================

export const getImportReceiptById =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const id =
        Number(req.params.id);


      const receipt =
        await prisma.importReceipt.findUnique({

          where: {
            id
          },

          include: {

            supplier: true,

            items: {

              include: {

                variant: {

                  include: {

                    product: true

                  }

                }

              }

            }

          }

        });


      if (!receipt) {

        return res.status(404).json({

          success: false,

          message:
            "Không tìm thấy phiếu nhập"

        });

      }


      return res.status(200).json({

        success: true,

        data: receipt

      });


    } catch (error: any) {

      console.error(
        "Lỗi lấy phiếu nhập:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Không thể lấy chi tiết phiếu nhập"

      });

    }

  };


// =====================================================
// CẬP NHẬT TIỀN ĐÃ TRẢ
// =====================================================

export const updateImportPayment =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const id =
        Number(req.params.id);


      const {
        paid_amount
      } = req.body;


      const receipt =
        await prisma.importReceipt.findUnique({

          where: {
            id
          }

        });


      if (!receipt) {

        return res.status(404).json({

          success: false,

          message:
            "Không tìm thấy phiếu nhập"

        });

      }


      const newPaidAmount =
        Number(paid_amount);


      const totalAmount =
        Number(
          receipt.total_amount
        );


      if (
        newPaidAmount < 0 ||
        newPaidAmount > totalAmount
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Số tiền thanh toán không hợp lệ"

        });

      }


      const debtAmount =
        totalAmount -
        newPaidAmount;


      const updatedReceipt =
        await prisma.importReceipt.update({

          where: {
            id
          },

          data: {

            paid_amount:
              newPaidAmount,

            debt_amount:
              debtAmount,

            status:
              debtAmount === 0
                ? "paid"
                : "debt"

          },

          include: {

            supplier: true,

            items: true

          }

        });


      return res.status(200).json({

        success: true,

        message:
          "Cập nhật thanh toán thành công",

        data:
          updatedReceipt

      });


    } catch (error: any) {

      console.error(
        "Lỗi cập nhật thanh toán:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Không thể cập nhật thanh toán"

      });

    }

  };


// =====================================================
// XÓA PHIẾU NHẬP
// =====================================================

export const deleteImportReceipt =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const id =
        Number(req.params.id);


      const receipt =
        await prisma.importReceipt.findUnique({

          where: {
            id
          },

          include: {
            items: true
          }

        });


      if (!receipt) {

        return res.status(404).json({

          success: false,

          message:
            "Không tìm thấy phiếu nhập"

        });

      }


      await prisma.$transaction(
        async (tx) => {


          // ============================================
          // TRỪ LẠI SỐ LƯỢNG KHO
          // ============================================

          for (
            const item of receipt.items
          ) {

            await tx.productVariant.update({

              where: {
                id:
                  item.variant_id
              },

              data: {

                current_quantity: {
                  decrement:
                    item.quantity
                }

              }

            });

          }


          // ============================================
          // XÓA PHIẾU
          // ============================================

          await tx.importReceipt.delete({

            where: {
              id
            }

          });

        }
      );


      return res.status(200).json({

        success: true,

        message:
          "Xóa phiếu nhập thành công"

      });


    } catch (error: any) {

      console.error(
        "Lỗi xóa phiếu nhập:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Không thể xóa phiếu nhập"

      });

    }

  };

  export const getImportTemplateData = async (
  req: Request,
  res: Response
) => {
  try {
    const variants =
      await prisma.productVariant.findMany({
        where: {
          status: "active"
        },
        include: {
          product: true
        },
        orderBy: {
          id: "asc"
        }
      });

    const data = variants.map(
      (variant, index) => ({
        stt: index + 1,

        product_name:
          variant.product.product_name,

        size:
          variant.size || "",

        sku:
          variant.variant_code,

        current_quantity:
          variant.current_quantity,

        import_quantity: "",

        purchase_price:
          Number(variant.purchase_price),

        note: ""
      })
    );

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {

    console.error(
      "Lỗi lấy dữ liệu mẫu nhập kho:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Không thể lấy dữ liệu mẫu nhập kho"
    });
  }
};
export const previewImportExcel = async (
  req: Request,
  res: Response
) => {
  try {

    const {
      items = []
    } = req.body;

    if (!Array.isArray(items)) {

      return res.status(400).json({
        success: false,
        message:
          "Dữ liệu sản phẩm không hợp lệ"
      });

    }

    const processedItems = [];

    for (
      const item of items
    ) {

      const sku =
        String(
          item.sku || ""
        ).trim();

      const quantity =
        Number(
          item.quantity || 0
        );

      const purchasePrice =
        Number(
          item.purchase_price || 0
        );

      if (
        !sku ||
        quantity <= 0
      ) {
        continue;
      }

      const variant =
        await prisma.productVariant.findUnique({
          where: {
            variant_code: sku
          },
          include: {
            product: true
          }
        });

      if (!variant) {

        processedItems.push({
          sku,
          valid: false,
          message:
            "Không tìm thấy SKU"
        });

        continue;
      }

      processedItems.push({

        valid: true,

        variant_id:
          variant.id,

        product_name:
          variant.product.product_name,

        size:
          variant.size,

        sku:
          variant.variant_code,

        current_quantity:
          variant.current_quantity,

        import_quantity:
          quantity,

        purchase_price:
          purchasePrice,

        total_price:
          quantity * purchasePrice,

        note:
          item.note || ""

      });

    }

    return res.status(200).json({
      success: true,
      data: processedItems
    });

  } catch (error) {

    console.error(
      "Lỗi preview Excel:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Không thể đọc dữ liệu nhập kho"
    });

  }
};