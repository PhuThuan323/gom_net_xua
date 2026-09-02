import {
  useMemo,
  useState,
} from "react";

const today = () => {
  const now =
    new Date();

  const offset =
    now.getTimezoneOffset();

  return new Date(
    now.getTime() -
      offset * 60000
  )
    .toISOString()
    .slice(0, 10);
};

export default function CashFlowForms({
  api,

  receiptSources = [],

  expenseCategories = [],

  onSaved,
}) {
  const [
    receiptForm,
    setReceiptForm,
  ] = useState({
    date: today(),
    source:
      "TikTok Shop",

    statement_amount:
      "",

    fee_amount:
      0,

    actual_amount:
      "",

    period_code:
      "",

    note:
      "",
  });

  const [
    expenseForm,
    setExpenseForm,
  ] = useState({
    date: today(),

    category:
      "Chi nhân viên",

    amount:
      "",

    recipient:
      "",

    note:
      "",
  });

  const [
    savingReceipt,
    setSavingReceipt,
  ] = useState(false);

  const [
    savingExpense,
    setSavingExpense,
  ] = useState(false);

  /* =======================================================
     ACTUAL RECEIPT
  ======================================================= */

  const calculatedActual =
    useMemo(() => {
      const statement =
        Number(
          receiptForm.statement_amount ||
            0
        );

      const fee =
        Number(
          receiptForm.fee_amount ||
            0
        );

      return Math.max(
        0,
        statement - fee
      );
    }, [
      receiptForm.statement_amount,
      receiptForm.fee_amount,
    ]);

  /* =======================================================
     SAVE RECEIPT
  ======================================================= */

  const saveReceipt =
    async () => {
      if (
        !receiptForm.source
      ) {
        alert(
          "Vui lòng chọn nguồn thu"
        );

        return;
      }

      if (
        Number(
          receiptForm.statement_amount ||
            0
        ) <= 0
      ) {
        alert(
          "Vui lòng nhập tổng sao kê"
        );

        return;
      }

      try {
        setSavingReceipt(
          true
        );

        await api(
          "/receipts",
          {
            method:
              "POST",

            body:
              JSON.stringify({
                date:
                  receiptForm.date,

                source:
                  receiptForm.source,

                statement_amount:
                  Number(
                    receiptForm.statement_amount ||
                      0
                  ),

                fee_amount:
                  Number(
                    receiptForm.fee_amount ||
                      0
                  ),

                actual_amount:
                  calculatedActual,

                period_code:
                  receiptForm.period_code,

                note:
                  receiptForm.note,
              }),
          }
        );

        alert(
          "Đã lưu khoản thu"
        );

        setReceiptForm(
          (
            old
          ) => ({
            ...old,

            statement_amount:
              "",

            fee_amount:
              0,

            actual_amount:
              "",

            period_code:
              "",

            note:
              "",
          })
        );

        onSaved?.();
      } catch (error) {
        alert(
          error?.message ||
            "Không thể lưu khoản thu"
        );
      } finally {
        setSavingReceipt(
          false
        );
      }
    };

  /* =======================================================
     SAVE EXPENSE
  ======================================================= */

  const saveExpense =
    async () => {
      if (
        !expenseForm.category
      ) {
        alert(
          "Vui lòng chọn nhóm chi"
        );

        return;
      }

      if (
        Number(
          expenseForm.amount ||
            0
        ) <= 0
      ) {
        alert(
          "Vui lòng nhập số tiền chi"
        );

        return;
      }

      try {
        setSavingExpense(
          true
        );

        await api(
          "/expenses",
          {
            method:
              "POST",

            body:
              JSON.stringify({
                date:
                  expenseForm.date,

                category:
                  expenseForm.category,

                amount:
                  Number(
                    expenseForm.amount ||
                      0
                  ),

                recipient:
                  expenseForm.recipient,

                note:
                  expenseForm.note,
              }),
          }
        );

        alert(
          "Đã lưu khoản chi"
        );

        setExpenseForm(
          (
            old
          ) => ({
            ...old,

            amount:
              "",

            recipient:
              "",

            note:
              "",
          })
        );

        onSaved?.();
      } catch (error) {
        alert(
          error?.message ||
            "Không thể lưu khoản chi"
        );
      } finally {
        setSavingExpense(
          false
        );
      }
    };

  return (
    <section className="cashflow-form-grid">

      {/* ===================================================
          THU
      =================================================== */}

      <div className="cashflow-form-card">

        <h2>
          Thêm khoản thu đối soát
        </h2>

        <div className="cashflow-two-column">

          <div>

            <label>
              Ngày
            </label>

            <input
              type="date"

              value={
                receiptForm.date
              }

              onChange={(e) =>
                setReceiptForm(
                  (
                    old
                  ) => ({
                    ...old,

                    date:
                      e.target.value,
                  })
                )
              }
            />

          </div>

          <div>

            <label>
              Nguồn
            </label>

            <select
              value={
                receiptForm.source
              }

              onChange={(e) =>
                setReceiptForm(
                  (
                    old
                  ) => ({
                    ...old,

                    source:
                      e.target.value,
                  })
                )
              }
            >

              {(receiptSources.length
                ? receiptSources
                : [
                    "TikTok Shop",
                    "Shopee",
                    "Vietnam Post",
                    "GHTK",
                    "Khác",
                  ]
              ).map(
                (
                  source
                ) => (
                  <option
                    key={
                      source
                    }
                    value={
                      source
                    }
                  >
                    {source}
                  </option>
                )
              )}

            </select>

          </div>

          <div>

            <label>
              Tổng sao kê
            </label>

            <input
              type="number"

              min="0"

              value={
                receiptForm.statement_amount
              }

              onChange={(e) =>
                setReceiptForm(
                  (
                    old
                  ) => ({
                    ...old,

                    statement_amount:
                      e.target.value,
                  })
                )
              }
            />

          </div>

          <div>

            <label>
              Phí
            </label>

            <input
              type="number"

              min="0"

              value={
                receiptForm.fee_amount
              }

              onChange={(e) =>
                setReceiptForm(
                  (
                    old
                  ) => ({
                    ...old,

                    fee_amount:
                      e.target.value,
                  })
                )
              }
            />

          </div>

          <div>

            <label>
              Thực nhận
            </label>

            <input
              value={
                calculatedActual
              }

              readOnly
            />

          </div>

          <div>

            <label>
              Mã kỳ
            </label>

            <input
              value={
                receiptForm.period_code
              }

              placeholder="VD: TK-202608-01"

              onChange={(e) =>
                setReceiptForm(
                  (
                    old
                  ) => ({
                    ...old,

                    period_code:
                      e.target.value,
                  })
                )
              }
            />

          </div>

        </div>

        <label>
          Ghi chú
        </label>

        <input
          value={
            receiptForm.note
          }

          onChange={(e) =>
            setReceiptForm(
              (
                old
              ) => ({
                ...old,

                note:
                  e.target.value,
              })
            )
          }
        />

        <button
          type="button"
          className="cashflow-btn primary cashflow-save-btn"

          disabled={
            savingReceipt
          }

          onClick={
            saveReceipt
          }
        >
          {savingReceipt
            ? "Đang lưu..."
            : "Lưu khoản thu"}
        </button>

      </div>

      {/* ===================================================
          CHI
      =================================================== */}

      <div className="cashflow-form-card">

        <h2>
          Thêm khoản chi
        </h2>

        <div className="cashflow-two-column">

          <div>

            <label>
              Ngày
            </label>

            <input
              type="date"

              value={
                expenseForm.date
              }

              onChange={(e) =>
                setExpenseForm(
                  (
                    old
                  ) => ({
                    ...old,

                    date:
                      e.target.value,
                  })
                )
              }
            />

          </div>

          <div>

            <label>
              Nhóm chi
            </label>

            <select
              value={
                expenseForm.category
              }

              onChange={(e) =>
                setExpenseForm(
                  (
                    old
                  ) => ({
                    ...old,

                    category:
                      e.target.value,
                  })
                )
              }
            >

              {(expenseCategories.length
                ? expenseCategories
                : [
                    "Chi nhân viên",
                    "Trả tài xế",
                    "Tiền nhà / kho",
                    "Tiền điện",
                    "Tiền nước",
                    "Wi-Fi",
                    "Vật tư",
                    "Vận chuyển",
                    "Marketing",
                    "Khác",
                  ]
              ).map(
                (
                  category
                ) => (
                  <option
                    key={
                      category
                    }
                    value={
                      category
                    }
                  >
                    {category}
                  </option>
                )
              )}

            </select>

          </div>

          <div>

            <label>
              Số tiền
            </label>

            <input
              type="number"

              min="0"

              value={
                expenseForm.amount
              }

              onChange={(e) =>
                setExpenseForm(
                  (
                    old
                  ) => ({
                    ...old,

                    amount:
                      e.target.value,
                  })
                )
              }
            />

          </div>

          <div>

            <label>
              Người nhận
            </label>

            <input
              value={
                expenseForm.recipient
              }

              onChange={(e) =>
                setExpenseForm(
                  (
                    old
                  ) => ({
                    ...old,

                    recipient:
                      e.target.value,
                  })
                )
              }
            />

          </div>

        </div>

        <label>
          Ghi chú
        </label>

        <input
          value={
            expenseForm.note
          }

          onChange={(e) =>
            setExpenseForm(
              (
                old
              ) => ({
                ...old,

                note:
                  e.target.value,
              })
            )
          }
        />

        <button
          type="button"
          className="cashflow-btn primary cashflow-save-btn"

          disabled={
            savingExpense
          }

          onClick={
            saveExpense
          }
        >
          {savingExpense
            ? "Đang lưu..."
            : "Lưu khoản chi"}
        </button>

      </div>

    </section>
  );
}