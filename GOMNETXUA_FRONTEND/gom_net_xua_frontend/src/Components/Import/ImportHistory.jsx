function ImportHistory({
  history = [],
  onPrint,
  onEdit,
  onDelete,
  deletingId = null,
}) {
  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleDateString(
      "vi-VN"
    );
  };

  return (
    <section className="history-section">
      <div className="history-header">
        <div>
          <h2>
            Lịch sử phiếu nhập
          </h2>

          <p className="history-description">
            Các phiếu nhập kho đã được lưu.
            Có thể in, sửa hoặc xóa phiếu.
          </p>
        </div>
      </div>

      <div className="history-card">
        <div className="table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>
                  Số phiếu
                </th>

                <th>
                  Ngày
                </th>

                <th>
                  Nhà cung cấp
                </th>

                <th>
                  Số biến thể
                </th>

                <th>
                  Tổng SL
                </th>

                <th>
                  Tổng giá trị
                </th>

                <th>
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="empty-row"
                  >
                    Chưa có phiếu nhập nào.
                  </td>
                </tr>
              ) : (
                history.map(
                  (receipt) => {
                    const deleting =
                      Number(
                        deletingId
                      ) ===
                      Number(
                        receipt.id
                      );

                    return (
                      <tr
                        key={
                          receipt.id
                        }
                      >
                        <td>
                          <strong>
                            {
                              receipt.receipt_code
                            }
                          </strong>
                        </td>

                        <td>
                          {formatDate(
                            receipt.import_date
                          )}
                        </td>

                        <td>
                          {receipt.supplier
                            ?.supplier_name ||
                            "Nhà cung cấp chưa chọn"}
                        </td>

                        <td className="center-cell">
                          {Number(
                            receipt.variant_count ||
                              0
                          )}
                        </td>

                        <td className="number-cell">
                          {Number(
                            receipt.total_quantity ||
                              0
                          ).toLocaleString(
                            "vi-VN"
                          )}
                        </td>

                        <td className="money-text">
                          {Number(
                            receipt.total_amount ||
                              0
                          ).toLocaleString(
                            "vi-VN"
                          )}{" "}
                          đ
                        </td>

                        <td>
                          <div className="import-history-actions">
                            <button
                              type="button"
                              className="history-action-btn print"
                              onClick={() =>
                                onPrint?.(
                                  receipt.id
                                )
                              }
                              disabled={
                                deleting
                              }
                            >
                              In phiếu
                            </button>

                            <button
                              type="button"
                              className="history-action-btn edit"
                              onClick={() =>
                                onEdit?.(
                                  receipt.id
                                )
                              }
                              disabled={
                                deleting
                              }
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              className="history-action-btn delete"
                              onClick={() =>
                                onDelete?.(
                                  receipt
                                )
                              }
                              disabled={
                                deleting
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
      </div>
    </section>
  );
}

export default ImportHistory;
