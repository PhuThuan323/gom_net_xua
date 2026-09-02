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

const dateVN = (
  value
) => {
  if (!value) return "";

  return new Date(
    value
  ).toLocaleDateString(
    "vi-VN"
  );
};

export default function ExportFromInvoice({
  api,
  selectedInvoice,
  onSelect,
  onClear,
  refreshKey,
}) {
  const [
    invoices,
    setInvoices,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState(
    "not_processed"
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const load =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const params =
            new URLSearchParams();

          if (search.trim()) {
            params.set(
              "search",
              search.trim()
            );
          }

          if (status) {
            params.set(
              "status",
              status
            );
          }

          const result =
            await api(
              `/invoice-quotes?${params.toString()}`
            );

          setInvoices(
            Array.isArray(
              result?.data
            )
              ? result.data
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
        search,
        status,
      ]
    );

  useEffect(() => {
    const timer =
      setTimeout(
        load,
        250
      );

    return () =>
      clearTimeout(
        timer
      );
  }, [
    load,
    refreshKey,
  ]);

  return (
    <section className="export-invoice-card">

      <div className="export-invoice-header">

        <div>
          <h2>
            Xuất kho từ báo giá
          </h2>

          <p>
            Chọn báo giá đã lập để tự động đưa sản phẩm và số lượng vào phiếu xuất.
          </p>
        </div>

        {selectedInvoice && (
          <button
            type="button"
            className="export-btn reset"
            onClick={
              onClear
            }
          >
            Bỏ chọn báo giá
          </button>
        )}

      </div>

      {selectedInvoice && (
        <div className="export-selected-invoice">

          <div>
            <span>
              Đang xuất theo
            </span>

            <strong>
              {
                selectedInvoice.invoice_code
              }
            </strong>
          </div>

          <div>
            <span>
              Khách hàng
            </span>

            <strong>
              {selectedInvoice
                .customer
                ?.customer_name ||
                "—"}
            </strong>
          </div>

          <div>
            <span>
              Sản phẩm
            </span>

            <strong>
              {
                selectedInvoice
                  .items
                  ?.length ||
                0
              } biến thể
            </strong>
          </div>

          <div>
            <span>
              Tổng tiền
            </span>

            <strong>
              {money(
                selectedInvoice.total_amount
              )}
            </strong>
          </div>

        </div>
      )}

      <div className="export-invoice-filters">

        <input
          value={
            search
          }
          placeholder="Tìm số báo giá, khách hàng, SĐT, mã đơn"
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        <select
          value={
            status
          }
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
        >
          <option value="not_processed">
            Chưa xử lý
          </option>

          <option value="processed">
            Đã xử lý
          </option>

          <option value="">
            Tất cả
          </option>
        </select>

      </div>

      <div className="export-invoice-table-wrap">

        <table className="export-invoice-table">

          <thead>
            <tr>
              <th>
                Số báo giá
              </th>

              <th>
                Ngày
              </th>

              <th>
                Khách hàng
              </th>

              <th>
                Kênh
              </th>

              <th>
                Tổng tiền
              </th>

              <th>
                Trạng thái
              </th>

              <th>
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td colSpan="7">
                  Đang tải...
                </td>
              </tr>
            ) : invoices.length ===
              0 ? (
              <tr>
                <td colSpan="7">
                  Không có báo giá phù hợp.
                </td>
              </tr>
            ) : (
              invoices.map(
                (
                  invoice
                ) => {
                  const processed =
                    invoice.warehouse_status ===
                    "processed";

                  return (
                    <tr
                      key={
                        invoice.id
                      }
                    >

                      <td>
                        <strong>
                          {
                            invoice.invoice_code
                          }
                        </strong>
                      </td>

                      <td>
                        {dateVN(
                          invoice.invoice_date
                        )}
                      </td>

                      <td>
                        {invoice
                          .customer
                          ?.customer_name ||
                          "—"}
                      </td>

                      <td>
                        {
                          invoice.channel ||
                          "—"
                        }
                      </td>

                      <td>
                        {money(
                          invoice.total_amount
                        )}
                      </td>

                      <td>

                        <span
                          className={
                            processed
                              ? "export-status processed"
                              : "export-status pending"
                          }
                        >
                          {processed
                            ? "Đã xử lý"
                            : "Chưa xử lý"}
                        </span>

                      </td>

                      <td>

                        <button
                          type="button"
                          className="export-use-invoice-btn"
                          disabled={
                            processed
                          }
                          onClick={() =>
                            onSelect(
                              invoice
                            )
                          }
                        >
                          {processed
                            ? "Đã xuất"
                            : "Chọn xuất kho"}
                        </button>

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