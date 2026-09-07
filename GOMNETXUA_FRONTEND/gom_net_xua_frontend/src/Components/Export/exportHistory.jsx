import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import JsBarcode from "jsbarcode";

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

const dateTimeVN = (
  value
) => {
  if (!value) return "";

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleString(
    "vi-VN"
  );
};

const dateVN = (
  value
) => {
  if (!value) return "";

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "vi-VN"
  );
};

const extractInfo = (
  note
) => {
  const text =
    String(
      note || ""
    );

  const exportCode =
    text.match(
      /Phiếu xuất:\s*([^|]+)/
    )?.[1]?.trim() ||
    "—";

  const exportedBy =
    text.match(
      /Người xuất:\s*([^|]+)/
    )?.[1]?.trim() ||
    "—";

  const invoiceCode =
    text.match(
      /Báo giá:\s*([^|]+)/
    )?.[1]?.trim() ||
    "—";

  const channelNote =
    text.match(
      /Kênh\/Ghi chú:\s*([^|]+)/
    )?.[1]?.trim() ||
    "";

  return {
    exportCode,
    exportedBy,
    invoiceCode,
    channelNote,
  };
};

const escapeHtml = (
  value
) =>
  String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );


/* =========================================================
   BARCODE SVG - CODE128
   - Dùng CHÍNH JsBarcode giống phần Tem & Mã vạch.
   - Không tự vẽ Code39 nữa.
   - displayValue = true để mã chữ nằm dưới barcode.
   - Kích thước lớn hơn để máy quét đọc ổn định trên A4.
========================================================= */

const buildBarcodeSvg = (
  value
) => {
  const clean =
    String(
      value ?? ""
    ).trim();

  if (!clean) {
    return `
      <span class="barcode-missing">
        Chưa có mã vạch
      </span>
    `;
  }

  /*
   * Hàm này chạy khi người dùng bấm "In phiếu"
   * trên trình duyệt, vì vậy có thể tạo SVG tạm
   * rồi để JsBarcode render giống hệt trang Tem.
   */
  const svg =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );

  try {
    JsBarcode(
      svg,
      clean,
      {
        format:
          "CODE128",

        displayValue:
          true,

        /*
         * Giữ thông số gần giống BarcodeDisplay:
         * width 2 / height 60 / margin 10.
         */
        width:
          2,

        height:
          60,

        margin:
          10,

        fontSize:
          14,

        textMargin:
          3,

        background:
          "#ffffff",

        lineColor:
          "#000000",
      }
    );

    svg.setAttribute(
      "class",
      "receipt-barcode"
    );

    svg.setAttribute(
      "role",
      "img"
    );

    svg.setAttribute(
      "aria-label",
      `Mã vạch ${clean}`
    );

    return svg.outerHTML;
  } catch (error) {
    console.error(
      "Lỗi tạo barcode phiếu xuất:",
      error
    );

    return `
      <div class="barcode-error">
        Không tạo được barcode
        <small>${escapeHtml(
          clean
        )}</small>
      </div>
    `;
  }
};


