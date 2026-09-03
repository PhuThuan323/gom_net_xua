import {
  Request,
  Response,
} from "express";

import {
  Prisma,
} from "@prisma/client";

import prisma from "../lib/prisma";

/* =========================================================
   CONFIG
========================================================= */

const EXPORT_TRANSACTION_TYPE =
  "EXPORT";

/*
 * Nếu hệ thống cũ của bạn đang dùng
 * transaction_type = "OUT"
 *
 * thì chỉ cần đổi dòng trên thành:
 *
 * const EXPORT_TRANSACTION_TYPE = "OUT";
 */

/* =========================================================
   HELPERS
========================================================= */

const sendError = (
  res: Response,
  error: unknown,
  status = 400
) => {
  console.error(
    "EXPORT STOCK ERROR:",
    error
  );

  return res
    .status(status)
    .json({
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi xuất kho",
    });
};

/* =========================================================
   PARSE DATE
========================================================= */

const parseExportDate = (
  value: unknown
): Date => {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return new Date();
  }

  /*
   * Frontend gửi:
   * 2026-08-30
   *
   * Ép múi giờ Việt Nam để tránh
   * bị lệch ngày.
   */
  const match =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (match) {
    const year =
      Number(match[1]);

    const month =
      Number(match[2]);

    const day =
      Number(match[3]);

    return new Date(
      `${year}-${String(
        month
      ).padStart(
        2,
        "0"
      )}-${String(
        day
      ).padStart(
        2,
        "0"
      )}T12:00:00+07:00`
    );
  }

  const result =
    new Date(value);

  if (
    Number.isNaN(
      result.getTime()
    )
  ) {
    return new Date();
  }

  return result;
};

/* =========================================================
   GENERATE EXPORT CODE
========================================================= */

