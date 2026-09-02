import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* =========================================================
   HELPERS
========================================================= */

const dec = (
  value: unknown
): Prisma.Decimal => {
  try {
    return new Prisma.Decimal(
      value === undefined ||
      value === null ||
      value === ""
        ? 0
        : String(value)
    );
  } catch {
    return new Prisma.Decimal(0);
  }
};

const text = (
  value: unknown
): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const result = value.trim();

  return result || null;
};

const parseDate = (
  value: unknown
): Date => {
  if (
    typeof value !== "string" ||
    !value
  ) {
    return new Date();
  }

  const result = new Date(value);

  if (
    Number.isNaN(
      result.getTime()
    )
  ) {
    return new Date();
  }

  return result;
};

const sendError = (
  res: Response,
  error: unknown,
  status = 400
) => {
  console.error(
    "INVOICE API ERROR:",
    error
  );

  return res.status(status).json({
    success: false,

    message:
      error instanceof Error
        ? error.message
        : "Đã xảy ra lỗi",
  });
};

/* =========================================================
   GENERATE CUSTOMER CODE
========================================================= */

async function generateCustomerCode() {
  const last =
    await prisma.customer.findFirst({
      orderBy: {
        id: "desc",
      },

      select: {
        id: true,
      },
    });

  const number =
    (last?.id ?? 0) + 1;

  return `KH-${String(number).padStart(
    5,
    "0"
  )}`;
}

/* =========================================================
   GENERATE INVOICE CODE
========================================================= */

