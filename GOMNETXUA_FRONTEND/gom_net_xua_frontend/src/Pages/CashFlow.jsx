import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import CashFlowDashboard from "../Components/CashFlow/cashFlowDashboard";
import CashFlowForms from "../Components/CashFlow/cashFlowForms";
import CashFlowTables from "../Components/CashFlow/cashFlowTables";

import "../Components/CashFlow/cashflow.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

const CASH_FLOW_API = `${API_URL}/cash-flow`;

async function api(path, options = {}) {
  const safePath = path.startsWith("/")
    ? path
    : `/${path}`;

  const url = `${CASH_FLOW_API}${safePath}`;

  const response = await fetch(url, {
    ...options,

    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const raw = await response.text();

  let data = {};

  try {
    data = raw
      ? JSON.parse(raw)
      : {};
  } catch {
    console.error(
      "CASH FLOW API KHÔNG TRẢ JSON:",
      url,
      raw
    );

    throw new Error(
      `API không trả JSON: ${url}`
    );
  }

  if (
    !response.ok ||
    data?.success === false
  ) {
    throw new Error(
      data?.message ||
        `API lỗi ${response.status}`
    );
  }

  return data;
}

/* =========================================================
   DATE
========================================================= */

const today = () => {
  const now = new Date();

  const offset =
    now.getTimezoneOffset();

  return new Date(
    now.getTime() -
      offset * 60000
  )
    .toISOString()
    .slice(0, 10);
};

const currentMonth = () => {
  return today().slice(
    0,
    7
  );
};

/* =========================================================
   PAGE
========================================================= */

export default function CashFlow() {
  const [
    bootstrap,
    setBootstrap,
  ] = useState({
    receipt_sources: [],
    expense_categories: [],
  });

  const [
    dashboard,
    setDashboard,
  ] = useState({
    actual_receipt: 0,
    export_cost: 0,
    operating_expense: 0,
    loss_value: 0,
    profit: 0,
  });

  const [
    receipts,
    setReceipts,
  ] = useState([]);

  const [
    expenses,
    setExpenses,
  ] = useState([]);

  const [
    period,
    setPeriod,
  ] = useState("month");

  const [
    periodValue,
    setPeriodValue,
  ] = useState(
    currentMonth()
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
    loading,
    setLoading,
  ] = useState(false);

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  /* =======================================================
     QUERY STRING
  ======================================================= */

  const periodQuery =
    useMemo(() => {
      const params =
        new URLSearchParams();

      params.set(
        "period",
        period
      );

      if (
        period === "custom"
      ) {
        params.set(
          "from",
          customFrom
        );

        params.set(
          "to",
          customTo
        );
      } else {
        params.set(
          "value",
          periodValue
        );
      }

      return params.toString();
    }, [
      period,
      periodValue,
      customFrom,
      customTo,
    ]);

  /* =======================================================
     LOAD BOOTSTRAP
  ======================================================= */

  const loadBootstrap =
    useCallback(async () => {
      try {
        const result =
          await api(
            "/bootstrap"
          );

        setBootstrap({
          receipt_sources:
            Array.isArray(
              result?.data
                ?.receipt_sources
            )
              ? result.data
                  .receipt_sources
              : [],

          expense_categories:
            Array.isArray(
              result?.data
                ?.expense_categories
            )
              ? result.data
                  .expense_categories
              : [],
        });
      } catch (error) {
        console.error(
          error
        );
      }
    }, []);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadData =
    useCallback(async () => {
      try {
        setLoading(true);

        const [
          dashboardResult,
          receiptResult,
          expenseResult,
        ] =
          await Promise.all([
            api(
              `/dashboard?${periodQuery}`
            ),

            api(
              `/receipts?${periodQuery}`
            ),

            api(
              `/expenses?${periodQuery}`
            ),
          ]);

        setDashboard(
          dashboardResult?.data ||
            {}
        );

        setReceipts(
          Array.isArray(
            receiptResult?.data
          )
            ? receiptResult.data
            : []
        );

        setExpenses(
          Array.isArray(
            expenseResult?.data
          )
            ? expenseResult.data
            : []
        );
      } catch (error) {
        console.error(
          error
        );

        alert(
          error?.message ||
            "Không tải được dữ liệu thu chi"
        );
      } finally {
        setLoading(false);
      }
    }, [
      periodQuery,
    ]);

  useEffect(() => {
    loadBootstrap();
  }, [
    loadBootstrap,
  ]);

  useEffect(() => {
    loadData();
  }, [
    loadData,
    refreshKey,
  ]);

  /* =======================================================
     SAVED
  ======================================================= */

  const handleSaved =
    useCallback(() => {
      setRefreshKey(
        (old) =>
          old + 1
      );
    }, []);

  /* =======================================================
     DELETE
  ======================================================= */

  const deleteReceipt =
    async (id) => {
      if (
        !window.confirm(
          "Xóa khoản thu này?"
        )
      ) {
        return;
      }

      try {
        await api(
          `/receipts/${id}`,
          {
            method:
              "DELETE",
          }
        );

        handleSaved();
      } catch (error) {
        alert(
          error?.message ||
            "Không thể xóa khoản thu"
        );
      }
    };

  const deleteExpense =
    async (id) => {
      if (
        !window.confirm(
          "Xóa khoản chi này?"
        )
      ) {
        return;
      }

      try {
        await api(
          `/expenses/${id}`,
          {
            method:
              "DELETE",
          }
        );

        handleSaved();
      } catch (error) {
        alert(
          error?.message ||
            "Không thể xóa khoản chi"
        );
      }
    };

    /* =======================================================
     PRINT REPORT
  ======================================================= */

  const moneyReport = (value) =>
    new Intl.NumberFormat("vi-VN").format(
      Number(value || 0)
    ) + " đ";

  const dateReport = (value) => {
    if (!value) return "";

    return new Date(value).toLocaleDateString(
      "vi-VN"
    );
  };

  const escapeReport = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  /* =======================================================
     GROUP RECEIPTS BY SOURCE
  ======================================================= */

  const groupReconciliation = (rows = []) => {
    const map = new Map();

    for (const row of rows) {
      const source =
        row.source ||
        "Không xác định";

      if (!map.has(source)) {
        map.set(source, {
          source,
          count: 0,
          statement: 0,
          fee: 0,
          actual: 0,
        });
      }

      const item =
        map.get(source);

      item.count += 1;

      item.statement +=
        Number(
          row.statement_amount ||
            0
        );

      item.fee +=
        Number(
          row.fee_amount ||
            0
        );

      item.actual +=
        Number(
          row.actual_amount ||
            0
        );
    }

    return Array.from(
      map.values()
    ).sort(
      (a, b) =>
        b.actual - a.actual
    );
  };

  /* =======================================================
     REPORT CSS
  ======================================================= */

  const reportCss = `
    <style>

      @page {
        size: A4 portrait;
        margin: 8mm;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;

        font-family:
          "Segoe UI",
          Arial,
          Helvetica,
          sans-serif;

        color: #111;

        background: #fff;

        font-size: 9px;
      }

      body {
        width: 100%;
      }

      .report-toolbar {
        display: flex;
        justify-content: flex-end;
        gap: 8px;

        padding: 8px 0 12px;
      }

      .report-toolbar button {
        border: 0;
        border-radius: 8px;

        padding: 9px 14px;

        font-weight: 700;
        cursor: pointer;
      }

      .report-toolbar .print {
        background: #873e17;
        color: white;
      }

      .report-toolbar .close {
        background: #ead7c5;
        color: #602800;
      }

      .report-page {
        width: 100%;
        max-width: 194mm;

        margin: 0 auto;
      }

      .report-header {
        display: grid;

        grid-template-columns:
          1fr
          auto;

        gap: 15px;

        align-items: start;

        padding-bottom: 8px;

        border-bottom:
          2px solid
          #743515;
      }

      .brand-wrap {
        display: flex;

        align-items: center;

        gap: 10px;
      }

      .brand-logo {
        width: 44px;
        height: 44px;

        flex: 0 0 44px;

        display: flex;
        align-items: center;
        justify-content: center;

        border:
          1.8px solid
          #743515;

        border-radius: 50%;

        color: #743515;

        font-size: 17px;

        font-weight: 800;
      }

      .brand-name {
        margin-bottom: 3px;

        color: #6d2c08;

        font-size: 15px;

        font-weight: 800;
      }

      .brand-detail {
        color: #444;

        line-height: 1.45;
      }

      .report-meta {
        min-width: 150px;

        text-align: right;

        line-height: 1.5;
      }

      .report-title {
        padding: 10px 0 8px;

        text-align: center;
      }

      .report-title h1 {
        margin: 0;

        font-size: 17px;

        color: #1f160f;
      }

      .report-title p {
        margin: 3px 0 0;

        color: #777;
      }

      .period-row {
        display: grid;

        grid-template-columns:
          1fr
          1fr;

        margin-bottom: 8px;

        border:
          1px solid
          #bfae9f;
      }

      .period-row > div {
        padding: 6px 8px;
      }

      .summary-strip {
        display: grid;

        grid-template-columns:
          repeat(
            5,
            minmax(0, 1fr)
          );

        gap: 0;

        margin-bottom: 9px;

        border:
          1px solid
          #bfae9f;
      }

      .summary-item {
        padding: 6px;

        border-right:
          1px solid
          #d0c1b5;

        text-align: center;
      }

      .summary-item:last-child {
        border-right: 0;
      }

      .summary-item span {
        display: block;

        margin-bottom: 3px;

        color: #675445;

        font-size: 8px;
      }

      .summary-item strong {
        display: block;

        font-size: 10px;
      }

      .summary-item.profit strong {
        color: #9f2e25;
      }

      .section-title {
        margin:
          9px
          0
          4px;

        color: #4f2209;

        font-size: 11px;

        font-weight: 800;
      }

      table {
        width: 100%;

        border-collapse:
          collapse;

        margin-bottom: 8px;
      }

      th,
      td {
        border:
          1px solid
          #837368;

        padding: 4px 5px;

        vertical-align: middle;
      }

      th {
        background: #eee2d7;

        color: #4e2209;

        text-align: center;

        font-weight: 800;
      }

      td.center {
        text-align: center;
      }

      td.right {
        text-align: right;
      }

      .total-row td {
        background: #faf4ee;

        font-weight: 800;
      }

      .carrier-table th {
        background: #7a3918;

        color: white;
      }

      .result-box {
        display: grid;

        grid-template-columns:
          1fr
          1fr;

        border:
          1px solid
          #9b8778;

        margin-top: 8px;
      }

      .result-box div {
        padding: 6px 8px;

        border-bottom:
          1px solid
          #ddd1c8;
      }

      .result-box div:nth-last-child(-n + 2) {
        border-bottom: 0;
      }

      .result-box strong {
        float: right;
      }

      .signature {
        display: grid;

        grid-template-columns:
          repeat(
            3,
            1fr
          );

        min-height: 88px;

        margin-top: 12px;

        text-align: center;
      }

      .signature-title {
        font-weight: 800;
      }

      .signature-note {
        display: block;

        margin-top: 40px;
      }

      .report-footer {
        display: flex;

        justify-content: space-between;

        gap: 20px;

        margin-top: 4px;

        padding-top: 4px;

        border-top:
          1px solid
          #aaa;

        color: #666;

        font-size: 7px;
      }

      tr,
      table,
      .result-box,
      .signature {
        page-break-inside: avoid;
      }

      @media print {

        .report-toolbar {
          display: none !important;
        }

        html,
        body {
          width: 210mm;
        }

        .report-page {
          width: 100%;
          max-width: none;
        }

      }

    </style>
  `;

  /* =======================================================
     OPEN PRINT WINDOW
  ======================================================= */

  const openReportWindow = (
    html
  ) => {
    const win =
      window.open(
        "",
        "_blank",
        "width=1100,height=900"
      );

    if (!win) {
      alert(
        "Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup."
      );

      return;
    }

    win.document.open();

    win.document.write(
      html
    );

    win.document.close();

    win.focus();
  };

  /* =======================================================
     HEADER
  ======================================================= */

  const makeReportHeader = (
    title,
    code
  ) => `
    <div class="report-header">

      <div class="brand-wrap">

        <div class="brand-logo">
          NX
        </div>

        <div>

          <div class="brand-name">
            GỐM SỨ ĐẶC SẢN NÉT XƯA
          </div>

          <div class="brand-detail">
            Địa chỉ: Xã Mỹ Hiệp, Đồng Tháp
            <br>
            Hotline: 0926 18 5457
          </div>

        </div>

      </div>

      <div class="report-meta">

        <b>
          Mã biểu mẫu:
        </b>
        ${code}

        <br>

        <b>
          Ngày in:
        </b>
        ${new Date().toLocaleDateString(
          "vi-VN"
        )}

        <br>

        <b>
          Phiên bản:
        </b>
        01

      </div>

    </div>

    <div class="report-title">

      <h1>
        ${title}
      </h1>

      <p>
        Biểu mẫu quản trị nội bộ
      </p>

    </div>
  `;

  /* =======================================================
     CASH FLOW REPORT
  ======================================================= */

  const printCashFlowReport =
    async () => {
      try {
        const result =
          await api(
            `/report?${periodQuery}`
          );

        const data =
          result?.data;

        if (!data) {
          throw new Error(
            "Không có dữ liệu báo cáo"
          );
        }

        const summary =
          data.summary || {};

        const receiptRows =
          (
            data.receipts ||
            []
          )
            .map(
              (row) => `
                <tr>

                  <td class="center">
                    ${escapeReport(
                      dateReport(
                        row.created_at
                      )
                    )}
                  </td>

                  <td>
                    ${escapeReport(
                      row.source ||
                        ""
                    )}
                  </td>

                  <td class="right">
                    ${moneyReport(
                      row.statement_amount
                    )}
                  </td>

                  <td class="right">
                    ${moneyReport(
                      row.fee_amount
                    )}
                  </td>

                  <td class="right">
                    <b>
                      ${moneyReport(
                        row.actual_amount
                      )}
                    </b>
                  </td>

                  <td>
                    ${escapeReport(
                      row.period_code ||
                        ""
                    )}
                  </td>

                </tr>
              `
            )
            .join("");

        const expenseRows =
          (
            data.expenses ||
            []
          )
            .map(
              (row) => `
                <tr>

                  <td class="center">
                    ${escapeReport(
                      dateReport(
                        row.created_at
                      )
                    )}
                  </td>

                  <td>
                    ${escapeReport(
                      row.category ||
                        ""
                    )}
                  </td>

                  <td>
                    ${escapeReport(
                      row.recipient ||
                        ""
                    )}
                  </td>

                  <td class="right">
                    <b>
                      ${moneyReport(
                        row.amount
                      )}
                    </b>
                  </td>

                  <td>
                    ${escapeReport(
                      row.note ||
                        ""
                    )}
                  </td>

                </tr>
              `
            )
            .join("");

        const carrierData =
          groupReconciliation(
            data.receipts ||
              []
          );

        const carrierRows =
          carrierData
            .map(
              (row) => `
                <tr>

                  <td>
                    <b>
                      ${escapeReport(
                        row.source
                      )}
                    </b>
                  </td>

                  <td class="center">
                    ${row.count}
                  </td>

                  <td class="right">
                    ${moneyReport(
                      row.statement
                    )}
                  </td>

                  <td class="right">
                    ${moneyReport(
                      row.fee
                    )}
                  </td>

                  <td class="right">
                    <b>
                      ${moneyReport(
                        row.actual
                      )}
                    </b>
                  </td>

                </tr>
              `
            )
            .join("");

        const html = `
<!doctype html>

<html lang="vi">

<head>

  <meta charset="UTF-8">

  <title>
    Báo cáo thu chi và lãi lỗ
  </title>

  ${reportCss}

</head>

<body>

  <div class="report-toolbar">

    <button
      class="print"
      onclick="window.print()"
    >
      In / Lưu PDF
    </button>

    <button
      class="close"
      onclick="window.close()"
    >
      Đóng
    </button>

  </div>

  <div class="report-page">

    ${makeReportHeader(
      "BÁO CÁO THU CHI VÀ LÃI LỖ",
      "NX-BM-TC-01"
    )}

    <div class="period-row">

      <div>
        <b>Từ ngày:</b>
        ${
          data.period?.from
            ? dateReport(
                data.period.from
              )
            : ""
        }
      </div>

      <div>
        <b>Đến ngày:</b>
        ${
          data.period?.to
            ? dateReport(
                data.period.to
              )
            : ""
        }
      </div>

    </div>

    <div class="summary-strip">

      <div class="summary-item">

        <span>
          THỰC NHẬN
        </span>

        <strong>
          ${moneyReport(
            summary.actual_receipt
          )}
        </strong>

      </div>

      <div class="summary-item">

        <span>
          GIÁ VỐN XUẤT
        </span>

        <strong>
          ${moneyReport(
            summary.export_cost
          )}
        </strong>

      </div>

      <div class="summary-item">

        <span>
          CHI PHÍ
        </span>

        <strong>
          ${moneyReport(
            summary.operating_expense
          )}
        </strong>

      </div>

      <div class="summary-item">

        <span>
          BỂ VỠ / THẤT THOÁT
        </span>

        <strong>
          ${moneyReport(
            summary.loss_value
          )}
        </strong>

      </div>

      <div class="summary-item profit">

        <span>
          LÃI / LỖ
        </span>

        <strong>
          ${moneyReport(
            summary.profit
          )}
        </strong>

      </div>

    </div>

    <div class="section-title">
      I. KHOẢN THU / ĐỐI SOÁT
    </div>

    <table>

      <thead>

        <tr>
          <th>Ngày</th>
          <th>Nguồn</th>
          <th>Tổng sao kê</th>
          <th>Phí / Khấu trừ</th>
          <th>Thực nhận</th>
          <th>Mã kỳ</th>
        </tr>

      </thead>

      <tbody>

        ${
          receiptRows ||
          `
            <tr>
              <td
                colspan="6"
                class="center"
              >
                Không có khoản thu
              </td>
            </tr>
          `
        }

        <tr class="total-row">

          <td colspan="2">
            TỔNG
          </td>

          <td class="right">
            ${moneyReport(
              summary.statement_amount
            )}
          </td>

          <td class="right">
            ${moneyReport(
              summary.receipt_fee
            )}
          </td>

          <td class="right">
            ${moneyReport(
              summary.actual_receipt
            )}
          </td>

          <td></td>

        </tr>

      </tbody>

    </table>

    <div class="section-title">
      II. TỔNG HỢP THEO ĐƠN VỊ VẬN CHUYỂN / NGUỒN THU
    </div>

    <table class="carrier-table">

      <thead>

        <tr>
          <th>Đơn vị / Nguồn</th>
          <th>Số kỳ</th>
          <th>Tổng sao kê</th>
          <th>Phí / Khấu trừ</th>
          <th>Thực nhận</th>
        </tr>

      </thead>

      <tbody>

        ${
          carrierRows ||
          `
            <tr>
              <td
                colspan="5"
                class="center"
              >
                Không có dữ liệu đối soát
              </td>
            </tr>
          `
        }

      </tbody>

    </table>

    <div class="section-title">
      III. KHOẢN CHI
    </div>

    <table>

      <thead>

        <tr>
          <th>Ngày</th>
          <th>Nhóm chi</th>
          <th>Người nhận</th>
          <th>Số tiền</th>
          <th>Ghi chú</th>
        </tr>

      </thead>

      <tbody>

        ${
          expenseRows ||
          `
            <tr>
              <td
                colspan="5"
                class="center"
              >
                Không có khoản chi
              </td>
            </tr>
          `
        }

        <tr class="total-row">

          <td colspan="3">
            TỔNG CHI
          </td>

          <td class="right">
            ${moneyReport(
              summary.operating_expense
            )}
          </td>

          <td></td>

        </tr>

      </tbody>

    </table>

    <div class="signature">

      <div>

        <span class="signature-title">
          Người lập biểu
        </span>

        <span class="signature-note">
          (Ký, ghi rõ họ tên)
        </span>

      </div>

      <div>

        <span class="signature-title">
          Thủ kho / Kế toán
        </span>

        <span class="signature-note">
          (Ký, ghi rõ họ tên)
        </span>

      </div>

      <div>

        <span class="signature-title">
          Người phê duyệt
        </span>

        <span class="signature-note">
          (Ký, ghi rõ họ tên)
        </span>

      </div>

    </div>

    <div class="report-footer">

      <span>
        Gốm Sứ Đặc Sản Nét Xưa · Xã Mỹ Hiệp, Đồng Tháp
      </span>

      <span>
        Hotline: 0926 18 5457
      </span>

    </div>

  </div>

</body>

</html>
        `;

        openReportWindow(
          html
        );
      } catch (error) {
        console.error(
          error
        );

        alert(
          error?.message ||
            "Không thể tạo báo cáo thu chi"
        );
      }
    };

  /* =======================================================
     RECONCILIATION REPORT
  ======================================================= */

  const printReconciliationReport =
    async () => {
      try {
        const result =
          await api(
            `/report?${periodQuery}`
          );

        const data =
          result?.data;

        if (!data) {
          throw new Error(
            "Không có dữ liệu đối soát"
          );
        }

        const receipts =
          Array.isArray(
            data.receipts
          )
            ? data.receipts
            : [];

        const carrierData =
          groupReconciliation(
            receipts
          );

        const totalStatement =
          carrierData.reduce(
            (sum, row) =>
              sum +
              row.statement,
            0
          );

        const totalFee =
          carrierData.reduce(
            (sum, row) =>
              sum +
              row.fee,
            0
          );

        const totalActual =
          carrierData.reduce(
            (sum, row) =>
              sum +
              row.actual,
            0
          );

        const totalPeriods =
          carrierData.reduce(
            (sum, row) =>
              sum +
              row.count,
            0
          );

        const difference =
          totalStatement -
          totalFee -
          totalActual;

        const carrierRows =
          carrierData
            .map(
              (
                row,
                index
              ) => `
                <tr>

                  <td class="center">
                    ${index + 1}
                  </td>

                  <td>
                    <b>
                      ${escapeReport(
                        row.source
                      )}
                    </b>
                  </td>

                  <td class="center">
                    ${row.count}
                  </td>

                  <td class="right">
                    ${moneyReport(
                      row.statement
                    )}
                  </td>

                  <td class="right">
                    ${moneyReport(
                      row.fee
                    )}
                  </td>

                  <td class="right">
                    <b>
                      ${moneyReport(
                        row.actual
                      )}
                    </b>
                  </td>

                </tr>
              `
            )
            .join("");

        const detailRows =
          receipts
            .map(
              (row) => `
                <tr>

                  <td class="center">
                    ${escapeReport(
                      dateReport(
                        row.created_at
                      )
                    )}
                  </td>

                  <td>
                    ${escapeReport(
                      row.source ||
                        ""
                    )}
                  </td>

                  <td class="right">
                    ${moneyReport(
                      row.statement_amount
                    )}
                  </td>

                  <td class="right">
                    ${moneyReport(
                      row.fee_amount
                    )}
                  </td>

                  <td class="right">
                    <b>
                      ${moneyReport(
                        row.actual_amount
                      )}
                    </b>
                  </td>

                  <td>
                    ${escapeReport(
                      row.period_code ||
                        ""
                    )}
                  </td>

                  <td>
                    ${escapeReport(
                      row.note ||
                        ""
                    )}
                  </td>

                </tr>
              `
            )
            .join("");

        const html = `
<!doctype html>

<html lang="vi">

<head>

  <meta charset="UTF-8">

  <title>
    Báo cáo đối soát
  </title>

  ${reportCss}

</head>

<body>

  <div class="report-toolbar">

    <button
      class="print"
      onclick="window.print()"
    >
      In / Lưu PDF
    </button>

    <button
      class="close"
      onclick="window.close()"
    >
      Đóng
    </button>

  </div>

  <div class="report-page">

    ${makeReportHeader(
      "BÁO CÁO ĐỐI SOÁT ĐƠN VỊ VẬN CHUYỂN",
      "NX-BM-DS-01"
    )}

    <div class="period-row">

      <div>
        <b>
          Từ ngày:
        </b>

        ${
          data.period?.from
            ? dateReport(
                data.period.from
              )
            : ""
        }
      </div>

      <div>
        <b>
          Đến ngày:
        </b>

        ${
          data.period?.to
            ? dateReport(
                data.period.to
              )
            : ""
        }
      </div>

    </div>

    <div class="section-title">
      I. TỔNG HỢP ĐỐI SOÁT THEO ĐƠN VỊ
    </div>

    <table class="carrier-table">

      <thead>

        <tr>
          <th>STT</th>
          <th>Đơn vị vận chuyển / Nguồn</th>
          <th>Số kỳ</th>
          <th>Tổng sao kê</th>
          <th>Phí / Khấu trừ</th>
          <th>Thực nhận</th>
        </tr>

      </thead>

      <tbody>

        ${
          carrierRows ||
          `
            <tr>
              <td
                colspan="6"
                class="center"
              >
                Không có dữ liệu đối soát
              </td>
            </tr>
          `
        }

        <tr class="total-row">

          <td colspan="2">
            TỔNG CỘNG
          </td>

          <td class="center">
            ${totalPeriods}
          </td>

          <td class="right">
            ${moneyReport(
              totalStatement
            )}
          </td>

          <td class="right">
            ${moneyReport(
              totalFee
            )}
          </td>

          <td class="right">
            ${moneyReport(
              totalActual
            )}
          </td>

        </tr>

      </tbody>

    </table>

    <div class="section-title">
      II. CHI TIẾT CÁC KỲ ĐỐI SOÁT
    </div>

    <table>

      <thead>

        <tr>
          <th>Ngày</th>
          <th>Đơn vị</th>
          <th>Sao kê</th>
          <th>Phí / Khấu trừ</th>
          <th>Thực nhận</th>
          <th>Mã kỳ</th>
          <th>Ghi chú</th>
        </tr>

      </thead>

      <tbody>

        ${
          detailRows ||
          `
            <tr>
              <td
                colspan="7"
                class="center"
              >
                Không có dữ liệu
              </td>
            </tr>
          `
        }

      </tbody>

    </table>

    <div class="section-title">
      III. KIỂM TRA CHÊNH LỆCH
    </div>

    <div class="result-box">

      <div>
        Tổng sao kê

        <strong>
          ${moneyReport(
            totalStatement
          )}
        </strong>
      </div>

      <div>
        Tổng phí / khấu trừ

        <strong>
          ${moneyReport(
            totalFee
          )}
        </strong>
      </div>

      <div>
        Tổng thực nhận

        <strong>
          ${moneyReport(
            totalActual
          )}
        </strong>
      </div>

      <div>
        Chênh lệch

        <strong>
          ${moneyReport(
            difference
          )}
        </strong>
      </div>

    </div>

    <div class="signature">

      <div>

        <span class="signature-title">
          Người lập đối soát
        </span>

        <span class="signature-note">
          (Ký, ghi rõ họ tên)
        </span>

      </div>

      <div>

        <span class="signature-title">
          Thủ kho / Kế toán
        </span>

        <span class="signature-note">
          (Ký, ghi rõ họ tên)
        </span>

      </div>

      <div>

        <span class="signature-title">
          Người phê duyệt
        </span>

        <span class="signature-note">
          (Ký, ghi rõ họ tên)
        </span>

      </div>

    </div>

    <div class="report-footer">

      <span>
        Gốm Sứ Đặc Sản Nét Xưa · Xã Mỹ Hiệp, Đồng Tháp
      </span>

      <span>
        Hotline: 0926 18 5457
      </span>

    </div>

  </div>

</body>

</html>
        `;

        openReportWindow(
          html
        );
      } catch (error) {
        console.error(
          error
        );

        alert(
          error?.message ||
            "Không thể tạo báo cáo đối soát"
        );
      }
    };
  return (
    <main className="cashflow-page">

      <CashFlowDashboard
  dashboard={
    dashboard
  }

  period={
    period
  }

  setPeriod={
    setPeriod
  }

  periodValue={
    periodValue
  }

  setPeriodValue={
    setPeriodValue
  }

  customFrom={
    customFrom
  }

  setCustomFrom={
    setCustomFrom
  }

  customTo={
    customTo
  }

  setCustomTo={
    setCustomTo
  }

  onView={
    loadData
  }

  onPrintCashFlow={
    printCashFlowReport
  }

  onPrintReconciliation={
    printReconciliationReport
  }

  loading={
    loading
  }
/>
      <CashFlowForms
        api={
          api
        }

        receiptSources={
          bootstrap.receipt_sources
        }

        expenseCategories={
          bootstrap.expense_categories
        }

        onSaved={
          handleSaved
        }
      />

      <CashFlowTables
        receipts={
          receipts
        }

        expenses={
          expenses
        }

        onDeleteReceipt={
          deleteReceipt
        }

        onDeleteExpense={
          deleteExpense
        }
      />

    </main>
  );
}