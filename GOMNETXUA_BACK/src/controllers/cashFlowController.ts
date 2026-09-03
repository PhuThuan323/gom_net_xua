import {
  Request,
  Response,
} from "express";


import {
  Prisma,
} from "@prisma/client";

import prisma from "../lib/prisma";


const EXPORT_TYPE =
  "EXPORT";

const LOSS_TYPE =
  "LOSS";

/* =========================================================
   HELPERS
========================================================= */

const sendError = (
  res: Response,
  error: unknown,
  status = 400
) => {
  console.error(
    "CASH FLOW ERROR:",
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

const decimal = (
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
    return new Prisma.Decimal(
      0
    );
  }
};

const nullableText = (
  value: unknown
): string | null => {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const result =
    value.trim();

  return result || null;
};

const parseDate = (
  value: unknown
): Date => {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return new Date();
  }

  /*
   * Frontend input date:
   * YYYY-MM-DD
   */
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return new Date(
      `${value}T12:00:00+07:00`
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
   CODE GENERATOR
========================================================= */

const generateCode = (
  prefix: string
) => {
  const now =
    new Date();

  const y =
    now.getFullYear();

  const m =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const d =
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

  const mm =
    String(
      now.getMinutes()
    ).padStart(
      2,
      "0"
    );

  const ss =
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
    `${prefix}-${y}${m}${d}-` +
    `${hh}${mm}${ss}-${random}`
  );
};

/* =========================================================
   PERIOD
========================================================= */

type DateRange = {
  from: Date;
  to: Date;
};

const startOfDay = (
  date: Date
) => {
  const result =
    new Date(date);

  result.setHours(
    0,
    0,
    0,
    0
  );

  return result;
};

const endOfDay = (
  date: Date
) => {
  const result =
    new Date(date);

  result.setHours(
    23,
    59,
    59,
    999
  );

  return result;
};

const resolveRange = (
  req: Request
): DateRange => {
  const period =
    typeof req.query.period ===
      "string"
      ? req.query.period
      : "month";

  const value =
    typeof req.query.value ===
      "string"
      ? req.query.value
      : "";

  const fromQuery =
    typeof req.query.from ===
      "string"
      ? req.query.from
      : "";

  const toQuery =
    typeof req.query.to ===
      "string"
      ? req.query.to
      : "";

  /* =======================================================
     CUSTOM
  ======================================================= */

  if (
    period === "custom" &&
    fromQuery &&
    toQuery
  ) {
    return {
      from:
        new Date(
          `${fromQuery}T00:00:00+07:00`
        ),

      to:
        new Date(
          `${toQuery}T23:59:59+07:00`
        ),
    };
  }

  const now =
    value
      ? parseDate(
          value
        )
      : new Date();

  /* =======================================================
     DAY
  ======================================================= */

  if (
    period === "day"
  ) {
    return {
      from:
        startOfDay(
          now
        ),

      to:
        endOfDay(
          now
        ),
    };
  }

  /* =======================================================
     WEEK
  ======================================================= */

  if (
    period === "week"
  ) {
    const start =
      new Date(now);

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

    const from =
      startOfDay(
        start
      );

    const end =
      new Date(from);

    end.setDate(
      end.getDate() +
        6
    );

    return {
      from,

      to:
        endOfDay(
          end
        ),
    };
  }

  /* =======================================================
     YEAR
  ======================================================= */

  if (
    period === "year"
  ) {
    const year =
      value &&
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
          `${year}-12-31T23:59:59+07:00`
        ),
    };
  }

  /* =======================================================
     MONTH - DEFAULT
     
     value:
     2026-08
  ======================================================= */

  let year =
    now.getFullYear();

  let month =
    now.getMonth() +
    1;

  if (
    /^\d{4}-\d{2}$/.test(
      value
    )
  ) {
    const [
      y,
      m,
    ] =
      value
        .split("-")
        .map(Number);

    if (
      y &&
      m
    ) {
      year =
        y;

      month =
        m;
    }
  }

  const nextYear =
    month === 12
      ? year + 1
      : year;

  const nextMonth =
    month === 12
      ? 1
      : month + 1;

  const from =
    new Date(
      `${year}-${String(
        month
      ).padStart(
        2,
        "0"
      )}-01T00:00:00+07:00`
    );

  const next =
    new Date(
      `${nextYear}-${String(
        nextMonth
      ).padStart(
        2,
        "0"
      )}-01T00:00:00+07:00`
    );

  const to =
    new Date(
      next.getTime() -
        1
    );

  return {
    from,
    to,
  };
};

/* =========================================================
   CONTROLLER
========================================================= */

class CashFlowController {
  /* =======================================================
     BOOTSTRAP
     
     GET /cash-flow/bootstrap
  ======================================================= */

