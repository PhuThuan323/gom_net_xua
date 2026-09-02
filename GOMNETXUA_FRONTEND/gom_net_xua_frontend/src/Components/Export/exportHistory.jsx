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

const dateTimeVN = (
  value
) => {
  if (!value) return "";

  return new Date(
    value
  ).toLocaleString(
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

  return {
    exportCode,
    exportedBy,
    invoiceCode,
  };
};

export default function ExportHistory({
  api,
  refreshKey,
  isAdmin = false,
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

  const load =
    useCallback(
      async () => {
        try {
          setLoading(true);

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
          setLoading(false);
        }
      },
      [api]
    );

  useEffect(() => {
    load();
  }, [
    load,
    refreshKey,
  ]);

  return (
    <section className="export-history-card">

      <div className="export-history-heading">

        <div>
          <h2>
            Lịch sử xuất kho
          </h2>

          <p>
            Theo dõi số lượng và giá vốn đã xuất để phục vụ báo cáo lãi/lỗ.
          </p>
        </div>

        <div className="export-history-summary">

          <div>
            <span>
              Tổng SL
            </span>

            <strong>
              {
                summary.total_quantity ||
                0
              }
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

        <table className="export-history-table">

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
                Sản phẩm
              </th>

              <th>
                SKU
              </th>

              <th>
                SL
              </th>

              <th>
                Tồn trước
              </th>

              <th>
                Tồn sau
              </th>
            {isAdmin && (
              <th>
                Giá vốn
              </th>
            )}
            {isAdmin && (  
  
              <th>
                Tổng vốn
              </th>
            )}
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td colSpan="11">
                  Đang tải lịch sử...
                </td>
              </tr>
            ) : rows.length ===
              0 ? (
              <tr>
                <td colSpan="11">
                  Chưa có lịch sử xuất kho.
                </td>
              </tr>
            ) : (
              rows.map(
                (
                  row
                ) => {
                  const info =
                    extractInfo(
                      row.note
                    );

                  return (
                    <tr
                      key={
                        row.id
                      }
                    >

                      <td>
                        {dateTimeVN(
                          row.created_at
                        )}
                      </td>

                      <td>
                        <strong>
                          {
                            info.exportCode
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          info.invoiceCode
                        }
                      </td>

                      <td>
                        {
                          info.exportedBy
                        }
                      </td>

                      <td>
                        {
                          row.variant
                            ?.product_name
                        }

                        {row.variant
                          ?.size
                          ? ` - ${row.variant.size}`
                          : ""}
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
                        {
                          row.quantity_before
                        }
                      </td>

                      <td>
                        {
                          row.quantity_after
                        }
                      </td>
                      {isAdmin && (
                      <td>
                        {money(
                          row.unit_cost
                        )}
                      </td>
                      )}
                      {isAdmin && (
                      <td>
                        <strong>
                          {money(
                            row.total_cost
                          )}
                        </strong>
                      </td>
                      )}

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