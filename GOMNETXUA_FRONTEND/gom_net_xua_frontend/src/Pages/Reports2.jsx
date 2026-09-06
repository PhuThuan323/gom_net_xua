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

const escapeHtml = (
  value
) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

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
   PRINT - CỬA SỔ RIÊNG
   Không dùng CSS @media print của app để tránh xung đột.
========================================================= */

const buildPrintHtml = ({
  report,
  from,
  to,
  periodLabel,
}) => {
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

  const pageHtml =
    pages
      .map(
        (
          pageRows,
          pageIndex
        ) => {
          const currentPage =
            pageIndex + 1;

          const startIndex =
            pageIndex *
            ROWS_PER_PAGE;

          const tableRows =
            pageRows.length > 0
              ? pageRows
                  .map(
                    (
                      row,
                      index
                    ) => `
                      <tr>
                        <td>${startIndex + index + 1}</td>
                        <td class="left">${escapeHtml(row.product_name)}</td>
                        <td class="left">${escapeHtml(row.size || "—")}</td>
                        <td>${escapeHtml(row.sku || "—")}</td>
                        <td>${number(row.opening_quantity)}</td>
                        <td>${number(row.import_quantity)}</td>
                        <td>${number(row.export_quantity)}</td>
                        <td>${number(row.adjustment_quantity)}</td>
                        <td>${number(row.closing_quantity)}</td>
                        <td>${money(row.purchase_price)}</td>
                        <td>${money(row.inventory_value)}</td>
                      </tr>
                    `
                  )
                  .join("")
              : `
                <tr>
                  <td
                    colspan="11"
                    class="empty"
                  >
                    Chưa có dữ liệu kho trong kỳ báo cáo.
                  </td>
                </tr>
              `;

          const summaryHtml =
            pageIndex === 0
              ? `
                <div class="period-row">
                  <div>
                    <b>Kỳ báo cáo:</b>
                    ${escapeHtml(periodLabel)}
                  </div>

                  <div class="right">
                    <b>
                      ${escapeHtml(formatVNDate(from))}
                      →
                      ${escapeHtml(formatVNDate(to))}
                    </b>
                  </div>
                </div>

                <div class="summary-row">
                  <span>
                    Tồn đầu
                    <b>${number(summary.opening_quantity)}</b>
                  </span>

                  <span>
                    Nhập
                    <b>${number(summary.import_quantity)}</b>
                  </span>

                  <span>
                    Xuất
                    <b>${number(summary.export_quantity)}</b>
                  </span>

                  <span>
                    Điều chỉnh
                    <b>${number(summary.adjustment_quantity)}</b>
                  </span>

                  <span>
                    Tồn cuối
                    <b>${number(summary.closing_quantity)}</b>
                  </span>

                  <span>
                    Giá trị tồn
                    <b>${money(summary.inventory_value)}</b>
                  </span>
                </div>
              `
              : "";

          const signatureHtml =
            currentPage ===
            totalPages
              ? `
                <div class="signatures">
                  <div>
                    <b>Người lập biểu</b>
                    <span>(Ký, ghi rõ họ tên)</span>
                  </div>

                  <div>
                    <b>Thủ kho / Kế toán</b>
                    <span>(Ký, ghi rõ họ tên)</span>
                  </div>

                  <div>
                    <b>Người phê duyệt</b>
                    <span>(Ký, ghi rõ họ tên)</span>
                  </div>
                </div>
              `
              : "";

          return `
            <section class="page">
              <div class="topline">
                <div>
                  ${escapeHtml(formatDateTime(printDate))}
                </div>

                <div class="top-title">
                  BÁO CÁO KHO
                </div>

                <div class="meta">
                  <div>
                    Mã biểu mẫu: NX-BC-01
                  </div>

                  <div>
                    Ngày in:
                    ${escapeHtml(printDate.toLocaleDateString("vi-VN"))}
                  </div>

                  <div>
                    Phiên bản: 01
                  </div>
                </div>
              </div>

              <div class="brand">
                <div class="logo">
                  NX
                </div>

                <div>
                  <h2>
                    ${escapeHtml(COMPANY.name)}
                  </h2>

                  <p>
                    Địa chỉ:
                    ${escapeHtml(COMPANY.address)}
                  </p>

                  <p>
                    Hotline:
                    ${escapeHtml(COMPANY.hotline)}
                  </p>
                </div>
              </div>

              <div class="divider"></div>

              <div class="title">
                <h1>
                  BÁO CÁO KHO
                </h1>

                <p>
                  Biểu mẫu quản trị nội bộ
                </p>
              </div>

              ${summaryHtml}

              <table>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Sản phẩm gốc</th>
                    <th>Biến thể</th>
                    <th>SKU</th>
                    <th>Tồn đầu</th>
                    <th>Nhập</th>
                    <th>Xuất</th>
                    <th>Điều chỉnh</th>
                    <th>Tồn cuối</th>
                    <th>Giá vốn</th>
                    <th>Giá trị tồn</th>
                  </tr>
                </thead>

                <tbody>
                  ${tableRows}
                </tbody>
              </table>

              ${signatureHtml}

              <div class="footer">
                <span>
                  ${escapeHtml(COMPANY.website)}
                </span>

                <span>
                  ${currentPage}/${totalPages}
                </span>
              </div>
            </section>
          `;
        }
      )
      .join("");

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />

  <title>
    Báo cáo kho - ${escapeHtml(periodLabel)}
  </title>

  <style>
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;

      background: #ffffff;

      color: #111111;

      font-family:
        Arial,
        "Segoe UI",
        sans-serif;
    }

    .page {
      position: relative;

      width: 210mm;
      min-height: 297mm;

      margin: 0 auto;

      padding:
        7mm
        10mm
        9mm;

      background: white;

      page-break-after: always;

      break-after: page;
    }

    .page:last-child {
      page-break-after: auto;

      break-after: auto;
    }

    .topline {
      display: grid;

      grid-template-columns:
        1fr
        1.3fr
        1fr;

      gap: 4mm;

      align-items: start;

      font-size: 7pt;
    }

    .top-title {
      text-align: center;

      font-weight: 800;
    }

    .meta {
      text-align: right;

      line-height: 1.45;
    }

    .brand {
      display: flex;

      align-items: center;

      gap: 3mm;

      margin-top: 1mm;
    }

    .logo {
      display: flex;

      align-items: center;
      justify-content: center;

      width: 14mm;
      height: 14mm;

      flex: 0 0 14mm;

      border:
        0.5mm solid #444;

      border-radius: 50%;

      font-size: 13pt;

      font-weight: 900;
    }

    .brand h2 {
      margin:
        0 0 1mm;

      font-size: 13pt;
    }

    .brand p {
      margin:
        0.4mm 0;

      font-size: 7.2pt;
    }

    .divider {
      margin:
        2mm 0 3mm;

      border-top:
        0.6mm solid #333;
    }

    .title {
      margin-bottom:
        3mm;

      text-align: center;
    }

    .title h1 {
      margin: 0;

      font-size: 14pt;

      font-weight: 900;
    }

    .title p {
      margin:
        1mm 0 0;

      font-size: 7.5pt;
    }

    .period-row {
      display: grid;

      grid-template-columns:
        1fr 1fr;

      gap: 3mm;

      margin-bottom: 2mm;

      padding:
        1.7mm
        2.5mm;

      border:
        0.25mm solid #999;

      font-size: 7.5pt;
    }

    .period-row .right {
      text-align: right;
    }

    .summary-row {
      display: grid;

      grid-template-columns:
        repeat(
          6,
          minmax(0, 1fr)
        );

      margin-bottom:
        2.5mm;

      border:
        0.25mm solid #999;

      font-size: 6.8pt;
    }

    .summary-row span {
      padding:
        1.4mm
        1mm;

      text-align: center;

      border-right:
        0.2mm solid #bbb;
    }

    .summary-row span:last-child {
      border-right: 0;
    }

    .summary-row b {
      display: block;

      margin-top:
        0.5mm;
    }

    table {
      width: 100%;

      table-layout: fixed;

      border-collapse:
        collapse;

      font-size:
        6.35pt;
    }

    th,
    td {
      border:
        0.25mm solid #555;

      padding:
        1mm
        0.75mm;

      vertical-align:
        middle;

      text-align:
        center;

      line-height:
        1.12;

      word-break:
        break-word;
    }

    th {
      background:
        #f3f3f3;

      font-weight:
        800;
    }

    th:nth-child(1) {
      width: 4%;
    }

    th:nth-child(2) {
      width: 18%;
    }

    th:nth-child(3) {
      width: 15%;
    }

    th:nth-child(4) {
      width: 10%;
    }

    th:nth-child(5) {
      width: 7%;
    }

    th:nth-child(6) {
      width: 6%;
    }

    th:nth-child(7) {
      width: 6%;
    }

    th:nth-child(8) {
      width: 8%;
    }

    th:nth-child(9) {
      width: 7%;
    }

    th:nth-child(10) {
      width: 9%;
    }

    th:nth-child(11) {
      width: 10%;
    }

    td.left {
      text-align: left;
    }

    .empty {
      height: 22mm;

      color: #777;
    }

    .signatures {
      display: grid;

      grid-template-columns:
        repeat(
          3,
          1fr
        );

      gap: 5mm;

      margin-top:
        6mm;

      text-align: center;
    }

    .signatures b {
      display: block;

      margin-bottom:
        12mm;

      font-size:
        7.5pt;
    }

    .signatures span {
      font-size: 6.8pt;

      font-style: italic;
    }

    .footer {
      position: absolute;

      right: 10mm;
      bottom: 4mm;
      left: 10mm;

      display: flex;

      justify-content:
        space-between;

      font-size: 6.3pt;
    }

    @page {
      size:
        A4 portrait;

      margin: 0;
    }

    @media print {
      html,
      body {
        width: 210mm;

        background:
          #ffffff !important;

        -webkit-print-color-adjust:
          exact;

        print-color-adjust:
          exact;
      }
    }
  </style>
</head>

<body>
  ${pageHtml}

  <script>
    window.addEventListener(
      "load",
      function () {
        setTimeout(
          function () {
            window.focus();
            window.print();
          },
          250
        );
      }
    );
  </script>
</body>
</html>
  `;
};

const printStockReport = (
  args
) => {
  const printWindow =
    window.open(
      "",
      "_blank",
      "width=1100,height=900"
    );

  if (!printWindow) {
    alert(
      "Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép pop-up rồi thử lại."
    );

    return;
  }

  const html =
    buildPrintHtml(
      args
    );

  printWindow.document.open();

  printWindow.document.write(
    html
  );

  printWindow.document.close();
};

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
      printStockReport({
        report,
        from,
        to,
        periodLabel,
      });
    };

  const summary =
    report.summary || {};

  return (
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
  );
}
