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

export default function CashFlowDashboard({
  dashboard = {},

  period,
  setPeriod,

  periodValue,
  setPeriodValue,

  customFrom,
  setCustomFrom,

  customTo,
  setCustomTo,

  onView,

  onPrintCashFlow,

  onPrintReconciliation,

  loading,
}) {
  const profit =
    Number(
      dashboard.profit ||
        0
    );

  return (
    <>
      <section className="cashflow-title-card">

        <div>

          <h1>
            Thu – chi – lãi/lỗ
          </h1>

          <p>
            Theo tuần, tháng, năm hoặc khoảng ngày.
          </p>

        </div>

        <div className="cashflow-title-actions">

          <button
            type="button"
            className="cashflow-btn secondary"

            onClick={
              onPrintCashFlow
            }
          >
            In báo cáo thu chi
          </button>

          <button
            type="button"
            className="cashflow-btn primary"

            onClick={
              onPrintReconciliation
            }
          >
            In báo cáo đối soát
          </button>

        </div>

      </section>

      <section className="cashflow-filter-card">

        <select
          value={
            period
          }

          onChange={(e) =>
            setPeriod(
              e.target.value
            )
          }
        >
          <option value="day">
            Ngày
          </option>

          <option value="week">
            Tuần
          </option>

          <option value="month">
            Tháng
          </option>

          <option value="year">
            Năm
          </option>

          <option value="custom">
            Khoảng ngày
          </option>
        </select>

        {period ===
        "month" ? (
          <input
            type="month"

            value={
              periodValue
            }

            onChange={(e) =>
              setPeriodValue(
                e.target.value
              )
            }
          />
        ) : period ===
          "year" ? (
          <input
            type="number"

            min="2020"
            max="2100"

            value={
              periodValue.slice(
                0,
                4
              )
            }

            onChange={(e) =>
              setPeriodValue(
                e.target.value
              )
            }
          />
        ) : period ===
          "custom" ? (
          <div className="cashflow-custom-range">

            <div>
              <label>
                Từ ngày
              </label>

              <input
                type="date"

                value={
                  customFrom
                }

                onChange={(e) =>
                  setCustomFrom(
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label>
                Đến ngày
              </label>

              <input
                type="date"

                value={
                  customTo
                }

                onChange={(e) =>
                  setCustomTo(
                    e.target.value
                  )
                }
              />
            </div>

          </div>
        ) : (
          <input
            type="date"

            value={
              periodValue.length ===
              10
                ? periodValue
                : new Date()
                    .toISOString()
                    .slice(
                      0,
                      10
                    )
            }

            onChange={(e) =>
              setPeriodValue(
                e.target.value
              )
            }
          />
        )}

        <button
          type="button"
          className="cashflow-btn secondary cashflow-view-btn"

          disabled={
            loading
          }

          onClick={
            onView
          }
        >
          {loading
            ? "Đang tải..."
            : "Xem"}
        </button>

      </section>

      <section className="cashflow-dashboard-grid">

        <div className="cashflow-stat-card">

          <span>
            Thực nhận
          </span>

          <strong>
            {money(
              dashboard.actual_receipt
            )}
          </strong>

        </div>

        <div className="cashflow-stat-card">

          <span>
            Giá vốn xuất
          </span>

          <strong>
            {money(
              dashboard.export_cost
            )}
          </strong>

        </div>

        <div className="cashflow-stat-card">

          <span>
            Chi phí vận hành
          </span>

          <strong>
            {money(
              dashboard.operating_expense
            )}
          </strong>

        </div>

        <div className="cashflow-stat-card">

          <span>
            Bể vỡ / thất thoát
          </span>

          <strong>
            {money(
              dashboard.loss_value
            )}
          </strong>

        </div>

        <div className="cashflow-stat-card profit-card">

          <span>
            Lãi/lỗ
          </span>

          <strong
            className={
              profit >= 0
                ? "positive"
                : "negative"
            }
          >
            {money(
              profit
            )}
          </strong>

        </div>

      </section>
    </>
  );
}