import {
  Request,
  Response,
} from "express";

import {
  Prisma,
} from "@prisma/client";

import prisma from "../lib/prisma";

/* =========================================================
   HELPERS
========================================================= */

const ZERO =
  new Prisma.Decimal(0);

const sendError = (
  res: Response,
  error: unknown,
  status = 500
) => {
  console.error(
    "REPORT ERROR:",
    error
  );

  return res
    .status(status)
    .json({
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Không thể tải báo cáo",
    });
};

const textQuery = (
  value: unknown
) => {
  return typeof value === "string"
    ? value.trim()
    : "";
};

const vnStart = (
  date: string
) =>
  new Date(
    `${date}T00:00:00+07:00`
  );

const vnEnd = (
  date: string
) =>
  new Date(
    `${date}T23:59:59.999+07:00`
  );

const formatDateOnly = (
  date: Date
) => {
  const yyyy =
    date.getFullYear();

  const mm =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const dd =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
};

/* =========================================================
   PERIOD
========================================================= */

const resolvePeriod = (
  req: Request
) => {
  const period =
    textQuery(
      req.query.period
    ) || "month";

  const value =
    textQuery(
      req.query.value
    );

  const fromQuery =
    textQuery(
      req.query.from
    );

  const toQuery =
    textQuery(
      req.query.to
    );

  if (
    period === "custom" &&
    fromQuery &&
    toQuery
  ) {
    return {
      from:
        vnStart(
          fromQuery
        ),

      to:
        vnEnd(
          toQuery
        ),
    };
  }

  const now =
    new Date();

  /* DAY */

  if (
    period === "day"
  ) {
    const date =
      /^\d{4}-\d{2}-\d{2}$/.test(
        value
      )
        ? value
        : formatDateOnly(
            now
          );

    return {
      from:
        vnStart(
          date
        ),

      to:
        vnEnd(
          date
        ),
    };
  }

  /* YEAR */

  if (
    period === "year"
  ) {
    const year =
      /^\d{4}$/.test(
        value
      )
        ? Number(value)
        : now.getFullYear();

    return {
      from:
        new Date(
          `${year}-01-01T00:00:00+07:00`
        ),

      to:
        new Date(
          `${year}-12-31T23:59:59.999+07:00`
        ),
    };
  }

  /* WEEK */

  if (
    period === "week"
  ) {
    const selected =
      /^\d{4}-\d{2}-\d{2}$/.test(
        value
      )
        ? vnStart(
            value
          )
        : now;

    const start =
      new Date(
        selected
      );

    const day =
      start.getDay();

    const diff =
      day === 0
        ? -6
        : 1 - day;

    start.setDate(
      start.getDate() +
        diff
    );

    const end =
      new Date(
        start
      );

    end.setDate(
      end.getDate() +
        6
    );

    return {
      from:
        vnStart(
          formatDateOnly(
            start
          )
        ),

      to:
        vnEnd(
          formatDateOnly(
            end
          )
        ),
    };
  }

  /* MONTH */

    /* MONTH */

  let year =
    now.getFullYear();

  let month =
    now.getMonth() + 1;

  if (
    /^\d{4}-\d{2}$/.test(
      value
    )
  ) {
    const [
      yearText = "",
      monthText = "",
    ] =
      value.split("-");

    const parsedYear =
      Number(
        yearText
      );

    const parsedMonth =
      Number(
        monthText
      );

    if (
      Number.isFinite(
        parsedYear
      ) &&
      Number.isFinite(
        parsedMonth
      ) &&
      parsedMonth >= 1 &&
      parsedMonth <= 12
    ) {
      year =
        parsedYear;

      month =
        parsedMonth;
    }
  }

  const from =
    new Date(
      `${year}-${String(
        month
      ).padStart(
        2,
        "0"
      )}-01T00:00:00+07:00`
    );

  const nextYear =
    month === 12
      ? year + 1
      : year;

  const nextMonth =
    month === 12
      ? 1
      : month + 1;

  const next =
    new Date(
      `${nextYear}-${String(
        nextMonth
      ).padStart(
        2,
        "0"
      )}-01T00:00:00+07:00`
    );

  return {
    from,

    to:
      new Date(
        next.getTime() - 1
      ),
  };
};