  async bootstrap(
    req: Request,
    res: Response
  ) {
    try {
      return res.json({
        success: true,

        data: {
          receipt_sources: [
            "TikTok Shop",
            "Shopee",
            "Facebook",
            "Vietnam Post",
            "Shopee Express",
            "Viettel Post",
            "J&T",
            "GHTK",
            "GHN",
            "Best Express",
            "Bán sỉ",
            "Bán lẻ",
            "Chuyển khoản khác",
            "Khác",
          ],

          expense_categories: [
            "Chi nhân viên",
            "Trả tài xế",
            "Tiền nhà / kho",
            "Tiền điện",
            "Tiền nước",
            "Wi-Fi",
            "Vật tư",
            "Vận chuyển",
            "Marketing",
            "Đóng gói",
            "Sửa chữa",
            "Thuế / phí",
            "Khác",
          ],
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
     CREATE RECEIPT
     
     POST /cash-flow/receipts
     
     {
       date: "2026-08-30",
       source: "TikTok Shop",
       statement_amount: 10000000,
       fee_amount: 3000000,
       actual_amount: 7000000,
       period_code: "TK-202608-01",
       note: ""
     }
  ======================================================= */

  async createReceipt(
    req: Request,
    res: Response
  ) {
    try {
      const {
        date,
        source,

        statement_amount,
        fee_amount,
        actual_amount,

        period_code,
        note,
      } =
        req.body ?? {};

      if (
        typeof source !==
          "string" ||
        !source.trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Vui lòng chọn nguồn thu",
          });
      }

      const statement =
        decimal(
          statement_amount
        );

      const fee =
        decimal(
          fee_amount
        );

      /*
       * Nếu frontend không gửi thực nhận,
       * backend tự tính:
       *
       * Thực nhận =
       * Tổng sao kê - Phí
       */
      const actual =
        actual_amount !==
          undefined &&
        actual_amount !==
          null &&
        actual_amount !==
          ""
          ? decimal(
              actual_amount
            )
          : statement.minus(
              fee
            );

      if (
        statement.lessThan(
          0
        )
      ) {
        throw new Error(
          "Tổng sao kê không được âm"
        );
      }

      if (
        fee.lessThan(
          0
        )
      ) {
        throw new Error(
          "Phí không được âm"
        );
      }

      if (
        actual.lessThan(
          0
        )
      ) {
        throw new Error(
          "Thực nhận không được âm"
        );
      }

      const result =
        await prisma.receipt.create({
          data: {
            receipt_code:
              generateCode(
                "THU"
              ),

            category:
              source.trim(),

            statement_amount:
              statement,

            fee_amount:
              fee,

            amount:
              actual,

            period_code:
              nullableText(
                period_code
              ),

            description:
              nullableText(
                note
              ),

            created_at:
              parseDate(
                date
              ),
          },
        });

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Đã lưu khoản thu",

          data: {
            ...result,

            statement_amount:
              result.statement_amount.toString(),

            fee_amount:
              result.fee_amount.toString(),

            amount:
              result.amount.toString(),
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
     CREATE EXPENSE
     
     POST /cash-flow/expenses
  ======================================================= */

  async createExpense(
    req: Request,
    res: Response
  ) {
    try {
      const {
        date,
        category,
        amount,
        recipient,
        note,
      } =
        req.body ?? {};

      if (
        typeof category !==
          "string" ||
        !category.trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Vui lòng chọn nhóm chi",
          });
      }

      const finalAmount =
        decimal(
          amount
        );

      if (
        finalAmount.lessThanOrEqualTo(
          0
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Số tiền chi phải lớn hơn 0",
          });
      }

      const result =
        await prisma.expense.create({
          data: {
            expense_code:
              generateCode(
                "CHI"
              ),

            amount:
              finalAmount,

            category:
              category.trim(),

            recipient:
              nullableText(
                recipient
              ),

            description:
              nullableText(
                note
              ),

            created_at:
              parseDate(
                date
              ),
          },
        });

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Đã lưu khoản chi",

          data: {
            ...result,

            amount:
              result.amount.toString(),
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
     LIST RECEIPTS
  ======================================================= */

  async receipts(
    req: Request,
    res: Response
  ) {
    try {
      const {
        from,
        to,
      } =
        resolveRange(
          req
        );

      const data =
        await prisma.receipt.findMany({
          where: {
            created_at: {
              gte:
                from,

              lte:
                to,
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
        });

      return res.json({
        success: true,

        data:
          data.map(
            (
              row
            ) => ({
              id:
                row.id,

              receipt_code:
                row.receipt_code,

              source:
                row.category,

              statement_amount:
                row.statement_amount.toString(),

              fee_amount:
                row.fee_amount.toString(),

              actual_amount:
                row.amount.toString(),

              period_code:
                row.period_code,

              note:
                row.description,

              created_at:
                row.created_at,
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
     LIST EXPENSES
  ======================================================= */

  async expenses(
    req: Request,
    res: Response
  ) {
    try {
      const {
        from,
        to,
      } =
        resolveRange(
          req
        );

      const data =
        await prisma.expense.findMany({
          where: {
            created_at: {
              gte:
                from,

              lte:
                to,
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
        });

      return res.json({
        success: true,

        data:
          data.map(
            (
              row
            ) => ({
              id:
                row.id,

              expense_code:
                row.expense_code,

              category:
                row.category,

              amount:
                row.amount.toString(),

              recipient:
                row.recipient,

              note:
                row.description,

              created_at:
                row.created_at,
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
     DELETE RECEIPT
  ======================================================= */

  async deleteReceipt(
    req: Request,
    res: Response
  ) {
    try {
      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          id
        ) ||
        id <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "ID khoản thu không hợp lệ",
          });
      }

      await prisma.receipt.delete({
        where: {
          id,
        },
      });

      return res.json({
        success: true,

        message:
          "Đã xóa khoản thu",
      });
    } catch (error) {
      return sendError(
        res,
        error
      );
    }
  }

  /* =======================================================
     DELETE EXPENSE
  ======================================================= */

  async deleteExpense(
    req: Request,
    res: Response
  ) {
    try {
      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          id
        ) ||
        id <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "ID khoản chi không hợp lệ",
          });
      }

      await prisma.expense.delete({
        where: {
          id,
        },
      });

      return res.json({
        success: true,

        message:
          "Đã xóa khoản chi",
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
     
     GET
     /cash-flow/dashboard?period=month&value=2026-08
     
     hoặc
     
     /cash-flow/dashboard
       ?period=custom
       &from=2026-08-01
       &to=2026-08-31
  ======================================================= */

  async dashboard(
    req: Request,
    res: Response
  ) {
    try {
      const {
        from,
        to,
      } =
        resolveRange(
          req
        );

      const [
        receipts,
        expenses,
        exports,
        losses,
      ] =
        await Promise.all([
          /* ===============================================
             RECEIPTS
          =============================================== */

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

              statement_amount:
                true,

              fee_amount:
                true,
            },

            _count: {
              _all:
                true,
            },
          }),

          /* ===============================================
             EXPENSE
          =============================================== */

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

            _count: {
              _all:
                true,
            },
          }),

          /* ===============================================
             COST OF GOODS EXPORTED
          =============================================== */

          prisma.inventoryTransaction.aggregate({
            where: {
              transaction_type:
                EXPORT_TYPE,

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

          /* ===============================================
             LOSS / BREAKAGE
          =============================================== */

          prisma.inventoryTransaction.aggregate({
            where: {
              transaction_type:
                LOSS_TYPE,

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

      const actualReceipt =
        receipts._sum.amount ??
        new Prisma.Decimal(
          0
        );

      const statementAmount =
        receipts._sum.statement_amount ??
        new Prisma.Decimal(
          0
        );

      const receiptFees =
        receipts._sum.fee_amount ??
        new Prisma.Decimal(
          0
        );

      const operatingExpense =
        expenses._sum.amount ??
        new Prisma.Decimal(
          0
        );

      const cogs =
        exports._sum.total_value ??
        new Prisma.Decimal(
          0
        );

      const loss =
        losses._sum.total_value ??
        new Prisma.Decimal(
          0
        );

      /*
       * ===============================================
       * PROFIT
       *
       * Thực nhận
       * - giá vốn hàng xuất
       * - chi phí vận hành
       * - bể vỡ/thất thoát
       * ===============================================
       */
      const profit =
        actualReceipt
          .minus(
            cogs
          )
          .minus(
            operatingExpense
          )
          .minus(
            loss
          );

      return res.json({
        success: true,

        data: {
          period: {
            from,
            to,
          },

          statement_amount:
            statementAmount.toString(),

          receipt_fee:
            receiptFees.toString(),

          actual_receipt:
            actualReceipt.toString(),

          export_cost:
            cogs.toString(),

          operating_expense:
            operatingExpense.toString(),

          loss_value:
            loss.toString(),

          profit:
            profit.toString(),

          export_quantity:
            exports._sum.quantity ??
            0,

          loss_quantity:
            losses._sum.quantity ??
            0,

          receipt_count:
            receipts._count._all,

          expense_count:
            expenses._count._all,
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
     FULL REPORT
     
     Frontend có thể gọi 1 API duy nhất.
  ======================================================= */

  async report(
    req: Request,
    res: Response
  ) {
    try {
      const {
        from,
        to,
      } =
        resolveRange(
          req
        );

      const [
        receipts,
        expenses,
        exportTransactions,
        lossTransactions,
      ] =
        await Promise.all([
          prisma.receipt.findMany({
            where: {
              created_at: {
                gte:
                  from,

                lte:
                  to,
              },
            },

            orderBy: {
              created_at:
                "desc",
            },
          }),

          prisma.expense.findMany({
            where: {
              created_at: {
                gte:
                  from,

                lte:
                  to,
              },
            },

            orderBy: {
              created_at:
                "desc",
            },
          }),

          prisma.inventoryTransaction.findMany({
            where: {
              transaction_type:
                EXPORT_TYPE,

              created_at: {
                gte:
                  from,

                lte:
                  to,
              },
            },

            include: {
              variant: {
                include: {
                  product:
                    true,
                },
              },
            },

            orderBy: {
              created_at:
                "desc",
            },
          }),

          prisma.inventoryTransaction.findMany({
            where: {
              transaction_type:
                LOSS_TYPE,

              created_at: {
                gte:
                  from,

                lte:
                  to,
              },
            },

            include: {
              variant: {
                include: {
                  product:
                    true,
                },
              },
            },

            orderBy: {
              created_at:
                "desc",
            },
          }),
        ]);

      let actualReceipt =
        new Prisma.Decimal(
          0
        );

      let statementTotal =
        new Prisma.Decimal(
          0
        );

      let receiptFee =
        new Prisma.Decimal(
          0
        );

      for (
        const row of receipts
      ) {
        actualReceipt =
          actualReceipt.plus(
            row.amount
          );

        statementTotal =
          statementTotal.plus(
            row.statement_amount
          );

        receiptFee =
          receiptFee.plus(
            row.fee_amount
          );
      }

      let operatingExpense =
        new Prisma.Decimal(
          0
        );

      for (
        const row of expenses
      ) {
        operatingExpense =
          operatingExpense.plus(
            row.amount
          );
      }

      let exportCost =
        new Prisma.Decimal(
          0
        );

      for (
        const row of
        exportTransactions
      ) {
        if (
          row.total_value
        ) {
          exportCost =
            exportCost.plus(
              row.total_value
            );
        }
      }

      let lossValue =
        new Prisma.Decimal(
          0
        );

      for (
        const row of
        lossTransactions
      ) {
        if (
          row.total_value
        ) {
          lossValue =
            lossValue.plus(
              row.total_value
            );
        }
      }

      const profit =
        actualReceipt
          .minus(
            exportCost
          )
          .minus(
            operatingExpense
          )
          .minus(
            lossValue
          );

      return res.json({
        success: true,

        data: {
          period: {
            from,
            to,
          },

          summary: {
            statement_amount:
              statementTotal.toString(),

            receipt_fee:
              receiptFee.toString(),

            actual_receipt:
              actualReceipt.toString(),

            export_cost:
              exportCost.toString(),

            operating_expense:
              operatingExpense.toString(),

            loss_value:
              lossValue.toString(),

            profit:
              profit.toString(),
          },

          receipts:
            receipts.map(
              (
                row
              ) => ({
                id:
                  row.id,

                receipt_code:
                  row.receipt_code,

                source:
                  row.category,

                statement_amount:
                  row.statement_amount.toString(),

                fee_amount:
                  row.fee_amount.toString(),

                actual_amount:
                  row.amount.toString(),

                period_code:
                  row.period_code,

                note:
                  row.description,

                created_at:
                  row.created_at,
              })
            ),

          expenses:
            expenses.map(
              (
                row
              ) => ({
                id:
                  row.id,

                expense_code:
                  row.expense_code,

                category:
                  row.category,

                amount:
                  row.amount.toString(),

                recipient:
                  row.recipient,

                note:
                  row.description,

                created_at:
                  row.created_at,
              })
            ),

          export_transactions:
            exportTransactions.map(
              (
                row
              ) => ({
                id:
                  row.id,

                product_name:
                  row.variant
                    .product
                    .product_name,

                size:
                  row.variant.size,

                sku:
                  row.variant.variant_code,

                quantity:
                  row.quantity,

                unit_cost:
                  row.unit_price?.toString() ??
                  "0",

                total_cost:
                  row.total_value?.toString() ??
                  "0",

                created_at:
                  row.created_at,
              })
            ),

          loss_transactions:
            lossTransactions.map(
              (
                row
              ) => ({
                id:
                  row.id,

                product_name:
                  row.variant
                    .product
                    .product_name,

                size:
                  row.variant.size,

                sku:
                  row.variant.variant_code,

                quantity:
                  row.quantity,

                unit_cost:
                  row.unit_price?.toString() ??
                  "0",

                total_value:
                  row.total_value?.toString() ??
                  "0",

                note:
                  row.note,

                created_at:
                  row.created_at,
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
}

export default new CashFlowController();