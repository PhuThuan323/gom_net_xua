import {
  Request,
  Response,
} from "express";

import {
  Prisma,
  PrismaClient,
} from "@prisma/client";

const prisma =
  new PrismaClient();

/* =========================================================
   TRANSACTION TYPES
========================================================= */

const TYPE_LOSS =
  "LOSS";

const TYPE_CUSTOMER_RETURN =
  "CUSTOMER_RETURN_RESALE";

/* =========================================================
   HELPERS
========================================================= */

const sendError = (
  res: Response,
  error: unknown,
  status = 400
) => {
  console.error(
    "LOSS STOCK ERROR:",
    error
  );

  return res
    .status(status)
    .json({
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi",
    });
};

/* =========================================================
   DATE
========================================================= */

const parseDate = (
  value: unknown
): Date => {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return new Date();
  }

  const matched =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (matched) {
    return new Date(
      `${matched[1]}-${matched[2]}-${matched[3]}T12:00:00+07:00`
    );
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return new Date();
  }

  return date;
};

/* =========================================================
   NOTE
========================================================= */

const buildNote = (
  performedBy: string,
  reason: string,
  note: string | null
) => {
  const parts = [
    `Người thực hiện: ${performedBy}`,
    `Lý do: ${reason}`,
  ];

  if (note) {
    parts.push(
      `Ghi chú: ${note}`
    );
  }

  return parts.join(
    " | "
  );
};

/* =========================================================
   PARSE NOTE
========================================================= */

const parseNote = (
  note: string | null
) => {
  const value =
    note || "";

  const performedBy =
    value.match(
      /Người thực hiện:\s*([^|]+)/
    )?.[1]?.trim() ||
    "";

  const reason =
    value.match(
      /Lý do:\s*([^|]+)/
    )?.[1]?.trim() ||
    "";

  const description =
    value.match(
      /Ghi chú:\s*([^|]+)/
    )?.[1]?.trim() ||
    "";

  return {
    performed_by:
      performedBy,

    reason,

    description,
  };
};

/* =========================================================
   TRANSACTION RETRY
========================================================= */

