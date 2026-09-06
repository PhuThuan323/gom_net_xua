import React from "react";

/* =========================================================
   HELPERS
========================================================= */

const money = (value) =>
  new Intl.NumberFormat(
    "vi-VN"
  ).format(
    Number(value || 0)
  ) + " đ";


const number = (value) =>
  new Intl.NumberFormat(
    "vi-VN"
  ).format(
    Number(value || 0)
  );


const formatDateTime = (
  value = new Date()
) => {
  const d = new Date(value);

  const pad = (n) =>
    String(n).padStart(2, "0");

  return `${pad(
    d.getDate()
  )}/${pad(
    d.getMonth() + 1
  )}/${d.getFullYear()}, ${pad(
    d.getHours()
  )}:${pad(
    d.getMinutes()
  )}`;
};


const chunkArray = (
  arr,
  size
) => {
  const result = [];

  for (
    let i = 0;
    i < arr.length;
    i += size
  ) {
    result.push(
      arr.slice(
        i,
        i + size
      )
    );
  }

  return result;
};


/* =========================================================
   PRINT TEMPLATE
========================================================= */

export default function OverallPrintTemplate({
  companyName =
    "GỐM SỨ ĐẶC SẢN NÉT XƯA",

  address =
    "Xã Mỹ Hiệp, Đồng Tháp",

  hotline =
    "0926 18 5457",

  website =
    "https://blue-pine-cfae.khuyenboy10.workers.dev",

  periodLabel = "",

  summary = {},

  rows = [],
}) {

  /* =======================================================
     SUMMARY
  ======================================================= */

  const {
    totalInventoryValue = 0,

    totalQuantity = 0,

    supplierDebt = 0,

    profit = 0,

    needImportCount = 0,
  } = summary;


  /* =======================================================
     BẢO VỆ DỮ LIỆU ROWS
  ======================================================= */

  const safeRows =
    Array.isArray(rows)
      ? rows
      : [];


  /*
   * Trang đầu có nhiều header,
   * 28 dòng phù hợp A4.
   */
  const ROWS_PER_PAGE = 28;


  /*
   * QUAN TRỌNG:
   *
   * Nếu không có rows vẫn phải tạo
   * ít nhất 1 trang.
   *
   * Nếu dùng:
   * chunkArray([], 28)
   *
   * => []
   * => không render trang nào
   * => Print Preview trắng.
   */
  const pages =
    safeRows.length > 0
      ? chunkArray(
          safeRows,
          ROWS_PER_PAGE
        )
      : [[]];


  const totalPages =
    pages.length;


  const printDate =
    new Date();


  /* =======================================================
     NORMALIZE ROW

     Hỗ trợ nhiều tên field từ backend
  ======================================================= */

  const normalizeRow = (
    item = {}
  ) => {

    const productName =
      item.productName ??
      item.product_name ??
      item.product?.product_name ??
      "";


    const variantName =
      item.variantName ??
      item.variant_name ??
      item.size ??
      item.variant_code ??
      "";


    const sku =
      item.sku ??
      item.variant_code ??
      "";


    const stock =
      Number(
        item.stock ??
        item.current_quantity ??
        item.quantity ??
        0
      );


    const minStock =
      Number(
        item.minStock ??
        item.min_stock ??
        item.minimum_stock ??
        item.min_quantity ??
        0
      );


    const costPrice =
      Number(
        item.costPrice ??
        item.cost_price ??
        item.purchase_price ??
        item.unit_cost ??
        0
      );


    const inventoryValue =
      Number(
        item.inventoryValue ??
        item.inventory_value ??
        stock * costPrice
      );


    let statusLabel =
      item.statusLabel ??
      item.status_label ??
      item.status ??
      "";


    /*
     * Nếu backend chưa gửi status
     * thì tự xác định.
     */
    if (!statusLabel) {

      if (stock <= 0) {
        statusLabel =
          "Hết hàng";
      }

      else if (
        stock <= minStock
      ) {
        statusLabel =
          "Sắp hết";
      }

      else {
        statusLabel =
          "An toàn";
      }
    }


    return {
      productName,
      variantName,
      sku,
      stock,
      minStock,
      costPrice,
      inventoryValue,
      statusLabel,
    };
  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="overall-print-root">

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
              className="overall-print-sheet"
              key={pageIndex}
            >

              {/* =========================================
                  TOP
              ========================================= */}

              <div className="overall-print-topline">

                <div>
                  {formatDateTime(
                    printDate
                  )}
                </div>


                <div className="overall-print-top-title">
                  BÁO CÁO TỔNG QUAN HOẠT ĐỘNG KHO
                </div>


                <div className="overall-print-meta">

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


              {/* =========================================
                  BRAND
              ========================================= */}

              <div className="overall-print-brand">

                <div className="overall-print-brand-left">

                  <div className="overall-print-logo">
                    NX
                  </div>


                  <div className="overall-print-brand-info">

                    <h2>
                      {companyName}
                    </h2>

                    <p>
                      Địa chỉ: {address}
                    </p>

                    <p>
                      Hotline: {hotline}
                    </p>

                  </div>

                </div>

              </div>


              <div className="overall-print-divider" />


              {/* =========================================
                  TITLE
              ========================================= */}

              <div className="overall-print-main-title">

                <h1>
                  BÁO CÁO TỔNG QUAN HOẠT ĐỘNG KHO
                </h1>

                <p>
                  Biểu mẫu quản trị nội bộ
                </p>

              </div>


              {/* =========================================
                  SUMMARY - CHỈ TRANG 1
              ========================================= */}

              {pageIndex === 0 && (

                <>

                  <div className="overall-print-summary-row">

                    <div>

                      <strong>
                        Kỳ báo cáo:
                      </strong>

                      {" "}

                      {periodLabel ||
                        "Không xác định"}

                    </div>


                    <div>

                      <strong>
                        Số biến thể cần nhập:
                      </strong>

                      {" "}

                      {number(
                        needImportCount
                      )}

                    </div>

                  </div>


                  <div className="overall-print-summary-row bold">

                    <div>

                      Giá trị tồn kho:
                      {" "}
                      {money(
                        totalInventoryValue
                      )}

                      {" • "}

                      Tổng tồn:
                      {" "}
                      {number(
                        totalQuantity
                      )}

                      {" • "}

                      Công nợ:
                      {" "}
                      {money(
                        supplierDebt
                      )}

                      {" • "}

                      Lãi/lỗ:
                      {" "}
                      {money(
                        profit
                      )}

                    </div>

                  </div>

                </>

              )}


              {/* =========================================
                  TABLE TITLE
              ========================================= */}

              <div className="overall-print-section-title">

                Danh sách tồn kho theo biến thể

              </div>


              {/* =========================================
                  TABLE
              ========================================= */}

              <table className="overall-print-table">

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
                      Tồn
                    </th>

                    <th>
                      Tồn tối thiểu
                    </th>

                    <th>
                      Giá vốn
                    </th>

                    <th>
                      Giá trị tồn
                    </th>

                    <th>
                      Trạng thái
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {pageRows.length > 0 ? (

                    pageRows.map(
                      (
                        rawItem,
                        index
                      ) => {

                        const item =
                          normalizeRow(
                            rawItem
                          );


                        const stt =
                          startIndex +
                          index +
                          1;


                        return (

                          <tr
                            key={
                              `${
                                item.sku ||
                                stt
                              }-${index}`
                            }
                          >

                            <td>
                              {stt}
                            </td>


                            <td>
                              {
                                item.productName
                              }
                            </td>


                            <td>
                              {
                                item.variantName
                              }
                            </td>


                            <td>
                              {
                                item.sku
                              }
                            </td>


                            <td>
                              {number(
                                item.stock
                              )}
                            </td>


                            <td>
                              {number(
                                item.minStock
                              )}
                            </td>


                            <td>
                              {money(
                                item.costPrice
                              )}
                            </td>


                            <td>
                              {money(
                                item.inventoryValue
                              )}
                            </td>


                            <td>
                              {
                                item.statusLabel
                              }
                            </td>

                          </tr>

                        );
                      }
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan={9}
                        className="overall-print-empty"
                      >

                        Chưa có dữ liệu tồn kho theo biến thể.

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>


              {/* =========================================
                  SIGNATURE - TRANG CUỐI
              ========================================= */}

              {currentPage ===
                totalPages && (

                <div className="overall-print-signature">

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


              {/* =========================================
                  FOOTER
              ========================================= */}

              <footer className="overall-print-footer">

                <div>
                  {website}
                </div>

                <div>
                  {currentPage}/{totalPages}
                </div>

              </footer>

            </section>

          );
        }
      )}

    </div>

  );
}