function buildReceiptPrintHtml(
  receipt,
  isAdmin
) {
  const items =
    Array.isArray(
      receipt?.items
    )
      ? receipt.items
      : [];

  const totalQuantity =
    items.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.quantity ||
            0
        ),
      0
    );

  const totalCost =
    items.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.total_cost ||
            0
        ),
      0
    );

  const rows =
    items
      .map(
        (
          item,
          index
        ) => {
          const variant =
            item.variant ||
            {};

          return `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(
                variant.product_name ||
                  ""
              )}</td>
              <td>${escapeHtml(
                variant.size ||
                  ""
              )}</td>
              <td class="barcode-cell">
                ${buildBarcodeSvg(
                  variant.barcode
                )}
              </td>
              <td class="center">${Number(
                item.quantity ||
                  0
              ).toLocaleString(
                "vi-VN"
              )}</td>
              ${
                isAdmin
                  ? `
                    <td class="money">${money(
                      item.unit_cost
                    )}</td>
                    <td class="money">${money(
                      item.total_cost
                    )}</td>
                  `
                  : ""
              }
            </tr>
          `;
        }
      )
      .join("");

  return `
<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(
    receipt?.export_code ||
      "Phiếu xuất kho"
  )}</title>

<style>

@page {
  size: A4;
  margin: 10mm 12mm;
}

* {
  box-sizing: border-box;
}
.barcode-cell {
  width: 70mm;
  min-width: 64mm;

  text-align: center;
  vertical-align: middle;

  padding: 2.5mm 2mm;

  background: #fff;
}

.receipt-barcode {
  display: block;

  /*
   * SVG được JsBarcode tạo theo CODE128.
   * Chỉ scale theo chiều ngang, không ép méo chiều cao.
   */
  width: 68mm;
  max-width: 100%;
  height: auto;

  margin: 0 auto;

  overflow: visible;

  background: #fff;
}

.barcode-missing {
  display: inline-block;

  color: #777;

  font-size: 8px;
  font-style: italic;
}


.barcode-error {
  color: #a22;
  font-size: 8px;
  text-align: center;
}

.barcode-error small {
  display: block;
  margin-top: 2px;
  color: #555;
}
body {
  margin: 0;
  color: #111;
  background: #fff;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10px;
}

.sheet {
  width: 100%;
  max-width: 190mm;
  margin: 0 auto;
}

.top-line {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  font-size: 8px;
  margin-bottom: 4px;
}

.top-line .center {
  text-align: center;
  font-weight: 700;
}

.top-line .right {
  text-align: right;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  width: 48px;
  height: 48px;
  border: 2px solid #444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 900;
}

.brand h2 {
  margin: 0 0 4px;
  font-size: 17px;
}

.brand p {
  margin: 2px 0;
}

.divider {
  margin: 8px 0 10px;
  border-top: 2px solid #444;
}

.title {
  text-align: center;
  margin-bottom: 10px;
}

.title h1 {
  margin: 0;
  font-size: 19px;
}

.title p {
  margin: 3px 0 0;
}

.info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 20px;
  border: 1px solid #999;
  padding: 8px;
  margin-bottom: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #777;
  padding: 5px 6px;
}

th {
  background: #f3f3f3;
  text-align: center;
}

td.center {
  text-align: center;
}

td.money {
  text-align: right;
}

.summary {
  margin-top: 8px;
  border: 1px solid #777;
  padding: 7px;
  text-align: right;
  font-weight: 700;
}

.signatures {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 22px;
  text-align: center;
  min-height: 85px;
}

.signatures span {
  display: block;
  margin-top: 40px;
  font-style: italic;
  font-weight: 400;
}

.footer {
  display: flex;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 5px;
  border-top: 1px solid #aaa;
  font-size: 8px;
}

@media print {
  .no-print {
    display: none !important;
  }

  tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .receipt-barcode,
  .barcode-cell {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /*
   * Máy quét barcode cần nét đen rõ.
   */
  .receipt-barcode {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>
</head>

<body>

<div class="sheet">

  <div class="top-line">
    <div>${escapeHtml(
      dateTimeVN(
        new Date()
      )
    )}</div>

    <div class="center">
      PHIẾU XUẤT KHO
    </div>

    <div class="right">
      Mã biểu mẫu: NX-BM-01<br>
      Ngày in: ${escapeHtml(
        dateVN(
          new Date()
        )
      )}<br>
      Phiên bản: 01
    </div>
  </div>

  <div class="brand">
    <div class="logo">
      NX
    </div>

    <div>
      <h2>
        GỐM SỨ ĐẶC SẢN NÉT XƯA
      </h2>

      <p>
        Địa chỉ: Xã Mỹ Hiệp, Đồng Tháp
      </p>

      <p>
        Hotline: 0926 18 5457
      </p>
    </div>
  </div>

  <div class="divider"></div>

  <div class="title">
    <h1>PHIẾU XUẤT KHO</h1>
    <p>Biểu mẫu quản trị nội bộ</p>
  </div>

  <div class="info">
    <div>
      <b>Số phiếu:</b>
      ${escapeHtml(
        receipt?.export_code ||
          ""
      )}
    </div>

    <div>
      <b>Ngày:</b>
      ${escapeHtml(
        dateVN(
          receipt?.export_date
        )
      )}
    </div>

    <div>
      <b>Đối tượng:</b>
      ${
        receipt?.source_invoice_code
          ? `Xuất theo báo giá ${escapeHtml(
              receipt.source_invoice_code
            )}`
          : "Xuất cuối ngày"
      }
    </div>

    <div>
      <b>Người thực hiện:</b>
      ${escapeHtml(
        receipt?.exported_by ||
          ""
      )}
    </div>

    ${
      receipt?.channel_note
        ? `
          <div style="grid-column: 1 / -1;">
            <b>Ghi chú/Kênh:</b>
            ${escapeHtml(
              receipt.channel_note
            )}
          </div>
        `
        : ""
    }
  </div>

  <table>
    <thead>
      <tr>
        <th>STT</th>
        <th>Sản phẩm gốc</th>
        <th>Biến thể</th>
        <th>Mã vạch</th>
        <th>SL</th>
        ${
          isAdmin
            ? `
              <th>Giá vốn</th>
              <th>Thành tiền</th>
            `
            : ""
        }
      </tr>
    </thead>

    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="summary">
    Tổng số lượng:
    ${totalQuantity.toLocaleString(
      "vi-VN"
    )}
    ${
      isAdmin
        ? ` · Tổng giá vốn: ${money(
            totalCost
          )}`
        : ""
    }
  </div>

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

  <div class="footer">
    <div>
      Gốm Sứ Đặc Sản Nét Xưa · Xã Mỹ Hiệp, Đồng Tháp
    </div>

    <div>
      Hotline: 0926 18 5457
    </div>
  </div>

</div>

<script>
window.onload = function () {
  setTimeout(function () {
    window.print();
  }, 250);
};
<\/script>

</body>
</html>
`;
}