async function runTransaction<T>(
  callback: (
    tx: Prisma.TransactionClient
  ) => Promise<T>
): Promise<T> {
  const maxRetries =
    3;

  for (
    let attempt = 1;
    attempt <=
    maxRetries;
    attempt++
  ) {
    try {
      return await prisma.$transaction(
        callback,
        {
          isolationLevel:
            Prisma
              .TransactionIsolationLevel
              .Serializable,
        }
      );
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code ===
          "P2034" &&
        attempt <
          maxRetries
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    "Không thể hoàn tất giao dịch kho"
  );
}

/* =========================================================
   MAP VARIANT
========================================================= */

const mapVariant = (
  variant: {
    id: number;
    variant_code: string;

    barcode:
      | string
      | null;

    size:
      | string
      | null;

    purchase_price:
      Prisma.Decimal;

    current_quantity: number;

    image_url:
      | string
      | null;

    product: {
      id: number;

      product_code: string;

      product_name: string;

      image_url:
        | string
        | null;

      group: {
        id: number;

        group_code: string;

        group_name: string;
      };
    };
  }
) => ({
  id:
    variant.id,

  variant_code:
    variant.variant_code,

  barcode:
    variant.barcode,

  size:
    variant.size,

  purchase_price:
    variant.purchase_price.toString(),

  current_quantity:
    variant.current_quantity,

  image_url:
    variant.image_url ||
    variant.product.image_url,

  product_id:
    variant.product.id,

  product_code:
    variant.product.product_code,

  product_name:
    variant.product.product_name,

  group_id:
    variant.product.group.id,

  group_code:
    variant.product.group.group_code,

  group_name:
    variant.product.group.group_name,

  display_name: [
    variant.product
      .product_name,

    variant.size,
  ]
    .filter(Boolean)
    .join(" - "),
});

/* =========================================================
   CONTROLLER
========================================================= */

class LossStockController {
  /* =======================================================
     BOOTSTRAP
  ======================================================= */

  async bootstrap(
    req: Request,
    res: Response
  ) {
    try {
      const groups =
        await prisma.productGroup.findMany({
          where: {
            status:
              "active",
          },

          include: {
            products: {
              where: {
                status:
                  "active",
              },

              include: {
                variants: {
                  where: {
                    status:
                      "active",
                  },

                  orderBy: [
                    {
                      size:
                        "asc",
                    },

                    {
                      variant_code:
                        "asc",
                    },
                  ],
                },
              },

              orderBy: {
                product_name:
                  "asc",
              },
            },
          },

          orderBy: {
            group_name:
              "asc",
          },
        });

      return res.json({
        success: true,

        data:
          groups.map(
            (
              group
            ) => ({
              id:
                group.id,

              group_code:
                group.group_code,

              group_name:
                group.group_name,

              products:
                group.products.map(
                  (
                    product
                  ) => ({
                    id:
                      product.id,

                    product_code:
                      product.product_code,

                    product_name:
                      product.product_name,

                    image_url:
                      product.image_url,

                    variants:
                      product.variants.map(
                        (
                          variant
                        ) => ({
                          id:
                            variant.id,

                          variant_code:
                            variant.variant_code,

                          barcode:
                            variant.barcode,

                          size:
                            variant.size,

                          purchase_price:
                            variant.purchase_price.toString(),

                          current_quantity:
                            variant.current_quantity,

                          image_url:
                            variant.image_url,
                        })
                      ),
                  })
                ),
            })
          ),
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
     SEARCH
  ======================================================= */

  async search(
    req: Request,
    res: Response
  ) {
    try {
      const q =
        typeof req.query.q ===
          "string"
          ? req.query.q.trim()
          : "";

      if (!q) {
        return res.json({
          success: true,
          data: [],
        });
      }

      const variants =
        await prisma.productVariant.findMany({
          where: {
            status:
              "active",

            product: {
              status:
                "active",
            },

            OR: [
              {
                variant_code: {
                  contains:
                    q,
                },
              },

              {
                barcode: {
                  contains:
                    q,
                },
              },

              {
                size: {
                  contains:
                    q,
                },
              },

              {
                product: {
                  product_name: {
                    contains:
                      q,
                  },
                },
              },

              {
                product: {
                  product_code: {
                    contains:
                      q,
                  },
                },
              },
            ],
          },

          include: {
            product: {
              include: {
                group:
                  true,
              },
            },
          },

          take:
            100,

          orderBy: {
            variant_code:
              "asc",
          },
        });

      return res.json({
        success: true,

        data:
          variants.map(
            mapVariant
          ),
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
     COMMIT

     LOSS
     => TRỪ KHO

     CUSTOMER_RETURN_RESALE
     => CỘNG KHO
  ======================================================= */

  async commit(
    req: Request,
    res: Response
  ) {
    try {
      const {
        transaction_date,
        transaction_type,
        variant_id,
        quantity,
        performed_by,
        reason,
        note,
      } =
        req.body ?? {};

      const variantId =
        Number(
          variant_id
        );

      const qty =
        Number(
          quantity
        );

      if (
        !Number.isInteger(
          variantId
        ) ||
        variantId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Sản phẩm không hợp lệ",
          });
      }

      if (
        !Number.isInteger(
          qty
        ) ||
        qty <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Số lượng phải lớn hơn 0",
          });
      }

      if (
        transaction_type !==
          TYPE_LOSS &&
        transaction_type !==
          TYPE_CUSTOMER_RETURN
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Loại nghiệp vụ không hợp lệ",
          });
      }

      if (
        typeof performed_by !==
          "string" ||
        !performed_by.trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Vui lòng nhập người thực hiện",
          });
      }

      if (
        typeof reason !==
          "string" ||
        !reason.trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Vui lòng chọn lý do",
          });
      }

      const finalNote =
        buildNote(
          performed_by.trim(),

          reason.trim(),

          typeof note ===
            "string" &&
          note.trim()
            ? note.trim()
            : null
        );

      const date =
        parseDate(
          transaction_date
        );

      const result =
        await runTransaction(
          async (
            tx
          ) => {
            const variant =
              await tx.productVariant.findUnique({
                where: {
                  id:
                    variantId,
                },

                include: {
                  product: {
                    include: {
                      group:
                        true,
                    },
                  },
                },
              });

            if (!variant) {
              throw new Error(
                "Không tìm thấy sản phẩm"
              );
            }

            if (
              variant.status !==
                "active" ||
              variant.product.status !==
                "active"
            ) {
              throw new Error(
                "Sản phẩm đã ngừng hoạt động"
              );
            }

            const before =
              variant.current_quantity;

            let after =
              before;

            /*
             * ==============================
             * BỂ VỠ / THẤT THOÁT
             * ==============================
             */

            if (
              transaction_type ===
              TYPE_LOSS
            ) {
              if (
                qty >
                before
              ) {
                throw new Error(
                  `${variant.product.product_name} ${variant.size || ""}: tồn hiện tại chỉ còn ${before}, không thể trừ ${qty}`
                );
              }

              const updated =
                await tx.productVariant.updateMany({
                  where: {
                    id:
                      variant.id,

                    current_quantity: {
                      gte:
                        qty,
                    },
                  },

                  data: {
                    current_quantity: {
                      decrement:
                        qty,
                    },
                  },
                });

              if (
                updated.count !==
                1
              ) {
                throw new Error(
                  "Tồn kho vừa thay đổi. Vui lòng tải lại và thử lại."
                );
              }

              after =
                before -
                qty;
            }

            /*
             * ==============================
             * KHÁCH TRẢ CÒN BÁN ĐƯỢC
             * ==============================
             */

            if (
              transaction_type ===
              TYPE_CUSTOMER_RETURN
            ) {
              await tx.productVariant.update({
                where: {
                  id:
                    variant.id,
                },

                data: {
                  current_quantity: {
                    increment:
                      qty,
                  },
                },
              });

              after =
                before +
                qty;
            }

            const unitCost =
              variant.purchase_price;

            const totalValue =
              unitCost.mul(
                qty
              );

            const transaction =
              await tx.inventoryTransaction.create({
                data: {
                  variant_id:
                    variant.id,

                  transaction_type,

                  quantity:
                    qty,

                  quantity_before:
                    before,

                  quantity_after:
                    after,

                  /*
                   * Snapshot giá vốn
                   */
                  unit_price:
                    unitCost,

                  total_value:
                    totalValue,

                  note:
                    finalNote,

                  created_at:
                    date,
                },
              });

            return {
              transaction_id:
                transaction.id,

              transaction_type,

              quantity:
                qty,

              quantity_before:
                before,

              quantity_after:
                after,

              unit_cost:
                unitCost.toString(),

              total_value:
                totalValue.toString(),

              performed_by:
                performed_by.trim(),

              reason:
                reason.trim(),

              variant:
                mapVariant(
                  variant
                ),
            };
          }
        );

      return res
        .status(201)
        .json({
          success: true,

          message:
            transaction_type ===
            TYPE_LOSS
              ? `Đã ghi nhận thất thoát ${qty} sản phẩm`
              : `Đã nhập lại kho ${qty} sản phẩm khách trả`,

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
     DASHBOARD
  ======================================================= */

  async dashboard(
    req: Request,
    res: Response
  ) {
    try {
      const from =
        typeof req.query.from ===
          "string"
          ? req.query.from.trim()
          : "";

      const to =
        typeof req.query.to ===
          "string"
          ? req.query.to.trim()
          : "";

      const dateFilter:
        Prisma.DateTimeFilter =
        {};

      if (from) {
        dateFilter.gte =
          new Date(
            `${from}T00:00:00+07:00`
          );
      }

      if (to) {
        dateFilter.lte =
          new Date(
            `${to}T23:59:59+07:00`
          );
      }

      const baseWhere:
        Prisma.InventoryTransactionWhereInput =
        {
          transaction_type: {
            in: [
              TYPE_LOSS,

              TYPE_CUSTOMER_RETURN,
            ],
          },

          ...(from ||
          to
            ? {
                created_at:
                  dateFilter,
              }
            : {}),
        };

      const [
        rows,
        occurrenceCount,
      ] =
        await Promise.all([
          prisma.inventoryTransaction.findMany({
            where:
              baseWhere,

            select: {
              transaction_type:
                true,

              quantity:
                true,

              total_value:
                true,
            },
          }),

          prisma.inventoryTransaction.count({
            where:
              baseWhere,
          }),
        ]);

      let lossQuantity =
        0;

      let returnQuantity =
        0;

      let lossValue =
        new Prisma.Decimal(
          0
        );

      for (
        const row of rows
      ) {
        if (
          row.transaction_type ===
          TYPE_LOSS
        ) {
          lossQuantity +=
            row.quantity;

          if (
            row.total_value
          ) {
            lossValue =
              lossValue.plus(
                row.total_value
              );
          }
        }

        if (
          row.transaction_type ===
          TYPE_CUSTOMER_RETURN
        ) {
          returnQuantity +=
            row.quantity;
        }
      }

      return res.json({
        success: true,

        data: {
          loss_quantity:
            lossQuantity,

          loss_value:
            lossValue.toString(),

          occurrence_count:
            occurrenceCount,

          return_quantity:
            returnQuantity,
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
     HISTORY
  ======================================================= */

  async history(
    req: Request,
    res: Response
  ) {
    try {
      const from =
        typeof req.query.from ===
          "string"
          ? req.query.from.trim()
          : "";

      const to =
        typeof req.query.to ===
          "string"
          ? req.query.to.trim()
          : "";

      const type =
        typeof req.query.type ===
          "string"
          ? req.query.type.trim()
          : "";

      const reason =
        typeof req.query.reason ===
          "string"
          ? req.query.reason.trim()
          : "";

      const where:
        Prisma.InventoryTransactionWhereInput =
        {
          transaction_type:
            type ===
              TYPE_LOSS ||
            type ===
              TYPE_CUSTOMER_RETURN
              ? type
              : {
                  in: [
                    TYPE_LOSS,

                    TYPE_CUSTOMER_RETURN,
                  ],
                },
        };

      if (
        from ||
        to
      ) {
        const createdAt:
          Prisma.DateTimeFilter =
          {};

        if (from) {
          createdAt.gte =
            new Date(
              `${from}T00:00:00+07:00`
            );
        }

        if (to) {
          createdAt.lte =
            new Date(
              `${to}T23:59:59+07:00`
            );
        }

        where.created_at =
          createdAt;
      }

      if (reason) {
        where.note = {
          contains:
            `Lý do: ${reason}`,
        };
      }

      const rows =
        await prisma.inventoryTransaction.findMany({
          where,

          include: {
            variant: {
              include: {
                product: {
                  include: {
                    group:
                      true,
                  },
                },
              },
            },
          },

          orderBy: [
            {
              created_at:
                "desc",
            },

            {
              id:
                "desc",
            },
          ],

          take:
            1000,
        });

      return res.json({
        success: true,

        data:
          rows.map(
            (
              row
            ) => {
              const meta =
                parseNote(
                  row.note
                );

              return {
                id:
                  row.id,

                transaction_type:
                  row.transaction_type,

                quantity:
                  row.quantity,

                quantity_before:
                  row.quantity_before,

                quantity_after:
                  row.quantity_after,

                unit_cost:
                  row.unit_price?.toString() ||
                  "0",

                total_value:
                  row.total_value?.toString() ||
                  "0",

                created_at:
                  row.created_at,

                performed_by:
                  meta.performed_by,

                reason:
                  meta.reason,

                note:
                  meta.description,

                variant: {
                  id:
                    row.variant.id,

                  variant_code:
                    row.variant.variant_code,

                  barcode:
                    row.variant.barcode,

                  size:
                    row.variant.size,

                  group_name:
                    row.variant.product.group.group_name,

                  product_name:
                    row.variant.product.product_name,
                },
              };
            }
          ),
      });
    } catch (error) {
      return sendError(
        res,
        error,
        500
      );
    }
  }
}

export default new LossStockController();