async function generateInvoiceCode() {
  const year =
    new Date().getFullYear();

  const prefix =
    `HD-${year}-`;

  const last =
    await prisma.invoice.findFirst({
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
    const match =
      last.invoice_code.match(
        /(\d+)$/
      );

    if (match) {
      next =
        Number(match[1]) + 1;
    }
  }

  return `${prefix}${String(next).padStart(
    5,
    "0"
  )}`;
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
} satisfies Prisma.InvoiceInclude;

type InvoiceListPayload = Prisma.InvoiceGetPayload<{
  include: typeof invoiceListInclude;
}>;

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

  async bootstrap(
    req: Request,
    res: Response
  ) {
    try {
      const [
        brands,
        customers,
        variants,
        invoiceCode,
      ] = await Promise.all([
        prisma.invoiceBrand.findMany({
          where: {
            status: "active",
          },

          orderBy: [
            {
              is_default:
                "desc",
            },
            {
              id:
                "asc",
            },
          ],
        }),

        prisma.customer.findMany({
          orderBy: {
            customer_name:
              "asc",
          },

          take: 500,
        }),

        prisma.productVariant.findMany({
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

          invoice_code:
            invoiceCode,

          variants:
            variants.map(
              (variant) => ({
                id:
                  variant.id,

                variant_code:
                  variant.variant_code,

                barcode:
                  variant.barcode,

                size:
                  variant.size,

                selling_price:
                  variant.selling_price.toString(),

                purchase_price:
                  variant.purchase_price.toString(),

                current_quantity:
                  variant.current_quantity,

                product_id:
                  variant.product_id,

                product_code:
                  variant.product.product_code,

                product_name:
                  variant.product.product_name,

                group_name:
                  variant.product.group.group_name,

                display_name: [
                  variant.product.product_name,
                  variant.size,
                ]
                  .filter(Boolean)
                  .join(" - "),
              })
            ),
        },
      });
    } catch (error) {
      return sendError(
        res,
        error,
        500
      );
    }
  }

  /* =======================================================
     GET BRANDS
  ======================================================= */

  async brands(
    req: Request,
    res: Response
  ) {
    try {
      const data =
        await prisma.invoiceBrand.findMany({
          where: {
            status: "active",
          },

          orderBy: [
            {
              is_default:
                "desc",
            },
            {
              id:
                "asc",
            },
          ],
        });

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return sendError(
        res,
        error,
        500
      );
    }
  }

  /* =======================================================
     UPDATE BRAND

     PUT /invoice/brands/:id
  ======================================================= */

  async updateBrand(
    req: Request,
    res: Response
  ) {
    try {
      const id =
        Number(req.params.id);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "ID thương hiệu không hợp lệ",
        });
      }

      const {
        brand_name,
        tax_code,
        phone,
        address,
        email,
        bank_name,
        bank_account,
        bank_holder,
        logo_text,
        is_default,
      } = req.body ?? {};

      if (
        typeof brand_name !==
          "string" ||
        !brand_name.trim()
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Tên thương hiệu không được để trống",
        });
      }

      const result =
        await prisma.$transaction(
          async (tx) => {
            if (
              is_default === true
            ) {
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
                brand_name:
                  brand_name.trim(),

                tax_code:
                  text(tax_code),

                phone:
                  text(phone),

                address:
                  text(address),

                email:
                  text(email),

                bank_name:
                  text(bank_name),

                bank_account:
                  text(bank_account),

                bank_holder:
                  text(bank_holder),

                logo_text:
                  text(logo_text),

                ...(typeof is_default ===
                "boolean"
                  ? {
                      is_default,
                    }
                  : {}),
              },
            });
          }
        );

      return res.json({
        success: true,

        message:
          "Đã lưu cài đặt thương hiệu",

        data:
          result,
      });
    } catch (error) {
      return sendError(
        res,
        error
      );
    }
  }

  /* =======================================================
     CUSTOMERS

     GET /invoice/customers?search=
  ======================================================= */

  async customers(
    req: Request,
    res: Response
  ) {
    try {
      const search =
        typeof req.query.search === "string"
          ? req.query.search.trim()
          : "";

      const where: Prisma.CustomerWhereInput = search
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

      const data = await prisma.customer.findMany({
        where,
        orderBy: { customer_name: "asc" },
        take: 500,
      });

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  /* =======================================================
     CREATE CUSTOMER

     POST /invoice/customers
  ======================================================= */

  async createCustomer(
    req: Request,
    res: Response
  ) {
    try {
      const {
        customer_name,
        phone,
        email,
        address,
        shipping_address,
        tax_code,
        note,
      } = req.body ?? {};

      if (
        typeof customer_name !==
          "string" ||
        !customer_name.trim()
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Vui lòng nhập tên khách hàng",
        });
      }

      const customerCode =
        await generateCustomerCode();

      const result =
        await prisma.customer.create({
          data: {
            customer_code:
              customerCode,

            customer_name:
              customer_name.trim(),

            phone:
              text(phone),

            email:
              text(email),

            address:
              text(address),

            shipping_address:
              text(
                shipping_address
              ),

            tax_code:
              text(tax_code),

            note:
              text(note),
          },
        });

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Đã thêm khách hàng",

          data:
            result,
        });
    } catch (error) {
      return sendError(
        res,
        error
      );
    }
  }

  /* =======================================================
     UPDATE CUSTOMER
  ======================================================= */

  async updateCustomer(
    req: Request,
    res: Response
  ) {
    try {
      const id =
        Number(req.params.id);

      const {
        customer_name,
        phone,
        email,
        address,
        shipping_address,
        tax_code,
        note,
      } = req.body ?? {};

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "ID khách hàng không hợp lệ",
        });
      }

      if (
        typeof customer_name !==
          "string" ||
        !customer_name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Tên khách hàng không được để trống",
        });
      }

      const result =
        await prisma.customer.update({
          where: {
            id,
          },

          data: {
            customer_name:
              customer_name.trim(),

            phone:
              text(phone),

            email:
              text(email),

            address:
              text(address),

            shipping_address:
              text(
                shipping_address
              ),

            tax_code:
              text(tax_code),

            note:
              text(note),
          },
        });

      return res.json({
        success: true,

        message:
          "Đã cập nhật khách hàng",

        data:
          result,
      });
    } catch (error) {
      return sendError(
        res,
        error
      );
    }
  }

  /* =======================================================
     DELETE CUSTOMER
  ======================================================= */

  async deleteCustomer(
    req: Request,
    res: Response
  ) {
    try {
      const id =
        Number(req.params.id);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "ID khách hàng không hợp lệ",
        });
      }

      const invoiceCount =
        await prisma.invoice.count({
          where: {
            customer_id: id,
          },
        });

      if (invoiceCount > 0) {
        return res.status(400).json({
          success: false,

          message:
            "Khách hàng đã có hóa đơn nên không thể xóa. Bạn có thể chỉnh sửa thông tin khách hàng.",
        });
      }

      await prisma.customer.delete({
        where: {
          id,
        },
      });

      return res.json({
        success: true,

        message:
          "Đã xóa khách hàng",
      });
    } catch (error) {
      return sendError(
        res,
        error
      );
    }
  }

  /* =======================================================
     NEXT CODE
  ======================================================= */

  async nextCode(
    req: Request,
    res: Response
  ) {
    try {
      const invoiceCode =
        await generateInvoiceCode();

      return res.json({
        success: true,

        data: {
          invoice_code:
            invoiceCode,
        },
      });
    } catch (error) {
      return sendError(
        res,
        error,
        500
      );
    }
  }

  /* =======================================================
     LIST INVOICES

     GET /invoice/invoices?search=
  ======================================================= */

  async invoices(
    req: Request,
    res: Response
  ) {
    try {
      const search =
        typeof req.query.search === "string"
          ? req.query.search.trim()
          : "";

      const where: Prisma.InvoiceWhereInput = search
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

      const data = await prisma.invoice.findMany({
        where,
        include: invoiceListInclude,
        orderBy: [
          { invoice_date: "desc" },
          { id: "desc" },
        ],
        take: 300,
      });

      const typedData: InvoiceListPayload[] = data;

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
    } catch (error) {
      return sendError(res, error, 500);
    }
  }

  /* =======================================================
     GET ONE INVOICE
  ======================================================= */

  async invoiceDetail(
    req: Request,
    res: Response
  ) {
    try {
      const id =
        Number(req.params.id);

      const invoice =
        await prisma.invoice.findUnique({
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
          message:
            "Không tìm thấy hóa đơn",
        });
      }

      return res.json({
        success: true,

        data: {
          ...invoice,

          subtotal:
            invoice.subtotal.toString(),

          shipping_fee:
            invoice.shipping_fee.toString(),

          total_amount:
            invoice.total_amount.toString(),

          paid_amount:
            invoice.paid_amount.toString(),

          deposit_amount:
            invoice.deposit_amount.toString(),

          items:
            invoice.items.map(
              (item) => ({
                ...item,

                unit_price:
                  item.unit_price.toString(),

                total_price:
                  item.total_price.toString(),
              })
            ),
        },
      });
    } catch (error) {
      return sendError(
        res,
        error,
        500
      );
    }
  }

  /* =======================================================
     CREATE INVOICE

     POST /invoice/invoices

     QUAN TRỌNG:
     - chỉ lưu hóa đơn
     - KHÔNG TRỪ KHO
  ======================================================= */

  async createInvoice(
    req: Request,
    res: Response
  ) {
    try {
      const {
        invoice_code,
        invoice_date,

        brand_id,
        customer_id,

        channel,
        order_code,

        payment_method,
        deposit_amount,

        shipping_fee,
        shipping_address,

        note,

        items,
      } = req.body ?? {};

      const brandId =
        Number(brand_id);

      if (
        !Number.isInteger(
          brandId
        ) ||
        brandId <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Vui lòng chọn thương hiệu phát hành hóa đơn",
        });
      }

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Hóa đơn phải có ít nhất 1 sản phẩm",
        });
      }

      const normalizedItems:
        {
          variant_id: number;
          quantity: number;
          unit_price: Prisma.Decimal;
          total_price: Prisma.Decimal;
        }[] = [];

      for (
        const item of items
      ) {
        const variantId =
          Number(
            item.variant_id
          );

        const quantity =
          Number(
            item.quantity
          );

        const unitPrice =
          dec(
            item.unit_price
          );

        if (
          !Number.isInteger(
            variantId
          ) ||
          variantId <= 0
        ) {
          throw new Error(
            "Có sản phẩm chưa được chọn"
          );
        }

        if (
          !Number.isFinite(
            quantity
          ) ||
          quantity <= 0
        ) {
          throw new Error(
            "Số lượng sản phẩm phải lớn hơn 0"
          );
        }

        if (
          unitPrice.lessThan(0)
        ) {
          throw new Error(
            "Đơn giá không hợp lệ"
          );
        }

        const variant =
          await prisma.productVariant.findUnique({
            where: {
              id:
                variantId,
            },

            select: {
              current_quantity:
                true,

              status:
                true,
            },
          });

        if (
          !variant ||
          variant.status !==
            "active"
        ) {
          throw new Error(
            "Sản phẩm không tồn tại hoặc đã ngừng bán"
          );
        }

        /*
         * Chỉ kiểm tra tồn.
         * KHÔNG trừ kho.
         */
        if (
          quantity >
          variant.current_quantity
        ) {
          throw new Error(
            `Số lượng bán (${quantity}) vượt tồn hiện tại (${variant.current_quantity})`
          );
        }

        normalizedItems.push({
          variant_id:
            variantId,

          quantity,

          unit_price:
            unitPrice,

          total_price:
            unitPrice.mul(
              quantity
            ),
        });
      }

      const subtotal =
        normalizedItems.reduce(
          (
            sum,
            item
          ) =>
            sum.plus(
              item.total_price
            ),

          new Prisma.Decimal(0)
        );

      const shipping =
        dec(
          shipping_fee
        );

      const deposit =
        dec(
          deposit_amount
        );

      const totalAmount =
        subtotal.plus(
          shipping
        );

      if (
        deposit.lessThan(0)
      ) {
        throw new Error(
          "Tiền cọc không hợp lệ"
        );
      }

      if (
        deposit.greaterThan(
          totalAmount
        )
      ) {
        throw new Error(
          "Tiền cọc không được lớn hơn tổng thanh toán"
        );
      }

      const finalCode =
        typeof invoice_code ===
          "string" &&
        invoice_code.trim()
          ? invoice_code.trim()
          : await generateInvoiceCode();

      const result =
        await prisma.invoice.create({
          data: {
            invoice_code:
              finalCode,

            invoice_date:
              parseDate(
                invoice_date
              ),

            brand_id:
              brandId,

            customer_id:
              customer_id
                ? Number(
                    customer_id
                  )
                : null,

            channel:
              text(
                channel
              ),

            order_code:
              text(
                order_code
              ),

            subtotal,

            shipping_fee:
              shipping,

            total_amount:
              totalAmount,

            deposit_amount:
              deposit,

            paid_amount:
              deposit,

            payment_method:
              text(
                payment_method
              ),

            shipping_address:
              text(
                shipping_address
              ),

            warehouse_status:
              "not_processed",

            status:
              "completed",

            note:
              text(
                note
              ),

            items: {
              create:
                normalizedItems,
            },
          },

          include: {
            brand:
              true,

            customer:
              true,

            items: {
              include: {
                variant: {
                  include: {
                    product:
                      true,
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

          message:
            "Đã lưu hóa đơn",

          data: {
            ...result,

            subtotal:
              result.subtotal.toString(),

            shipping_fee:
              result.shipping_fee.toString(),

            total_amount:
              result.total_amount.toString(),

            deposit_amount:
              result.deposit_amount.toString(),

            paid_amount:
              result.paid_amount.toString(),
          },
        });
    } catch (error) {
      return sendError(
        res,
        error
      );
    }
  }
}

export default new InvoiceController();