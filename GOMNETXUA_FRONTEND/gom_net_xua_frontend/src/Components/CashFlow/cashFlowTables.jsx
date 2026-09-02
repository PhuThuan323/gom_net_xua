const money = (
  value
) =>
  new Intl.NumberFormat(
    "vi-VN"
  ).format(
    Number(
      value || 0
    )
  ) + " đ";

const dateVN = (
  value
) => {
  if (!value) {
    return "";
  }

  return new Date(
    value
  ).toLocaleDateString(
    "vi-VN"
  );
};

export default function CashFlowTables({
  receipts = [],
  expenses = [],

  onDeleteReceipt,
  onDeleteExpense,
}) {
  return (
    <section className="cashflow-tables-grid">

      {/* ===================================================
          RECEIPTS
      =================================================== */}

      <div className="cashflow-list-section">

        <h2>
          Khoản thu
        </h2>

        <div className="cashflow-table-wrap">

          <table className="cashflow-table">

            <thead>

              <tr>
                <th>
                  Ngày
                </th>

                <th>
                  Nguồn
                </th>

                <th>
                  Sao kê
                </th>

                <th>
                  Phí
                </th>

                <th>
                  Thực nhận
                </th>

                <th>
                  Mã kỳ
                </th>

                <th>
                  Thao tác
                </th>
              </tr>

            </thead>

            <tbody>

              {receipts.length ===
              0 ? (
                <tr>
                  <td colSpan="7">
                    Chưa có khoản thu.
                  </td>
                </tr>
              ) : (
                receipts.map(
                  (
                    row
                  ) => (
                    <tr
                      key={
                        row.id
                      }
                    >

                      <td>
                        {dateVN(
                          row.created_at
                        )}
                      </td>

                      <td>
                        {
                          row.source
                        }
                      </td>

                      <td>
                        {money(
                          row.statement_amount
                        )}
                      </td>

                      <td>
                        {money(
                          row.fee_amount
                        )}
                      </td>

                      <td>
                        <strong>
                          {money(
                            row.actual_amount
                          )}
                        </strong>
                      </td>

                      <td>
                        {
                          row.period_code ||
                          "—"
                        }
                      </td>

                      <td>

                        <button
                          type="button"
                          className="cashflow-delete-btn"

                          onClick={() =>
                            onDeleteReceipt(
                              row.id
                            )
                          }
                        >
                          Xóa
                        </button>

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ===================================================
          EXPENSES
      =================================================== */}

      <div className="cashflow-list-section">

        <h2>
          Khoản chi
        </h2>

        <div className="cashflow-table-wrap">

          <table className="cashflow-table">

            <thead>

              <tr>
                <th>
                  Ngày
                </th>

                <th>
                  Nhóm
                </th>

                <th>
                  Người nhận
                </th>

                <th>
                  Số tiền
                </th>

                <th>
                  Ghi chú
                </th>

                <th>
                  Thao tác
                </th>
              </tr>

            </thead>

            <tbody>

              {expenses.length ===
              0 ? (
                <tr>
                  <td colSpan="6">
                    Chưa có khoản chi.
                  </td>
                </tr>
              ) : (
                expenses.map(
                  (
                    row
                  ) => (
                    <tr
                      key={
                        row.id
                      }
                    >

                      <td>
                        {dateVN(
                          row.created_at
                        )}
                      </td>

                      <td>
                        {
                          row.category
                        }
                      </td>

                      <td>
                        {
                          row.recipient ||
                          "—"
                        }
                      </td>

                      <td>
                        <strong>
                          {money(
                            row.amount
                          )}
                        </strong>
                      </td>

                      <td>
                        {
                          row.note ||
                          "—"
                        }
                      </td>

                      <td>

                        <button
                          type="button"
                          className="cashflow-delete-btn"

                          onClick={() =>
                            onDeleteExpense(
                              row.id
                            )
                          }
                        >
                          Xóa
                        </button>

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

    </section>
  );
}