/* =========================================================
   EXPORT CODE FROM NOTE
========================================================= */

const exportCodeFromNote = (
  note: string | null
) => {
  if (!note) {
    return null;
  }

  return (
    note.match(
      /Phiếu xuất:\s*([^|]+)/i
    )?.[1]?.trim() ||
    null
  );
};

/* =========================================================
   OVERVIEW
========================================================= */

class ReportController {
  async overview(
    req: Request,
    res: Response
  ) {
    try {
      const {
        from,
        to,
      } =
        resolvePeriod(
          req
        );

      const sixtyDaysAgo =
        new Date();

      sixtyDaysAgo.setDate(
        sixtyDaysAgo.getDate() -
          60
      );

      /* ===================================================
         PRODUCTS
      =================================================== */

      const variants =
        await prisma.productVariant.findMany({
          where: {
            status:
              "active",

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
        });

      const productIds =
        new Set<number>();

      let inventoryQuantity =
        0;

      let inventoryValue =
        ZERO;

      let needRestock =
        0;

      for (
        const variant of
        variants
      ) {
        productIds.add(
          variant.product_id
        );

        inventoryQuantity +=
          variant.current_quantity;

        inventoryValue =
          inventoryValue.plus(
            variant.purchase_price.mul(
              variant.current_quantity
            )
          );

        if (
          variant.current_quantity <=
          variant.min_stock_quantity
        ) {
          needRestock +=
            1;
        }
      }

      /* ===================================================
         SUPPLIER DEBT
      =================================================== */

      const debtRows =
        await prisma.supplierDebt.findMany({
          orderBy: [
            {
              transaction_date:
                "desc",
            },

            {
              id:
                "desc",
            },
          ],

          select: {
            supplier_id:
              true,

            balance_after:
              true,
          },
        });

      const supplierSeen =
        new Set<number>();

      let supplierDebt =
        ZERO;

      for (
        const row of
        debtRows
      ) {
        if (
          supplierSeen.has(
            row.supplier_id
          )
        ) {
          continue;
        }

        supplierSeen.add(
          row.supplier_id
        );

        supplierDebt =
          supplierDebt.plus(
            row.balance_after
          );
      }

      /* ===================================================
         FINANCE
      =================================================== */

      const [
        receiptSummary,
        expenseSummary,
        exportSummary,
        lossSummary,
      ] =
        await Promise.all([
          prisma.receipt.aggregate({
            where: {
              created_at: {
                gte:
                  from,

                lte:
                  to,
              },
            },

            _sum: {
              amount:
                true,
            },
          }),

          prisma.expense.aggregate({
            where: {
              created_at: {
                gte:
                  from,

                lte:
                  to,
              },
            },

            _sum: {
              amount:
                true,
            },
          }),

          prisma.inventoryTransaction.aggregate({
            where: {
              transaction_type:
                "EXPORT",

              created_at: {
                gte:
                  from,

                lte:
                  to,
              },
            },

            _sum: {
              total_value:
                true,

              quantity:
                true,
            },
          }),

          prisma.inventoryTransaction.aggregate({
            where: {
              transaction_type:
                "LOSS",

              created_at: {
                gte:
                  from,

                lte:
                  to,
              },
            },

            _sum: {
              total_value:
                true,

              quantity:
                true,
            },
          }),
        ]);

      const receipts =
        receiptSummary._sum.amount ??
        ZERO;

      const expenses =
        expenseSummary._sum.amount ??
        ZERO;

      const exportCost =
        exportSummary._sum.total_value ??
        ZERO;

      const lossValue =
        lossSummary._sum.total_value ??
        ZERO;

      const profit =
        receipts
          .minus(
            exportCost
          )
          .minus(
            expenses
          )
          .minus(
            lossValue
          );

      /* ===================================================
         INVENTORY VALUE BY PRODUCT
      =================================================== */

      const inventoryByProductMap =
        new Map<
          number,
          {
            product_id: number;
            product_name: string;
            value: Prisma.Decimal;
            quantity: number;
          }
        >();

      for (
        const variant of
        variants
      ) {
        const current =
          inventoryByProductMap.get(
            variant.product_id
          ) || {
            product_id:
              variant.product_id,

            product_name:
              variant.product.product_name,

            value:
              ZERO,

            quantity:
              0,
          };

        current.quantity +=
          variant.current_quantity;

        current.value =
          current.value.plus(
            variant.purchase_price.mul(
              variant.current_quantity
            )
          );

        inventoryByProductMap.set(
          variant.product_id,
          current
        );
      }

      const inventoryByProduct =
        Array.from(
          inventoryByProductMap.values()
        )
          .sort(
            (a, b) =>
              Number(
                b.value
              ) -
              Number(
                a.value
              )
          )
          .slice(
            0,
            12
          )
          .map(
            (
              row
            ) => ({
              product_id:
                row.product_id,

              product_name:
                row.product_name,

              quantity:
                row.quantity,

              inventory_value:
                row.value.toString(),
            })
          );

      /* ===================================================
         TOP EXPORT
      =================================================== */

      const exportedRows =
        await prisma.inventoryTransaction.groupBy({
          by: [
            "variant_id",
          ],

          where: {
            transaction_type:
              "EXPORT",

            created_at: {
              gte:
                from,

              lte:
                to,
            },
          },

          _sum: {
            quantity:
              true,

            total_value:
              true,
          },

          orderBy: {
            _sum: {
              quantity:
                "desc",
            },
          },

          take:
            8,
        });

      const topVariantIds =
        exportedRows.map(
          (
            row
          ) =>
            row.variant_id
        );

      const topVariants =
        topVariantIds.length
          ? await prisma.productVariant.findMany({
              where: {
                id: {
                  in:
                    topVariantIds,
                },
              },

              include: {
                product:
                  true,
              },
            })
          : [];

      const topVariantMap =
        new Map(
          topVariants.map(
            (
              variant
            ) => [
              variant.id,
              variant,
            ]
          )
        );

      const topExports =
        exportedRows.map(
          (
            row
          ) => {
            const variant =
              topVariantMap.get(
                row.variant_id
              );

            return {
              variant_id:
                row.variant_id,

              product_name:
                variant
                  ?.product
                  .product_name ||
                "",

              size:
                variant?.size ||
                "",

              sku:
                variant
                  ?.variant_code ||
                "",

              quantity:
                row._sum.quantity ||
                0,

              cost:
                row._sum.total_value?.toString() ||
                "0",
            };
          }
        );

      /* ===================================================
         ALERTS
      =================================================== */

      const alerts =
        variants
          .filter(
            (
              variant
            ) =>
              variant.current_quantity <=
              variant.min_stock_quantity
          )
          .sort(
            (a, b) =>
              a.current_quantity -
              b.current_quantity
          )
          .slice(
            0,
            20
          )
          .map(
            (
              variant
            ) => ({
              variant_id:
                variant.id,

              group_name:
                variant.product.group.group_name,

              product_name:
                variant.product.product_name,

              size:
                variant.size,

              sku:
                variant.variant_code,

              current_quantity:
                variant.current_quantity,

              min_stock_quantity:
                variant.min_stock_quantity,

              status:
                variant.current_quantity <=
                0
                  ? "out"
                  : "low",
            })
          );

      /* ===================================================
         RECENT TRANSACTIONS
      =================================================== */

      const recent =
        await prisma.inventoryTransaction.findMany({
          include: {
            variant: {
              include: {
                product:
                  true,
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
            10,
        });

      const recentTransactions =
        recent.map(
          (
            row
          ) => ({
            id:
              row.id,

            type:
              row.transaction_type,

            quantity:
              row.quantity,

            delta:
              row.quantity_after -
              row.quantity_before,

            product_name:
              row.variant.product.product_name,

            size:
              row.variant.size,

            sku:
              row.variant.variant_code,

            created_at:
              row.created_at,
          })
        );

      /* ===================================================
         SAFE STOCK
      =================================================== */

      const safeVariants =
        variants.filter(
          (
            variant
          ) =>
            variant.current_quantity >
            variant.min_stock_quantity
        ).length;

      const safeStockPercent =
        variants.length
          ? Math.round(
              (
                safeVariants /
                variants.length
              ) *
                100
            )
          : 0;

      /* ===================================================
         LONG STOCK
      =================================================== */

      const exportedLast60Days =
        await prisma.inventoryTransaction.findMany({
          where: {
            transaction_type:
              "EXPORT",

            created_at: {
              gte:
                sixtyDaysAgo,
            },
          },

          select: {
            variant_id:
              true,
          },

          distinct: [
            "variant_id",
          ],
        });

      const recentlySoldIds =
        new Set(
          exportedLast60Days.map(
            (
              row
            ) =>
              row.variant_id
          )
        );

      let longStockValue =
        ZERO;

      let longStockVariants =
        0;

      for (
        const variant of
        variants
      ) {
        if (
          variant.current_quantity >
            0 &&
          !recentlySoldIds.has(
            variant.id
          )
        ) {
          longStockVariants +=
            1;

          longStockValue =
            longStockValue.plus(
              variant.purchase_price.mul(
                variant.current_quantity
              )
            );
        }
      }

      /* ===================================================
         NUMBER OF RECEIPTS
      =================================================== */

      const importReceiptCount =
        await prisma.importReceipt.count({
          where: {
            import_date: {
              gte:
                from,

              lte:
                to,
            },
          },
        });

      const exportTransactions =
        await prisma.inventoryTransaction.findMany({
          where: {
            transaction_type:
              "EXPORT",

            created_at: {
              gte:
                from,

              lte:
                to,
            },
          },

          select: {
            note:
              true,
          },
        });

      const exportCodes =
        new Set<string>();

      for (
        const row of
        exportTransactions
      ) {
        const code =
          exportCodeFromNote(
            row.note
          );

        if (code) {
          exportCodes.add(
            code
          );
        }
      }

      const exportReceiptCount =
        exportCodes.size ||
        exportTransactions.length;

      /* ===================================================
         STOCK ROWS FOR OVERVIEW PRINT
      =================================================== */

      const stockRows =
        variants.map(
          (variant) => {
            const stock =
              Number(
                variant.current_quantity ||
                  0
              );

            const minStock =
              Number(
                variant.min_stock_quantity ||
                  0
              );

            const purchasePrice =
              variant.purchase_price;

            const rowInventoryValue =
              purchasePrice.mul(
                stock
              );

            let statusLabel =
              "An toàn";

            if (stock <= 0) {
              statusLabel =
                "Hết hàng";
            } else if (
              stock <= minStock
            ) {
              statusLabel =
                "Sắp hết";
            }

            return {
              variant_id:
                variant.id,

              group_name:
                variant.product
                  .group
                  .group_name,

              product_name:
                variant.product
                  .product_name,

              size:
                variant.size ||
                "",

              sku:
                variant.variant_code ||
                "",

              barcode:
                variant.barcode ||
                "",

              current_quantity:
                stock,

              min_stock:
                minStock,

              purchase_price:
                purchasePrice.toString(),

              inventory_value:
                rowInventoryValue.toString(),

              status_label:
                statusLabel,
            };
          }
        );
      return res.json({
        success: true,

        
        data: {
          period: {
            from,
            to,
          },

          inventory: {
            inventory_value:
              inventoryValue.toString(),

            inventory_quantity:
              inventoryQuantity,

            root_products:
              productIds.size,

            variants:
              variants.length,

            need_restock:
              needRestock,

            supplier_debt:
              supplierDebt.toString(),

            safe_stock_percent:
              safeStockPercent,

            long_stock_value:
              longStockValue.toString(),

            long_stock_variants:
              longStockVariants,

            receipt_count:
              importReceiptCount +
              exportReceiptCount,

            import_receipt_count:
              importReceiptCount,

            export_receipt_count:
              exportReceiptCount,
          },

          finance: {
            actual_receipt:
              receipts.toString(),

            export_cost:
              exportCost.toString(),

            operating_expense:
              expenses.toString(),

            loss_value:
              lossValue.toString(),

            profit:
              profit.toString(),
          },

          inventory_by_product:
            inventoryByProduct,

          top_exports:
            topExports,

          alerts,

          recent_transactions:
            recentTransactions,

          stock_rows:
            stockRows,
        },
      });
    } catch (error) {
      return sendError(
        res,
        error
      );
    }
  }

  /* =======================================================
     STOCK REPORT
  ======================================================= */

  async stockReport(
    req: Request,
    res: Response
  ) {
    try {
      const fromText =
        textQuery(
          req.query.from
        );

      const toText =
        textQuery(
          req.query.to
        );

      if (
        !fromText ||
        !toText
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Vui lòng chọn từ ngày và đến ngày",
          });
      }

      const from =
        vnStart(
          fromText
        );

      const to =
        vnEnd(
          toText
        );

      const variants =
        await prisma.productVariant.findMany({
          where: {
            status:
              "active",
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
        });

      const transactions =
        await prisma.inventoryTransaction.findMany({
          where: {
            created_at: {
              gte:
                from,
            },
          },

          select: {
            variant_id:
              true,

            transaction_type:
              true,

            quantity:
              true,

            quantity_before:
              true,

            quantity_after:
              true,

            created_at:
              true,
          },
        });

      type Movement = {
        periodDelta: number;
        afterDelta: number;
        imported: number;
        exported: number;
        adjustment: number;
      };

      const movementMap =
        new Map<
          number,
          Movement
        >();

      for (
        const tx of
        transactions
      ) {
        const current =
          movementMap.get(
            tx.variant_id
          ) || {
            periodDelta:
              0,

            afterDelta:
              0,

            imported:
              0,

            exported:
              0,

            adjustment:
              0,
          };

        const delta =
          tx.quantity_after -
          tx.quantity_before;

        if (
          tx.created_at >
          to
        ) {
          current.afterDelta +=
            delta;
        } else {
          current.periodDelta +=
            delta;

          if (
            tx.transaction_type ===
              "IMPORT" ||
            tx.transaction_type ===
              "CUSTOMER_RETURN_RESALE"
          ) {
            current.imported +=
              Math.max(
                0,
                delta
              );
          } else if (
            tx.transaction_type ===
              "EXPORT" ||
            tx.transaction_type ===
              "LOSS"
          ) {
            current.exported +=
              Math.abs(
                Math.min(
                  0,
                  delta
                )
              );
          } else {
            current.adjustment +=
              delta;
          }
        }

        movementMap.set(
          tx.variant_id,
          current
        );
      }

      let totalOpening =
        0;

      let totalImport =
        0;

      let totalExport =
        0;

      let totalAdjustment =
        0;

      let totalClosing =
        0;

      let totalValue =
        ZERO;

      const rows =
        variants.map(
          (
            variant
          ) => {
            const move =
              movementMap.get(
                variant.id
              ) || {
                periodDelta:
                  0,

                afterDelta:
                  0,

                imported:
                  0,

                exported:
                  0,

                adjustment:
                  0,
              };

            /*
             * Tồn cuối lịch sử:
             * tồn hiện tại - biến động sau ngày báo cáo
             */
            const closing =
              variant.current_quantity -
              move.afterDelta;

            /*
             * Tồn đầu:
             * tồn cuối - biến động trong kỳ
             */
            const opening =
              closing -
              move.periodDelta;

            const value =
              variant.purchase_price.mul(
                closing
              );

            totalOpening +=
              opening;

            totalImport +=
              move.imported;

            totalExport +=
              move.exported;

            totalAdjustment +=
              move.adjustment;

            totalClosing +=
              closing;

            totalValue =
              totalValue.plus(
                value
              );

            return {
              variant_id:
                variant.id,

              group_name:
                variant.product.group.group_name,

              product_name:
                variant.product.product_name,

              size:
                variant.size,

              sku:
                variant.variant_code,

              barcode:
                variant.barcode,

              opening_quantity:
                opening,

              import_quantity:
                move.imported,

              export_quantity:
                move.exported,

              adjustment_quantity:
                move.adjustment,

              closing_quantity:
                closing,

              purchase_price:
                variant.purchase_price.toString(),

              inventory_value:
                value.toString(),
            };
          }
        );

      return res.json({
        success: true,

        data: {
          period: {
            from,
            to,
          },

          summary: {
            opening_quantity:
              totalOpening,

            import_quantity:
              totalImport,

            export_quantity:
              totalExport,

            adjustment_quantity:
              totalAdjustment,

            closing_quantity:
              totalClosing,

            inventory_value:
              totalValue.toString(),
          },

          rows,
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

export default new ReportController();