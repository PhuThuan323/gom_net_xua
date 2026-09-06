function SupplierTable({
  suppliers = [],
  onEdit,
  onDelete,
}) {
  const formatCurrency =
    (value) =>
      Number(
        value || 0
      ).toLocaleString(
        "vi-VN"
      );

  return (
    <div className="supplier-table-card">
      <table className="supplier-table">
        <thead>
          <tr>
            <th>
              Mã NCC
            </th>

            <th>
              Tên nhà cung cấp
            </th>

            <th>
              Điện thoại
            </th>

            <th>
              Địa chỉ
            </th>

            <th>
              Tổng phát sinh nợ
            </th>

            <th>
              Đã trả
            </th>

            <th>
              Còn nợ
            </th>

            <th>
              Thao tác
            </th>
          </tr>
        </thead>

        <tbody>
          {suppliers.length ===
          0 ? (
            <tr>
              <td
                colSpan="8"
                className="empty-table"
              >
                Không tìm thấy nhà cung cấp
              </td>
            </tr>
          ) : (
            suppliers.map(
              (
                supplier
              ) => {
                /*
                 * API /debt/suppliers sau khi sửa trả:
                 *
                 * total_debt
                 *   = DEBT + ADJUSTMENT
                 *
                 * total_payment
                 *   = PAYMENT
                 *
                 * current_balance
                 *   = total_debt - total_payment
                 */

                const totalDebt =
                  Number(
                    supplier.total_debt ??
                      0
                  );

                const paidAmount =
                  Number(
                    supplier.total_payment ??
                      supplier.paid_amount ??
                      0
                  );

                const remainingDebt =
                  Number(
                    supplier.current_balance ??
                      supplier.remaining_debt ??
                      totalDebt -
                        paidAmount
                  );

                return (
                  <tr
                    key={
                      supplier.id
                    }
                  >
                    <td className="supplier-code">
                      {supplier.supplier_code ||
                        "-"}
                    </td>

                    <td>
                      {supplier.supplier_name ||
                        "-"}
                    </td>

                    <td>
                      {supplier.phone ||
                        "-"}
                    </td>

                    <td>
                      {supplier.address ||
                        "-"}
                    </td>

                    <td className="money">
                      {formatCurrency(
                        totalDebt
                      )}{" "}
                      đ
                    </td>

                    <td className="money">
                      {formatCurrency(
                        paidAmount
                      )}{" "}
                      đ
                    </td>

                    <td className="money debt">
                      {formatCurrency(
                        remainingDebt
                      )}{" "}
                      đ
                    </td>

                    <td>
                      <div className="supplier-actions">
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() =>
                            onEdit(
                              supplier
                            )
                          }
                        >
                          Sửa
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() =>
                            onDelete(
                              supplier
                            )
                          }
                        >
                          Xóa
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
  );
}

export default SupplierTable;
