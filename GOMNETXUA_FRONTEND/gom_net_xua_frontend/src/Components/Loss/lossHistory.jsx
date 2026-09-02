import {
  useCallback,
  useEffect,
  useState,
} from "react";

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

const firstDayMonth =
  () => {
    const now =
      new Date();

    return [
      now.getFullYear(),

      String(
        now.getMonth() +
          1
      ).padStart(
        2,
        "0"
      ),

      "01",
    ].join("-");
  };

export default function LossHistory({
  api,
  refreshKey,
}) {
  const [
    dashboard,
    setDashboard,
  ] = useState({
    loss_quantity: 0,
    loss_value: 0,
    occurrence_count: 0,
    return_quantity: 0,
  });

  const [
    rows,
    setRows,
  ] = useState([]);

  const [
    from,
    setFrom,
  ] = useState(
    firstDayMonth()
  );

  const [
    to,
    setTo,
  ] = useState(
    today()
  );

  const [
    type,
    setType,
  ] = useState("");

  const [
    reason,
    setReason,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const load =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const dashboardParams =
            new URLSearchParams();

          dashboardParams.set(
            "from",
            from
          );

          dashboardParams.set(
            "to",
            to
          );

          const historyParams =
            new URLSearchParams();

          historyParams.set(
            "from",
            from
          );

          historyParams.set(
            "to",
            to
          );

          if (type) {
            historyParams.set(
              "type",
              type
            );
          }

          if (reason) {
            historyParams.set(
              "reason",
              reason
            );
          }

          const [
            dashboardResult,
            historyResult,
          ] =
            await Promise.all([
              api(
                `/dashboard?${dashboardParams.toString()}`
              ),

              api(
                `/history?${historyParams.toString()}`
              ),
            ]);

          setDashboard(
            dashboardResult?.data ||
              {}
          );

          setRows(
            Array.isArray(
              historyResult?.data
            )
              ? historyResult.data
              : []
          );
        } catch (error) {
          console.error(
            error
          );
        } finally {
          setLoading(false);
        }
      },
      [
        api,
        from,
        to,
        type,
        reason,
      ]
    );

  useEffect(() => {
    load();
  }, [
    load,
    refreshKey,
  ]);

  return (
    <section className="loss-history">

      <div className="loss-dashboard-grid">

        <div className="loss-stat-card">

          <span>
            SL tổn thất
          </span>

          <strong>
            {
              dashboard.loss_quantity ||
              0
            }
          </strong>

        </div>

        <div className="loss-stat-card">

          <span>
            Giá trị tổn thất
          </span>

          <strong>
            {money(
              dashboard.loss_value
            )}
          </strong>

        </div>

        <div className="loss-stat-card">

          <span>
            Số lần phát sinh
          </span>

          <strong>
            {
              dashboard.occurrence_count ||
              0
            }
          </strong>

        </div>

        <div className="loss-stat-card">

          <span>
            Hàng trả nhập lại
          </span>

          <strong>
            {
              dashboard.return_quantity ||
              0
            }
          </strong>

        </div>

      </div>

      <div className="loss-filter-card">

        <div className="loss-date-fields">

          <div>
            <label>
              Từ ngày
            </label>

            <input
              type="date"

              value={
                from
              }

              onChange={(e) =>
                setFrom(
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
                to
              }

              onChange={(e) =>
                setTo(
                  e.target.value
                )
              }
            />
          </div>

        </div>

        <select
          value={
            type
          }

          onChange={(e) =>
            setType(
              e.target.value
            )
          }
        >
          <option value="">
            Tất cả loại
          </option>

          <option value="LOSS">
            Bể vỡ / thất thoát
          </option>

          <option value="CUSTOMER_RETURN_RESALE">
            Khách trả còn bán được
          </option>
        </select>

        <select
          value={
            reason
          }

          onChange={(e) =>
            setReason(
              e.target.value
            )
          }
        >
          <option value="">
            Tất cả nguyên nhân
          </option>

          <option>
            Bể trong kho
          </option>

          <option>
            Thất thoát
          </option>

          <option>
            Hàng lỗi
          </option>

          <option>
            Bể khi đóng hàng
          </option>

          <option>
            Kiểm kho thiếu
          </option>

          <option>
            Khách trả còn bán được
          </option>

          <option>
            Đổi trả còn nguyên
          </option>

          <option>
            Hoàn đơn còn bán được
          </option>
        </select>

        <button
          type="button"
          className="loss-filter-btn"

          onClick={
            load
          }
        >
          Lọc lịch sử
        </button>

      </div>

      <div className="loss-history-table-wrap">

        <table className="loss-history-table">

          <thead>

            <tr>
              <th>
                Ngày
              </th>

              <th>
                Loại
              </th>

              <th>
                Sản phẩm
              </th>

              <th>
                Biến thể
              </th>

              <th>
                SKU
              </th>

              <th>
                SL
              </th>

              <th>
                Giá vốn
              </th>

              <th>
                Giá trị
              </th>

              <th>
                Người
              </th>

              <th>
                Lý do
              </th>

            </tr>

          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td colSpan="14">
                  Đang tải...
                </td>
              </tr>
            ) : rows.length ===
              0 ? (
              <tr>
                <td colSpan="14">
                  Chưa có dữ liệu.
                </td>
              </tr>
            ) : (
              rows.map(
                (
                  row
                ) => (
                  <tr
                    key={
                      row.id
                    }
                  >

                    <td>
                      {new Date(
                        row.created_at
                      ).toLocaleDateString(
                        "vi-VN"
                      )}
                    </td>

                    <td>

                      <span
                        className={
                          row.transaction_type ===
                          "LOSS"
                            ? "loss-badge loss"
                            : "loss-badge return"
                        }
                      >
                        {row.transaction_type ===
                        "LOSS"
                          ? "Thất thoát"
                          : "Khách trả còn bán được"}
                      </span>

                    </td>

                    <td>
                      {
                        row.variant
                          ?.group_name
                      }
                    </td>

                    <td>
                      {
                        row.variant
                          ?.size
                      }
                    </td>

                    <td>
                      {
                        row.variant
                          ?.variant_code
                      }
                    </td>

                    <td>
                      <strong>
                        {
                          row.quantity
                        }
                      </strong>
                    </td>

                    <td>
                      {money(
                        row.unit_cost
                      )}
                    </td>

                    <td>
                      {money(
                        row.total_value
                      )}
                    </td>

                    <td>
                      {
                        row.performed_by
                      }
                    </td>

                    <td>
                      {
                        row.reason
                      }
                    </td>


                  </tr>
                )
              )
            )}

          </tbody>

        </table>

      </div>

    </section>
  );
}