export default function ExportHistory({
  api,
  refreshKey,
  isAdmin = false,
  onEdit,
  onChanged,
  editingExportCode = "",
}) {
  const [
    rows,
    setRows,
  ] = useState([]);

  const [
    summary,
    setSummary,
  ] = useState({
    total_quantity: 0,
    total_cost: 0,
  });

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    deletingCode,
    setDeletingCode,
  ] = useState("");

  const [
    printingCode,
    setPrintingCode,
  ] = useState("");

  const load =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          const result =
            await api(
              "/history"
            );

          setRows(
            Array.isArray(
              result?.data
            )
              ? result.data
              : []
          );

          setSummary(
            result?.summary ||
              {
                total_quantity:
                  0,

                total_cost:
                  0,
              }
          );
        } catch (error) {
          console.error(
            error
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        api,
      ]
    );

  useEffect(() => {
    load();
  }, [
    load,
    refreshKey,
  ]);

  /*
   * Lịch sử backend đang trả theo từng sản phẩm.
   * Ở giao diện này ta gom lại thành 1 dòng / 1 phiếu xuất.
   */
  const receipts =
    useMemo(
      () => {
        const map =
          new Map();

        for (
          const row of
            rows
        ) {
          const info =
            extractInfo(
              row.note
            );

          const key =
            info.exportCode &&
            info.exportCode !==
              "—"
              ? info.exportCode
              : `ROW-${row.id}`;

          if (
            !map.has(
              key
            )
          ) {
            map.set(
              key,
              {
                exportCode:
                  info.exportCode,

                exportedBy:
                  info.exportedBy,

                invoiceCode:
                  info.invoiceCode,

                channelNote:
                  info.channelNote,

                created_at:
                  row.created_at,

                item_count:
                  0,

                total_quantity:
                  0,

                total_cost:
                  0,

                rows:
                  [],
              }
            );
          }

          const receipt =
            map.get(
              key
            );

          receipt.item_count +=
            1;

          receipt.total_quantity +=
            Number(
              row.quantity ||
                0
            );

          receipt.total_cost +=
            Number(
              row.total_cost ||
                0
            );

          receipt.rows.push(
            row
          );
        }

        return Array.from(
          map.values()
        );
      },
      [
        rows,
      ]
    );

  const printReceipt =
    async (
      exportCode
    ) => {
      if (
        !exportCode ||
        exportCode ===
          "—"
      ) {
        alert(
          "Phiếu cũ này không có mã phiếu xuất để in."
        );

        return;
      }

      try {
        setPrintingCode(
          exportCode
        );

        const result =
          await api(
            `/receipts/${encodeURIComponent(
              exportCode
            )}`
          );

        const receipt =
          result?.data;

        if (!receipt) {
          throw new Error(
            "Không nhận được dữ liệu phiếu xuất"
          );
        }

        const win =
          window.open(
            "",
            "_blank",
            "width=1050,height=900"
          );

        if (!win) {
          alert(
            "Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup."
          );

          return;
        }

        win.document.open();

        win.document.write(
          buildReceiptPrintHtml(
            receipt,
            isAdmin
          )
        );

        win.document.close();

        win.focus();
      } catch (error) {
        console.error(
          error
        );

        alert(
          error?.message ||
            "Không thể in phiếu xuất"
        );
      } finally {
        setPrintingCode(
          ""
        );
      }
    };

  const deleteReceipt =
    async (
      receipt
    ) => {
      const exportCode =
        receipt.exportCode;

      if (
        !exportCode ||
        exportCode ===
          "—"
      ) {
        alert(
          "Phiếu cũ này không có mã phiếu xuất nên không thể xóa theo phiếu."
        );

        return;
      }

      const linkedInvoice =
        receipt.invoiceCode &&
        receipt.invoiceCode !==
          "—";

      const message =
        linkedInvoice
          ? `Xóa phiếu ${exportCode}?\n\nHệ thống sẽ:\n- Hoàn lại ${receipt.total_quantity} sản phẩm vào kho.\n- Xóa lịch sử của phiếu.\n- Mở lại báo giá ${receipt.invoiceCode} về trạng thái CHƯA XUẤT KHO.`
          : `Xóa phiếu ${exportCode}?\n\nHệ thống sẽ hoàn lại ${receipt.total_quantity} sản phẩm vào kho và xóa lịch sử của phiếu.`;

      const ok =
        window.confirm(
          message
        );

      if (!ok) {
        return;
      }

      try {
        setDeletingCode(
          exportCode
        );

        const result =
          await api(
            `/receipts/${encodeURIComponent(
              exportCode
            )}`,
            {
              method:
                "DELETE",
            }
          );

        alert(
          result?.message ||
            "Đã xóa phiếu xuất"
        );

        await load();

        await onChanged?.();
      } catch (error) {
        console.error(
          error
        );

        alert(
          error?.message ||
            "Không thể xóa phiếu xuất"
        );
      } finally {
        setDeletingCode(
          ""
        );
      }
    };

  return (
    <section className="export-history-card">
      <div className="export-history-heading">
        <div>
          <h2>
            Lịch sử phiếu xuất kho
          </h2>

          <p>
            Mỗi dòng là một phiếu xuất. Có thể in, sửa hoặc xóa phiếu.
          </p>
        </div>

        <div className="export-history-summary">
          <div>
            <span>
              Tổng SL
            </span>

            <strong>
              {summary.total_quantity ||
                0}
            </strong>
          </div>

          {isAdmin && (
            <div>
              <span>
                Giá vốn
              </span>

              <strong>
                {money(
                  summary.total_cost
                )}
              </strong>
            </div>
          )}
        </div>
      </div>

      <div className="export-history-table-wrap">
        <table className="export-history-table export-receipt-table">
          <thead>
            <tr>
              <th>
                Ngày
              </th>

              <th>
                Phiếu xuất
              </th>

              <th>
                Báo giá
              </th>

              <th>
                Người xuất
              </th>

              <th>
                Số biến thể
              </th>

              <th>
                Tổng SL
              </th>

              {isAdmin && (
                <th>
                  Tổng vốn
                </th>
              )}

              <th>
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={
                    isAdmin
                      ? "8"
                      : "7"
                  }
                >
                  Đang tải lịch sử...
                </td>
              </tr>
            ) : receipts.length ===
              0 ? (
              <tr>
                <td
                  colSpan={
                    isAdmin
                      ? "8"
                      : "7"
                  }
                >
                  Chưa có lịch sử xuất kho.
                </td>
              </tr>
            ) : (
              receipts.map(
                (
                  receipt
                ) => {
                  const deleting =
                    deletingCode ===
                    receipt.exportCode;

                  const printing =
                    printingCode ===
                    receipt.exportCode;

                  const editing =
                    editingExportCode ===
                    receipt.exportCode;

                  return (
                    <tr
                      key={
                        receipt.exportCode
                      }
                      className={
                        editing
                          ? "export-receipt-row-editing"
                          : ""
                      }
                    >
                      <td>
                        {dateTimeVN(
                          receipt.created_at
                        )}
                      </td>

                      <td>
                        <strong>
                          {receipt.exportCode}
                        </strong>
                      </td>

                      <td>
                        {receipt.invoiceCode}
                      </td>

                      <td>
                        {receipt.exportedBy}
                      </td>

                      <td>
                        {receipt.item_count}
                      </td>

                      <td>
                        <strong>
                          {receipt.total_quantity}
                        </strong>
                      </td>

                      {isAdmin && (
                        <td>
                          <strong>
                            {money(
                              receipt.total_cost
                            )}
                          </strong>
                        </td>
                      )}

                      <td>
                        <div className="export-history-actions">
                          <button
                            type="button"
                            className="export-history-action print"
                            disabled={
                              deleting ||
                              printing
                            }
                            onClick={() =>
                              printReceipt(
                                receipt.exportCode
                              )
                            }
                          >
                            {printing
                              ? "Đang mở..."
                              : "In phiếu"}
                          </button>

                          <button
                            type="button"
                            className="export-history-action edit"
                            disabled={
                              deleting
                            }
                            onClick={() =>
                              onEdit?.(
                                receipt.exportCode
                              )
                            }
                          >
                            {editing
                              ? "Đang sửa"
                              : "Sửa"}
                          </button>

                          <button
                            type="button"
                            className="export-history-action delete"
                            disabled={
                              deleting ||
                              editing
                            }
                            onClick={() =>
                              deleteReceipt(
                                receipt
                              )
                            }
                          >
                            {deleting
                              ? "Đang xóa..."
                              : "Xóa"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
