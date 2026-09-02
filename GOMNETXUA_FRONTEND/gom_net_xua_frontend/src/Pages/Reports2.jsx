import {
  useCallback,
  useEffect,
  useState,
} from "react";

import "../Components/reports.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

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

const number = (
  value
) =>
  new Intl.NumberFormat(
    "vi-VN"
  ).format(
    Number(
      value || 0
    )
  );

const today = () => {
  const now =
    new Date();

  const offset =
    now.getTimezoneOffset();

  return new Date(
    now.getTime() -
      offset *
        60000
  )
    .toISOString()
    .slice(0, 10);
};

const firstDayMonth =
  () =>
    `${today().slice(
      0,
      7
    )}-01`;

async function api(
  path
) {
  const response =
    await fetch(
      `${API_URL}${path}`
    );

  const data =
    await response.json();

  if (
    !response.ok ||
    data.success ===
      false
  ) {
    throw new Error(
      data.message ||
        "Không tải được báo cáo"
    );
  }

  return data;
}

export default function BaoCaoKho() {
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
    report,
    setReport,
  ] = useState({
    summary: {},
    rows: [],
  });

  const [
    loading,
    setLoading,
  ] = useState(false);

  const load =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          const result =
            await api(
              `/reports/stock?from=${from}&to=${to}`
            );

          setReport(
            result.data || {
              summary:
                {},

              rows:
                [],
            }
          );
        } catch (
          error
        ) {
          alert(
            error.message
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        from,
        to,
      ]
    );

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv =
    () => {
      const header = [
        "Sản phẩm gốc",
        "Biến thể",
        "SKU",
        "Tồn đầu",
        "Nhập",
        "Xuất",
        "Điều chỉnh",
        "Tồn cuối",
        "Giá vốn",
        "Giá trị tồn",
      ];

      const rows =
        report.rows.map(
          (
            row
          ) => [
            row.product_name,
            row.size ||
              "",
            row.sku,
            row.opening_quantity,
            row.import_quantity,
            row.export_quantity,
            row.adjustment_quantity,
            row.closing_quantity,
            row.purchase_price,
            row.inventory_value,
          ]
        );

      const csv =
        [
          header,
          ...rows,
        ]
          .map(
            (
              row
            ) =>
              row
                .map(
                  (
                    value
                  ) =>
                    `"${String(
                      value ??
                        ""
                    ).replaceAll(
                      '"',
                      '""'
                    )}"`
                )
                .join(",")
          )
          .join("\n");

      const blob =
        new Blob(
          [
            "\uFEFF",
            csv,
          ],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const a =
        document.createElement(
          "a"
        );

      a.href =
        url;

      a.download =
        `Bao_cao_kho_${from}_${to}.csv`;

      a.click();

      URL.revokeObjectURL(
        url
      );
    };

  const summary =
    report.summary ||
    {};

  return (
    <main className="report-page">

      <section className="report-stock-title">

        <h1>
          Báo cáo kho
        </h1>

        <p>
          Theo từng biến thể size.
        </p>

      </section>

      <section className="report-stock-filter">

        <select>
          <option>
            Tháng
          </option>
        </select>

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

        <div className="report-stock-actions">

          <button
            className="report-btn light"
            type="button"
            onClick={
              load
            }
          >
            {loading
              ? "Đang tải..."
              : "Xem"}
          </button>

          <button
            className="report-btn primary"
            type="button"
            onClick={
              exportCsv
            }
          >
            Xuất CSV
          </button>

          <button
            className="report-btn light"
            type="button"
            onClick={() =>
              window.print()
            }
          >
            Xem trước / In báo cáo kho
          </button>

        </div>

      </section>

      <section className="report-period-summary">

        Kỳ báo cáo{" "}

        <strong>
          {new Date(
            `${from}T00:00:00`
          ).toLocaleDateString(
            "vi-VN"
          )}
          {" – "}
          {new Date(
            `${to}T00:00:00`
          ).toLocaleDateString(
            "vi-VN"
          )}
        </strong>

        {" · "}
        Tồn đầu{" "}

        <strong>
          {number(
            summary.opening_quantity
          )}
        </strong>

        {" · "}
        Nhập{" "}

        <strong>
          {number(
            summary.import_quantity
          )}
        </strong>

        {" · "}
        Xuất{" "}

        <strong>
          {number(
            summary.export_quantity
          )}
        </strong>

        {" · "}
        Điều chỉnh{" "}

        <strong>
          {number(
            summary.adjustment_quantity
          )}
        </strong>

        {" · "}
        Tồn cuối{" "}

        <strong>
          {number(
            summary.closing_quantity
          )}
        </strong>

        {" · "}
        Giá trị tồn{" "}

        <strong>
          {money(
            summary.inventory_value
          )}
        </strong>

      </section>

      <section className="report-stock-table-wrap">

        <table className="report-stock-table">

          <thead>

            <tr>
              <th>
                Nhóm
              </th>

              <th>
                Sản phẩm gốc
              </th>

              <th>
                Biến thể
              </th>

              <th>
                SKU
              </th>

              <th>
                Tồn đầu
              </th>

              <th>
                Nhập
              </th>

              <th>
                Xuất
              </th>

              <th>
                Điều chỉnh
              </th>

              <th>
                Tồn cuối
              </th>

              <th>
                Giá vốn
              </th>

              <th>
                Giá trị tồn
              </th>
            </tr>

          </thead>

          <tbody>

            {report.rows.map(
              (
                row
              ) => (
                <tr
                  key={
                    row.variant_id
                  }
                >

                  <td>
                    {
                      row.group_name
                    }
                  </td>

                  <td>
                    {
                      row.product_name
                    }
                  </td>

                  <td>
                    {row.size ||
                      "—"}
                  </td>

                  <td>
                    <strong>
                      {
                        row.sku
                      }
                    </strong>
                  </td>

                  <td>
                    {
                      row.opening_quantity
                    }
                  </td>

                  <td>
                    {
                      row.import_quantity
                    }
                  </td>

                  <td>
                    {
                      row.export_quantity
                    }
                  </td>

                  <td>
                    {
                      row.adjustment_quantity
                    }
                  </td>

                  <td>
                    <strong>
                      {
                        row.closing_quantity
                      }
                    </strong>
                  </td>

                  <td>
                    {money(
                      row.purchase_price
                    )}
                  </td>

                  <td>
                    <strong>
                      {money(
                        row.inventory_value
                      )}
                    </strong>
                  </td>

                </tr>
              )
            )}

          </tbody>

        </table>

      </section>

    </main>
  );
}