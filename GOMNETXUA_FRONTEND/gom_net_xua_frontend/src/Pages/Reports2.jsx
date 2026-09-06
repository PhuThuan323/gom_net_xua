import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "../Components/reports.css";
import "../Components/stockReportPrint.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

const COMPANY = {
  name: "GỐM SỨ ĐẶC SẢN NÉT XƯA",
  address: "Xã Mỹ Hiệp, Đồng Tháp",
  hotline: "0926 18 5457",
  website:
    "https://blue-pine-cfae.khuyenboy10.workers.dev",
};

const money = (value) =>
  new Intl.NumberFormat("vi-VN").format(
    Number(value || 0)
  ) + " đ";

const number = (value) =>
  new Intl.NumberFormat("vi-VN").format(
    Number(value || 0)
  );

const pad = (value) =>
  String(value).padStart(2, "0");

const formatInputDate = (date) =>
  `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}`;

const formatVNDate = (value) => {
  if (!value) return "";

  const date = new Date(
    `${value}T12:00:00`
  );

  return date.toLocaleDateString(
    "vi-VN"
  );
};

const formatDateTime = (
  value = new Date()
) => {
  const d = new Date(value);

  return `${pad(
    d.getDate()
  )}/${pad(
    d.getMonth() + 1
  )}/${d.getFullYear()}, ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const today = () =>
  formatInputDate(
    new Date()
  );

const currentMonth = () =>
  today().slice(0, 7);

const monthRange = (
  monthValue
) => {
  const match =
    /^(\d{4})-(\d{2})$/.exec(
      monthValue || ""
    );

  if (!match) {
    return {
      from: `${currentMonth()}-01`,
      to: today(),
    };
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const lastDay =
    new Date(
      year,
      month,
      0,
      12
    );

  return {
    from:
      `${year}-${pad(month)}-01`,

    to:
      formatInputDate(
        lastDay
      ),
  };
};

const getISOWeekValue = (
  dateValue = today()
) => {
  const date =
    new Date(
      `${dateValue}T12:00:00`
    );

  const target =
    new Date(date);

  const dayNumber =
    (target.getDay() + 6) %
    7;

  target.setDate(
    target.getDate() -
      dayNumber +
      3
  );

  const weekYear =
    target.getFullYear();

  const firstThursday =
    new Date(
      weekYear,
      0,
      4,
      12
    );

  const firstDayNumber =
    (firstThursday.getDay() +
      6) %
    7;

  firstThursday.setDate(
    firstThursday.getDate() -
      firstDayNumber +
      3
  );

  const week =
    1 +
    Math.round(
      (
        target.getTime() -
        firstThursday.getTime()
      ) /
        604800000
    );

  return `${weekYear}-W${pad(
    week
  )}`;
};

const weekRange = (
  weekValue
) => {
  const match =
    /^(\d{4})-W(\d{2})$/.exec(
      weekValue || ""
    );

  if (!match) {
    return weekRange(
      getISOWeekValue()
    );
  }

  const year =
    Number(match[1]);

  const week =
    Number(match[2]);

  const jan4 =
    new Date(
      year,
      0,
      4,
      12
    );

  const jan4Day =
    (jan4.getDay() + 6) %
    7;

  const monday =
    new Date(jan4);

  monday.setDate(
    jan4.getDate() -
      jan4Day +
      (week - 1) * 7
  );

  const sunday =
    new Date(monday);

  sunday.setDate(
    monday.getDate() + 6
  );

  return {
    from:
      formatInputDate(
        monday
      ),

    to:
      formatInputDate(
        sunday
      ),
  };
};

const chunkArray = (
  rows,
  size
) => {
  const result = [];

  for (
    let i = 0;
    i < rows.length;
    i += size
  ) {
    result.push(
      rows.slice(
        i,
        i + size
      )
    );
  }

  return result;
};

async function api(path) {
  const response =
    await fetch(
      `${API_URL}${path}`
    );

  const raw =
    await response.text();

  let data;

  try {
    data =
      raw
        ? JSON.parse(raw)
        : {};
  } catch {
    throw new Error(
      "API không trả JSON"
    );
  }

  if (
    !response.ok ||
    data.success === false
  ) {
    throw new Error(
      data.message ||
        "Không tải được báo cáo"
    );
  }

  return data;
}

/* =========================================================
   TEMPLATE IN BÁO CÁO KHO
========================================================= */

function StockPrintTemplate({
  report,
  from,
  to,
  mode,
  monthValue,
  weekValue,
}) {
  const rows =
    Array.isArray(
      report?.rows
    )
      ? report.rows
      : [];

  const summary =
    report?.summary || {};

  const ROWS_PER_PAGE =
    28;

  const pages =
    rows.length > 0
      ? chunkArray(
          rows,
          ROWS_PER_PAGE
        )
      : [[]];

  const printDate =
    new Date();

  const totalPages =
    pages.length;

  const reportTitle =
    mode === "month"
      ? `BÁO CÁO KHO THÁNG ${
          monthValue
            ?.split("-")
            .reverse()
            .join("/") || ""
        }`
      : mode === "week"
        ? `BÁO CÁO KHO TUẦN ${
            weekValue?.replace(
              "-W",
              "/"
            ) || ""
          }`
        : "BÁO CÁO KHO";

  return (
    <div className="stock-print-root">
      {pages.map(
        (
          pageRows,
          pageIndex
        ) => {
          const currentPage =
            pageIndex + 1;

          const startIndex =
            pageIndex *
            ROWS_PER_PAGE;

          return (
            <section
              className="stock-print-sheet"
              key={pageIndex}
            >
              <div className="stock-print-topline">
                <div>
                  {formatDateTime(
                    printDate
                  )}
                </div>

                <div className="stock-print-top-title">
                  BÁO CÁO KHO
                </div>

                <div className="stock-print-meta">
                  <div>
                    Mã biểu mẫu:
                    {" "}
                    NX-BC-01
                  </div>

                  <div>
                    Ngày in:
                    {" "}
                    {printDate.toLocaleDateString(
                      "vi-VN"
                    )}
                  </div>

                  <div>
                    Phiên bản: 01
                  </div>
                </div>
              </div>

              <div className="stock-print-brand">
                <div className="stock-print-logo">
                  NX
                </div>

                <div>
                  <h2>
                    {COMPANY.name}
                  </h2>

                  <p>
                    Địa chỉ:
                    {" "}
                    {COMPANY.address}
                  </p>

                  <p>
                    Hotline:
                    {" "}
                    {COMPANY.hotline}
                  </p>
                </div>
              </div>

              <div className="stock-print-divider" />

              <div className="stock-print-main-title">
                <h1>
                  {reportTitle}
                </h1>

                <p>
                  Biểu mẫu quản trị nội bộ
                </p>
              </div>

              {pageIndex === 0 && (
                <>
                  <div className="stock-print-period">
                    <div>
                      <strong>
                        Từ ngày:
                      </strong>
                      {" "}
                      {formatVNDate(
                        from
                      )}
                    </div>

                    <div>
                      <strong>
                        Đến ngày:
                      </strong>
                      {" "}
                      {formatVNDate(
                        to
                      )}
                    </div>
                  </div>

                  <div className="stock-print-summary">
                    <span>
                      Tồn đầu:
                      {" "}
                      <b>
                        {number(
                          summary.opening_quantity
                        )}
                      </b>
                    </span>

                    <span>
                      Nhập:
                      {" "}
                      <b>
                        {number(
                          summary.import_quantity
                        )}
                      </b>
                    </span>

                    <span>
                      Xuất:
                      {" "}
                      <b>
                        {number(
                          summary.export_quantity
                        )}
                      </b>
                    </span>

                    <span>
                      Điều chỉnh:
                      {" "}
                      <b>
                        {number(
                          summary.adjustment_quantity
                        )}
                      </b>
                    </span>

                    <span>
                      Tồn cuối:
                      {" "}
                      <b>
                        {number(
                          summary.closing_quantity
                        )}
                      </b>
                    </span>

                    <span>
                      Giá trị tồn:
                      {" "}
                      <b>
                        {money(
                          summary.inventory_value
                        )}
                      </b>
                    </span>
                  </div>
                </>
              )}

              <table className="stock-print-table">
                <thead>
                  <tr>
                    <th>
                      STT
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
                  {pageRows.length >
                  0 ? (
                    pageRows.map(
                      (
                        row,
                        index
                      ) => (
                        <tr
                          key={
                            row.variant_id ||
                            `${pageIndex}-${index}`
                          }
                        >
                          <td>
                            {startIndex +
                              index +
                              1}
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
                            {row.sku ||
                              "—"}
                          </td>

                          <td>
                            {number(
                              row.opening_quantity
                            )}
                          </td>

                          <td>
                            {number(
                              row.import_quantity
                            )}
                          </td>

                          <td>
                            {number(
                              row.export_quantity
                            )}
                          </td>

                          <td>
                            {number(
                              row.adjustment_quantity
                            )}
                          </td>

                          <td>
                            {number(
                              row.closing_quantity
                            )}
                          </td>

                          <td>
                            {money(
                              row.purchase_price
                            )}
                          </td>

                          <td>
                            {money(
                              row.inventory_value
                            )}
                          </td>
                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={11}
                        className="stock-print-empty"
                      >
                        Chưa có dữ liệu kho
                        trong kỳ báo cáo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {currentPage ===
                totalPages && (
                <div className="stock-print-signature">
                  <div>
                    <strong>
                      Người lập biểu
                    </strong>

                    <span>
                      (Ký, ghi rõ họ tên)
                    </span>
                  </div>

                  <div>
                    <strong>
                      Thủ kho / Kế toán
                    </strong>

                    <span>
                      (Ký, ghi rõ họ tên)
                    </span>
                  </div>

                  <div>
                    <strong>
                      Người phê duyệt
                    </strong>

                    <span>
                      (Ký, ghi rõ họ tên)
                    </span>
                  </div>
                </div>
              )}

              <footer className="stock-print-footer">
                <div>
                  {COMPANY.website}
                </div>

                <div>
                  {currentPage}/
                  {totalPages}
                </div>
              </footer>
            </section>
          );
        }
      )}
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function BaoCaoKho() {
  const [
    mode,
    setMode,
  ] = useState("month");

  const [
    monthValue,
    setMonthValue,
  ] = useState(
    currentMonth()
  );

  const [
    weekValue,
    setWeekValue,
  ] = useState(
    getISOWeekValue()
  );

  const [
    customFrom,
    setCustomFrom,
  ] = useState(
    `${currentMonth()}-01`
  );

  const [
    customTo,
    setCustomTo,
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

  const range =
    useMemo(() => {
      if (
        mode === "week"
      ) {
        return weekRange(
          weekValue
        );
      }

      if (
        mode === "custom"
      ) {
        return {
          from:
            customFrom,

          to:
            customTo,
        };
      }

      return monthRange(
        monthValue
      );
    }, [
      mode,
      monthValue,
      weekValue,
      customFrom,
      customTo,
    ]);

  const from =
    range.from;

  const to =
    range.to;

  const load =
    useCallback(
      async () => {
        if (
          !from ||
          !to
        ) {
          return;
        }

        if (
          from > to
        ) {
          alert(
            "Từ ngày không được lớn hơn đến ngày."
          );

          return;
        }

        try {
          setLoading(
            true
          );

          const result =
            await api(
              `/reports/stock?from=${encodeURIComponent(
                from
              )}&to=${encodeURIComponent(
                to
              )}`
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
          console.error(
            "STOCK REPORT ERROR:",
            error
          );

          alert(
            error?.message ||
              "Không tải được báo cáo kho"
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

  const periodLabel =
    useMemo(() => {
      if (
        mode === "month"
      ) {
        const [
          year,
          month,
        ] =
          monthValue.split(
            "-"
          );

        return `Tháng ${month}/${year}`;
      }

      if (
        mode === "week"
      ) {
        const [
          year,
          weekText,
        ] =
          weekValue.split(
            "-W"
          );

        return `Tuần ${weekText}/${year}`;
      }

      return `${formatVNDate(
        from
      )} – ${formatVNDate(
        to
      )}`;
    }, [
      mode,
      monthValue,
      weekValue,
      from,
      to,
    ]);

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
          (row) => [
            row.product_name,
            row.size || "",
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
          .map((row) =>
            row
              .map(
                (value) =>
                  `"${String(
                    value ?? ""
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

      const safePeriod =
        periodLabel
          .replaceAll(
            "/",
            "-"
          )
          .replaceAll(
            " ",
            "_"
          );

      a.href =
        url;

      a.download =
        `Bao_cao_kho_${safePeriod}.csv`;

      a.click();

      URL.revokeObjectURL(
        url
      );
    };

  const handlePrint =
    () => {
      const body =
        document.body;

      body.classList.remove(
        "print-report"
      );

      body.classList.add(
        "print-stock-report"
      );

      const cleanup =
        () => {
          body.classList.remove(
            "print-stock-report"
          );

          window.removeEventListener(
            "afterprint",
            cleanup
          );
        };

      window.addEventListener(
        "afterprint",
        cleanup
      );

      requestAnimationFrame(
        () => {
          requestAnimationFrame(
            () => {
              window.print();
            }
          );
        }
      );
    };

  const summary =
    report.summary || {};

  return (
    <>
      <main className="report-page stock-report-page">
        <section className="report-stock-title">
          <div>
            <div className="report-eyebrow">
              BÁO CÁO QUẢN TRỊ KHO
            </div>

            <h1>
              Báo cáo kho
            </h1>

            <p>
              Theo dõi tồn đầu – nhập –
              xuất – điều chỉnh – tồn cuối
              theo từng biến thể.
            </p>
          </div>
        </section>

        <section className="report-stock-filter stock-report-filter">
          <div className="stock-filter-field">
            <label>
              Chế độ báo cáo
            </label>

            <select
              value={mode}
              onChange={(e) =>
                setMode(
                  e.target.value
                )
              }
            >
              <option value="week">
                Báo cáo tuần
              </option>

              <option value="month">
                Báo cáo tháng
              </option>

              <option value="custom">
                Tùy chỉnh ngày
              </option>
            </select>
          </div>

          {mode ===
            "month" && (
            <div className="stock-filter-field">
              <label>
                Chọn tháng
              </label>

              <input
                type="month"
                value={
                  monthValue
                }
                onChange={(e) =>
                  setMonthValue(
                    e.target.value
                  )
                }
              />
            </div>
          )}

          {mode ===
            "week" && (
            <div className="stock-filter-field">
              <label>
                Chọn tuần
              </label>

              <input
                type="week"
                value={
                  weekValue
                }
                onChange={(e) =>
                  setWeekValue(
                    e.target.value
                  )
                }
              />
            </div>
          )}

          {mode ===
            "custom" && (
            <>
              <div className="stock-filter-field">
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

              <div className="stock-filter-field">
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
            </>
          )}

          <div className="stock-filter-current">
            <span>
              Kỳ đang xem
            </span>

            <strong>
              {periodLabel}
            </strong>

            <small>
              {formatVNDate(
                from
              )}
              {" → "}
              {formatVNDate(
                to
              )}
            </small>
          </div>

          <div className="report-stock-actions stock-report-actions">
            <button
              className="report-btn light"
              type="button"
              onClick={load}
              disabled={
                loading
              }
            >
              {loading
                ? "Đang tải..."
                : "Làm mới"}
            </button>

            <button
              className="report-btn primary"
              type="button"
              onClick={
                exportCsv
              }
              disabled={
                loading ||
                report.rows.length ===
                  0
              }
            >
              Xuất CSV
            </button>

            <button
              className="report-btn light"
              type="button"
              onClick={
                handlePrint
              }
              disabled={
                loading
              }
            >
              Xem trước / In báo cáo
            </button>
          </div>
        </section>

        <section className="report-period-summary stock-period-summary">
          <span>
            Kỳ báo cáo
            {" "}
            <strong>
              {periodLabel}
            </strong>
          </span>

          <span>
            Tồn đầu
            {" "}
            <strong>
              {number(
                summary.opening_quantity
              )}
            </strong>
          </span>

          <span>
            Nhập
            {" "}
            <strong>
              {number(
                summary.import_quantity
              )}
            </strong>
          </span>

          <span>
            Xuất
            {" "}
            <strong>
              {number(
                summary.export_quantity
              )}
            </strong>
          </span>

          <span>
            Điều chỉnh
            {" "}
            <strong>
              {number(
                summary.adjustment_quantity
              )}
            </strong>
          </span>

          <span>
            Tồn cuối
            {" "}
            <strong>
              {number(
                summary.closing_quantity
              )}
            </strong>
          </span>

          <span>
            Giá trị tồn
            {" "}
            <strong>
              {money(
                summary.inventory_value
              )}
            </strong>
          </span>
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
              {report.rows.length >
              0 ? (
                report.rows.map(
                  (row) => (
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
                          {row.sku}
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
                )
              ) : (
                <tr>
                  <td
                    colSpan={11}
                    className="report-empty"
                  >
                    Không có dữ liệu
                    trong kỳ báo cáo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>

      <div className="stock-print-only">
        <StockPrintTemplate
          report={report}
          from={from}
          to={to}
          mode={mode}
          monthValue={
            monthValue
          }
          weekValue={
            weekValue
          }
        />
      </div>
    </>
  );
}