const generateExportCode =
  () => {
    const now =
      new Date();

    const yyyy =
      now.getFullYear();

    const mm =
      String(
        now.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const dd =
      String(
        now.getDate()
      ).padStart(
        2,
        "0"
      );

    const hh =
      String(
        now.getHours()
      ).padStart(
        2,
        "0"
      );

    const min =
      String(
        now.getMinutes()
      ).padStart(
        2,
        "0"
      );

    const sec =
      String(
        now.getSeconds()
      ).padStart(
        2,
        "0"
      );

    const random =
      Math.floor(
        Math.random() *
          900 +
          100
      );

    return (
      `XK-${yyyy}${mm}${dd}-` +
      `${hh}${min}${sec}-${random}`
    );
  };

/* =========================================================
   BUILD NOTE
========================================================= */

const buildExportNote = (
  exportCode: string,
  exportedBy: string,
  channelNote: string | null,
  invoiceCode: string | null
) => {
  const parts = [
    `Phiếu xuất: ${exportCode}`,
    `Người xuất: ${exportedBy}`,
  ];

  if (invoiceCode) {
    parts.push(
      `Báo giá: ${invoiceCode}`
    );
  }

  if (channelNote) {
    parts.push(
      `Kênh/Ghi chú: ${channelNote}`
    );
  }

  return parts.join(" | ");
};

/* =========================================================
   NORMALIZE ITEMS
========================================================= */

type NormalizedItem = {
  variant_id: number;
  quantity: number;
};

const normalizeItems = (
  rawItems: unknown
): NormalizedItem[] => {
  if (
    !Array.isArray(
      rawItems
    )
  ) {
    throw new Error(
      "Danh sách sản phẩm xuất kho không hợp lệ"
    );
  }

  /*
   * Nếu frontend gửi trùng cùng variant nhiều lần
   * backend tự cộng lại.
   */
  const map =
    new Map<
      number,
      number
    >();

  for (
    const rawItem of rawItems
  ) {
    if (
      !rawItem ||
      typeof rawItem !==
        "object"
    ) {
      continue;
    }

    const item =
      rawItem as {
        variant_id?: unknown;
        quantity?: unknown;
      };

    const variantId =
      Number(
        item.variant_id
      );

    const quantity =
      Number(
        item.quantity
      );

    if (
      !Number.isInteger(
        variantId
      ) ||
      variantId <= 0
    ) {
      throw new Error(
        "Có sản phẩm không hợp lệ"
      );
    }

    if (
      !Number.isInteger(
        quantity
      ) ||
      quantity <= 0
    ) {
      throw new Error(
        "Số lượng xuất phải là số nguyên lớn hơn 0"
      );
    }

    map.set(
      variantId,
      (map.get(
        variantId
      ) || 0) +
        quantity
    );
  }

  const result =
    Array.from(
      map.entries()
    ).map(
      ([
        variant_id,
        quantity,
      ]) => ({
        variant_id,
        quantity,
      })
    );

  if (
    result.length === 0
  ) {
    throw new Error(
      "Chưa có sản phẩm nào để xuất kho"
    );
  }

  return result;
};

/* =========================================================
   SERIALIZABLE TRANSACTION RETRY
========================================================= */

async function runStockTransaction<
  T
>(
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
      /*
       * P2034:
       * transaction conflict /
       * deadlock
       */
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
    "Không thể hoàn tất giao dịch xuất kho"
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
    selling_price:
      Prisma.Decimal;
    current_quantity: number;
    min_stock_quantity: number;
    image_url:
      | string
      | null;

    product: {
      id: number;
      product_code: string;
      product_name: string;

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

  image_url:
    variant.image_url,

  purchase_price:
    variant.purchase_price.toString(),

  selling_price:
    variant.selling_price.toString(),

  current_quantity:
    variant.current_quantity,

  min_stock_quantity:
    variant.min_stock_quantity,

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
    .join(
      " - "
    ),
});

/* =========================================================
   CONTROLLER
========================================================= */

class ExportStockController {
  /* =======================================================
     BOOTSTRAP

     GET /export-stock/bootstrap

     Trả toàn bộ:
     Group
       Product
         Variant
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

              orderBy: {
                product_name:
                  "asc",
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
            },
          },

          orderBy: {
            group_name:
              "asc",
          },
        });

      const data =
        groups.map(
          (group) => ({
            id:
              group.id,

            group_code:
              group.group_code,

            group_name:
              group.group_name,

            description:
              group.description,

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

                  description:
                    product.description,

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

                        selling_price:
                          variant.selling_price.toString(),

                        current_quantity:
                          variant.current_quantity,

                        min_stock_quantity:
                          variant.min_stock_quantity,

                        image_url:
                          variant.image_url,
                      })
                    ),
                })
              ),
          })
        );

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
     SEARCH

     GET /export-stock/search?q=...
     
     Tìm theo:
     - tên sản phẩm
     - product_code
     - SKU variant_code
     - barcode
     - size
  ======================================================= */
  async invoiceQuotes(
  req: Request,
  res: Response
) {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const status =
      typeof req.query.status === "string"
        ? req.query.status.trim()
        : "";

    const where: Prisma.InvoiceWhereInput = {
      status: "completed",
    };

    if (
      status === "processed" ||
      status === "not_processed"
    ) {
      where.warehouse_status =
        status;
    }

    if (search) {
      where.OR = [
        {
          invoice_code: {
            contains: search,
          },
        },

        {
          order_code: {
            contains: search,
          },
        },

        {
          customer: {
            is: {
              customer_name: {
                contains: search,
              },
            },
          },
        },

        {
          customer: {
            is: {
              phone: {
                contains: search,
              },
            },
          },
        },
      ];
    }

    const invoices =
      await prisma.invoice.findMany({
        where,

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

        orderBy: [
          {
            invoice_date: "desc",
          },

          {
            id: "desc",
          },
        ],

        take: 200,
      });

    return res.json({
      success: true,

      data: invoices.map(
        (invoice) => ({
          id: invoice.id,

          invoice_code:
            invoice.invoice_code,

          invoice_date:
            invoice.invoice_date,

          channel:
            invoice.channel,

          order_code:
            invoice.order_code,

          warehouse_status:
            invoice.warehouse_status,

          total_amount:
            invoice.total_amount.toString(),

          brand:
            invoice.brand,

          customer:
            invoice.customer,

          items:
            invoice.items.map(
              (item) => ({
                id:
                  item.id,

                variant_id:
                  item.variant_id,

                quantity:
                  item.quantity,

                unit_price:
                  item.unit_price.toString(),

                total_price:
                  item.total_price.toString(),

                variant: {
                  id:
                    item.variant.id,

                  variant_code:
                    item.variant.variant_code,

                  barcode:
                    item.variant.barcode,

                  size:
                    item.variant.size,

                  current_quantity:
                    item.variant.current_quantity,

                  purchase_price:
                    item.variant.purchase_price.toString(),

                  product_name:
                    item.variant.product.product_name,

                  group_name:
                    item.variant.product.group.group_name,
                },
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

          orderBy: [
            {
              product: {
                product_name:
                  "asc",
              },
            },

            {
              variant_code:
                "asc",
            },
          ],

          take:
            100,
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
     SCAN BARCODE / SKU

     GET /export-stock/scan?code=NDS15

     Frontend:
     mỗi lần Enter / scan
     gọi endpoint này.
     
     Nếu trả success:
     frontend +1 vào số lượng local.
  ======================================================= */

  async scan(
    req: Request,
    res: Response
  ) {
    try {
      const code =
        typeof req.query.code ===
          "string"
          ? req.query.code.trim()
          : "";

      if (!code) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Vui lòng quét barcode hoặc nhập SKU",
          });
      }

      const variant =
        await prisma.productVariant.findFirst({
          where: {
            status:
              "active",

            OR: [
              {
                barcode:
                  code,
              },

              {
                variant_code:
                  code,
              },
            ],

            product: {
              status:
                "active",
            },
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
        return res
          .status(404)
          .json({
            success: false,

            message:
              `Không tìm thấy barcode/SKU: ${code}`,
          });
      }

      if (
        variant.current_quantity <=
        0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              `${variant.product.product_name} ${variant.size || ""} hiện đã hết hàng`,
          });
      }

      return res.json({
        success: true,

        message:
          "Quét hợp lệ",

        data:
          mapVariant(
            variant
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
     COMMIT EXPORT

     POST /export-stock/commit

     BODY:
     {
       "export_date": "2026-08-30",
       "exported_by": "Nguyễn Văn A",
       "channel_note": "Shopee cuối ngày",
       "items": [
         {
           "variant_id": 1,
           "quantity": 3
         }
       ]
     }

     Đây mới là API thật sự trừ tồn kho.
  ======================================================= */

  async commit(
    req: Request,
    res: Response
  ) {
    try {
      const {
        export_date,
        exported_by,
        channel_note,
        source_invoice_id,
        items,
      } = req.body ?? {};

      if (
        typeof exported_by !== "string" ||
        !exported_by.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Vui lòng nhập người xuất kho",
        });
      }

      const normalizedItems =
        normalizeItems(items);

      const exportDate =
        parseExportDate(
          export_date
        );

      const exporter =
        exported_by.trim();

      const channelNote =
        typeof channel_note === "string" &&
        channel_note.trim()
          ? channel_note.trim()
          : null;

      const exportCode =
        generateExportCode();

      let sourceInvoiceId:
        number | null = null;

      if (
        source_invoice_id !== undefined &&
        source_invoice_id !== null &&
        source_invoice_id !== ""
      ) {
        const parsedId =
          Number(source_invoice_id);

        if (
          !Number.isInteger(parsedId) ||
          parsedId <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Báo giá/hóa đơn nguồn không hợp lệ",
          });
        }

        sourceInvoiceId =
          parsedId;
      }

      const result =
        await runStockTransaction(
          async (
            tx
          ) => {
            let sourceInvoice:
              | {
                  id: number;
                  invoice_code: string;
                  warehouse_status: string;
                  items: {
                    variant_id: number;
                    quantity: number;
                  }[];
                }
              | null = null;

            if (
              sourceInvoiceId
            ) {
              sourceInvoice =
                await tx.invoice.findUnique({
                  where: {
                    id:
                      sourceInvoiceId,
                  },

                  select: {
                    id:
                      true,

                    invoice_code:
                      true,

                    warehouse_status:
                      true,

                    items: {
                      select: {
                        variant_id:
                          true,

                        quantity:
                          true,
                      },
                    },
                  },
                });

              if (
                !sourceInvoice
              ) {
                throw new Error(
                  "Không tìm thấy báo giá/hóa đơn nguồn"
                );
              }

              if (
                sourceInvoice.warehouse_status ===
                "processed"
              ) {
                throw new Error(
                  `Báo giá ${sourceInvoice.invoice_code} đã được xuất kho trước đó`
                );
              }

              /*
               * Khi xuất từ báo giá:
               * số lượng xuất phải khớp đúng số lượng trên báo giá.
               */
              const invoiceQtyMap =
                new Map<
                  number,
                  number
                >();

              for (
                const item of
                sourceInvoice.items
              ) {
                invoiceQtyMap.set(
                  item.variant_id,
                  (
                    invoiceQtyMap.get(
                      item.variant_id
                    ) || 0
                  ) +
                    item.quantity
                );
              }

              const exportQtyMap =
                new Map<
                  number,
                  number
                >();

              for (
                const item of
                normalizedItems
              ) {
                exportQtyMap.set(
                  item.variant_id,
                  (
                    exportQtyMap.get(
                      item.variant_id
                    ) || 0
                  ) +
                    item.quantity
                );
              }

              if (
                invoiceQtyMap.size !==
                exportQtyMap.size
              ) {
                throw new Error(
                  "Danh sách sản phẩm xuất không khớp với báo giá"
                );
              }

              for (
                const [
                  variantId,
                  invoiceQuantity,
                ] of
                invoiceQtyMap.entries()
              ) {
                const exportQuantity =
                  exportQtyMap.get(
                    variantId
                  );

                if (
                  exportQuantity !==
                  invoiceQuantity
                ) {
                  throw new Error(
                    `Số lượng xuất không khớp báo giá tại sản phẩm ID ${variantId}`
                  );
                }
              }
            }

            /*
             * Note được tạo bên trong transaction để lấy được mã báo giá.
             */
            const note =
              buildExportNote(
                exportCode,
                exporter,
                channelNote,
                sourceInvoice?.invoice_code ??
                  null
              );

            /*
             * Đọc lại tồn kho ngay trong transaction.
             */
            const variants =
              await tx.productVariant.findMany({
                where: {
                  id: {
                    in:
                      normalizedItems.map(
                        (
                          item
                        ) =>
                          item.variant_id
                      ),
                  },
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

            if (
              variants.length !==
              normalizedItems.length
            ) {
              throw new Error(
                "Có sản phẩm không tồn tại trong hệ thống"
              );
            }

            const variantMap =
              new Map(
                variants.map(
                  (
                    variant
                  ) => [
                    variant.id,
                    variant,
                  ]
                )
              );

            let totalQuantity =
              0;

            let totalCost =
              new Prisma.Decimal(
                0
              );

            const exportedItems: {
              variant_id: number;
              variant_code: string;
              barcode:
                | string
                | null;
              product_name: string;
              size:
                | string
                | null;
              quantity: number;
              quantity_before: number;
              quantity_after: number;
              unit_cost: string;
              total_cost: string;
            }[] = [];

            for (
              const item of
              normalizedItems
            ) {
              const variant =
                variantMap.get(
                  item.variant_id
                );

              if (
                !variant
              ) {
                throw new Error(
                  `Không tìm thấy sản phẩm ID ${item.variant_id}`
                );
              }

              if (
                variant.status !==
                  "active" ||
                variant.product.status !==
                  "active"
              ) {
                throw new Error(
                  `${variant.product.product_name} đã ngừng hoạt động`
                );
              }

              if (
                item.quantity >
                variant.current_quantity
              ) {
                throw new Error(
                  `${variant.product.product_name} ${variant.size || ""}: yêu cầu xuất ${item.quantity}, nhưng tồn chỉ còn ${variant.current_quantity}`
                );
              }

              const before =
                variant.current_quantity;

              const after =
                before -
                item.quantity;

              /*
               * Snapshot giá vốn tại thời điểm xuất.
               */
              const unitCost =
                variant.purchase_price;

              const itemCost =
                unitCost.mul(
                  item.quantity
                );

              /*
               * Trừ tồn theo điều kiện atomic,
               * không cho tồn âm.
               */
              const updated =
                await tx.productVariant.updateMany({
                  where: {
                    id:
                      variant.id,

                    current_quantity: {
                      gte:
                        item.quantity,
                    },
                  },

                  data: {
                    current_quantity: {
                      decrement:
                        item.quantity,
                    },
                  },
                });

              if (
                updated.count !==
                1
              ) {
                throw new Error(
                  `${variant.product.product_name} vừa thay đổi tồn kho. Vui lòng tải lại và thử lại.`
                );
              }

              /*
               * Lưu lịch sử xuất + giá vốn.
               */
              await tx.inventoryTransaction.create({
                data: {
                  variant_id:
                    variant.id,

                  transaction_type:
                    EXPORT_TRANSACTION_TYPE,

                  quantity:
                    item.quantity,

                  quantity_before:
                    before,

                  quantity_after:
                    after,

                  unit_price:
                    unitCost,

                  total_value:
                    itemCost,

                  note,

                  created_at:
                    exportDate,
                },
              });

              totalQuantity +=
                item.quantity;

              totalCost =
                totalCost.plus(
                  itemCost
                );

              exportedItems.push({
                variant_id:
                  variant.id,

                variant_code:
                  variant.variant_code,

                barcode:
                  variant.barcode,

                product_name:
                  variant.product.product_name,

                size:
                  variant.size,

                quantity:
                  item.quantity,

                quantity_before:
                  before,

                quantity_after:
                  after,

                unit_cost:
                  unitCost.toString(),

                total_cost:
                  itemCost.toString(),
              });
            }

            /*
             * Chỉ đánh dấu đã xử lý sau khi toàn bộ
             * sản phẩm đã trừ kho thành công.
             */
            if (
              sourceInvoice
            ) {
              const statusUpdate =
                await tx.invoice.updateMany({
                  where: {
                    id:
                      sourceInvoice.id,

                    warehouse_status:
                      "not_processed",
                  },

                  data: {
                    warehouse_status:
                      "processed",
                  },
                });

              if (
                statusUpdate.count !==
                1
              ) {
                throw new Error(
                  `Báo giá ${sourceInvoice.invoice_code} đã được xử lý bởi thao tác khác`
                );
              }
            }

            return {
              export_code:
                exportCode,

              export_date:
                exportDate,

              exported_by:
                exporter,

              channel_note:
                channelNote,

              source_invoice_id:
                sourceInvoice?.id ??
                null,

              source_invoice_code:
                sourceInvoice
                  ?.invoice_code ??
                null,

              total_items:
                exportedItems.length,

              total_quantity:
                totalQuantity,

              total_cost:
                totalCost.toString(),

              items:
                exportedItems,
            };
          }
        );

      return res
        .status(201)
        .json({
          success: true,

          message:
            result.source_invoice_code
              ? `Đã xuất kho báo giá ${result.source_invoice_code} - ${result.total_quantity} sản phẩm`
              : `Đã xuất kho ${result.total_quantity} sản phẩm`,

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
     EXPORT HISTORY

     GET /export-stock/history
     GET /export-stock/history?from=2026-08-01&to=2026-08-31

     Phục vụ báo cáo giá vốn.
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

      const where:
        Prisma.InventoryTransactionWhereInput =
        {
          transaction_type:
            EXPORT_TRANSACTION_TYPE,
        };

      if (
        from ||
        to
      ) {
        const createdAt: Prisma.DateTimeFilter =
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

      let totalQuantity =
        0;

      let totalCost =
        new Prisma.Decimal(
          0
        );

      const data =
        rows.map(
          (
            row
          ) => {
            totalQuantity +=
              row.quantity;

            if (
              row.total_value
            ) {
              totalCost =
                totalCost.plus(
                  row.total_value
                );
            }

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

              total_cost:
                row.total_value?.toString() ||
                "0",

              note:
                row.note,

              created_at:
                row.created_at,

              variant: {
                id:
                  row.variant.id,

                variant_code:
                  row.variant.variant_code,

                barcode:
                  row.variant.barcode,

                size:
                  row.variant.size,

                product_name:
                  row.variant.product.product_name,

                group_name:
                  row.variant.product.group.group_name,
              },
            };
          }
        );

      return res.json({
        success: true,

        data,

        summary: {
          total_transactions:
            data.length,

          total_quantity:
            totalQuantity,

          total_cost:
            totalCost.toString(),
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
}

export default new ExportStockController();