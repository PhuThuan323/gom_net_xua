import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const money = (value) =>
  new Intl.NumberFormat(
    "vi-VN"
  ).format(
    Number(value || 0)
  ) + " đ";

const transactionLabel =
  (type) => {
    switch (type) {
      case "DEBT":
        return "Phát sinh nợ";

      case "PAYMENT":
        return "Trả nợ";

      case "ADJUSTMENT":
        return "Điều chỉnh";

      default:
        return type || "";
    }
  };

const transactionClass =
  (type) => {
    switch (type) {
      case "DEBT":
        return "debt";

      case "PAYMENT":
        return "payment";

      default:
        return "adjustment";
    }
  };

const formatDate =
  (value) => {
    if (!value) return "";

    const date =
      new Date(value);

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

const toDateInputValue =
  (value) => {
    if (!value) return "";

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    const offset =
      date.getTimezoneOffset();

    return new Date(
      date.getTime() -
        offset *
          60 *
          1000
    )
      .toISOString()
      .slice(0, 10);
  };

const parseJsonSafe =
  async (
    response
  ) => {
    const text =
      await response.text();

    let data = {};

    try {
      data =
        text
          ? JSON.parse(
              text
            )
          : {};
    } catch {
      throw new Error(
        `API không trả JSON (HTTP ${response.status}). ` +
          `Kiểm tra route PUT/DELETE công nợ ở backend.`
      );
    }

    return data;
  };

export default function DebtHistory({
  suppliers,
  apiBase,
  refreshKey,
  onChanged,
}) {
  const [
    supplierId,
    setSupplierId,
  ] = useState("");

  const [
    transactionType,
    setTransactionType,
  ] = useState("");

  const [
    rows,
    setRows,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    editingRow,
    setEditingRow,
  ] = useState(null);

  const [
    editForm,
    setEditForm,
  ] = useState({
    transaction_type:
      "DEBT",

    amount:
      "",

    transaction_date:
      "",

    reference_code:
      "",

    note:
      "",
  });

  const [
    savingEdit,
    setSavingEdit,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const loadHistory =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          const params =
            new URLSearchParams();

          params.set(
            "page",
            "1"
          );

          params.set(
            "limit",
            "200"
          );

          if (
            supplierId
          ) {
            params.set(
              "supplier_id",
              supplierId
            );
          }

          if (
            transactionType
          ) {
            params.set(
              "transaction_type",
              transactionType
            );
          }

          const response =
            await fetch(
              `${apiBase}/transactions?${params.toString()}`
            );

          const result =
            await parseJsonSafe(
              response
            );

          if (
            !response.ok ||
            result.success ===
              false
          ) {
            throw new Error(
              result.message ||
                "Không thể tải lịch sử công nợ"
            );
          }

          setRows(
            Array.isArray(
              result.data
            )
              ? result.data
              : []
          );
        } catch (error) {
          console.error(
            error
          );

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
        apiBase,
        supplierId,
        transactionType,
      ]
    );

  useEffect(() => {
    loadHistory();
  }, [
    loadHistory,
    refreshKey,
  ]);

  const supplierLabel =
    (supplier) => {
      const code =
        supplier.supplier_code
          ? `${supplier.supplier_code} – `
          : "";

      return `${code}${supplier.supplier_name}`;
    };

  const handlePrint =
    () => {
      window.print();
    };

  /*
   * Dòng sinh từ phiếu nhập không cho sửa/xóa trực tiếp.
   * Phải sửa/xóa ở Phiếu nhập để tồn kho + công nợ đồng bộ.
   */
  const canModify =
    (row) =>
      row.reference_type !==
      "IMPORT_RECEIPT";

  const openEdit =
    (row) => {
      if (
        !canModify(row)
      ) {
        alert(
          "Giao dịch này được sinh tự động từ phiếu nhập. " +
            "Vui lòng sửa phiếu nhập để hệ thống tự điều chỉnh công nợ."
        );

        return;
      }

      setEditingRow(
        row
      );

      setEditForm({
        transaction_type:
          row.transaction_type ||
          "DEBT",

        amount:
          String(
            row.amount ?? ""
          ),

        transaction_date:
          toDateInputValue(
            row.transaction_date
          ),

        reference_code:
          row.reference_code ||
          "",

        note:
          row.note ||
          "",
      });
    };

  const closeEdit =
    () => {
      if (
        savingEdit
      ) {
        return;
      }

      setEditingRow(
        null
      );
    };

  const saveEdit =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        !editingRow
      ) {
        return;
      }

      const amount =
        Number(
          editForm.amount
        );

      if (
        !Number.isFinite(
          amount
        )
      ) {
        alert(
          "Số tiền không hợp lệ"
        );

        return;
      }

      if (
        editForm.transaction_type !==
          "ADJUSTMENT" &&
        amount <= 0
      ) {
        alert(
          "Số tiền phải lớn hơn 0"
        );

        return;
      }

      if (
        editForm.transaction_type ===
          "ADJUSTMENT" &&
        amount === 0
      ) {
        alert(
          "Số tiền điều chỉnh phải khác 0"
        );

        return;
      }

      try {
        setSavingEdit(
          true
        );

        const response =
          await fetch(
            `${apiBase}/transactions/${editingRow.id}`,
            {
              method:
                "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  transaction_type:
                    editForm.transaction_type,

                  amount,

                  transaction_date:
                    editForm.transaction_date,

                  reference_code:
                    editForm.reference_code,

                  note:
                    editForm.note,
                }),
            }
          );

        const result =
          await parseJsonSafe(
            response
          );

        if (
          !response.ok ||
          result.success ===
            false
        ) {
          throw new Error(
            result.message ||
              "Không thể cập nhật giao dịch công nợ"
          );
        }

        alert(
          "Cập nhật công nợ thành công"
        );

        setEditingRow(
          null
        );

        if (
          onChanged
        ) {
          await onChanged();
        } else {
          await loadHistory();
        }
      } catch (error) {
        console.error(
          error
        );

        alert(
          error.message
        );
      } finally {
        setSavingEdit(
          false
        );
      }
    };

  const deleteRow =
    async (
      row
    ) => {
      if (
        !canModify(row)
      ) {
        alert(
          "Giao dịch này được sinh tự động từ phiếu nhập. " +
            "Vui lòng xóa/sửa phiếu nhập để hệ thống tự hoàn công nợ."
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Bạn có chắc muốn xóa giao dịch ${transactionLabel(
            row.transaction_type
          )} ${money(
            row.amount
          )} của ${row.supplier?.supplier_name || "nhà cung cấp"} không?\n\n` +
            `Sau khi xóa, hệ thống sẽ tính lại toàn bộ số dư công nợ.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setDeletingId(
          row.id
        );

        const response =
          await fetch(
            `${apiBase}/transactions/${row.id}`,
            {
              method:
                "DELETE",

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        const result =
          await parseJsonSafe(
            response
          );

        if (
          !response.ok ||
          result.success ===
            false
        ) {
          throw new Error(
            result.message ||
              "Không thể xóa giao dịch công nợ"
          );
        }

        alert(
          "Đã xóa giao dịch công nợ"
        );

        if (
          onChanged
        ) {
          await onChanged();
        } else {
          await loadHistory();
        }
      } catch (error) {
        console.error(
          error
        );

        alert(
          error.message
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };

  return (
    <>
      <div className="debt-history-section">
        <div className="debt-history-filter">
          <select
            value={
              supplierId
            }
            onChange={(
              event
            ) =>
              setSupplierId(
                event.target.value
              )
            }
          >
            <option value="">
              Tất cả nhà cung cấp
            </option>

            {suppliers.map(
              (
                supplier
              ) => (
                <option
                  key={
                    supplier.id
                  }
                  value={
                    supplier.id
                  }
                >
                  {supplierLabel(
                    supplier
                  )}
                </option>
              )
            )}
          </select>

          <select
            value={
              transactionType
            }
            onChange={(
              event
            ) =>
              setTransactionType(
                event.target.value
              )
            }
          >
            <option value="">
              Tất cả giao dịch
            </option>

            <option value="DEBT">
              Phát sinh nợ
            </option>

            <option value="PAYMENT">
              Trả nợ
            </option>

            <option value="ADJUSTMENT">
              Điều chỉnh
            </option>
          </select>

          <button
            type="button"
            className="debt-print-button"
            onClick={
              handlePrint
            }
          >
            In báo cáo công nợ
          </button>
        </div>

        <div className="debt-history-table-wrap">
          <table className="debt-history-table">
            <thead>
              <tr>
                <th>
                  Ngày
                </th>

                <th>
                  Nhà cung cấp
                </th>

                <th>
                  Loại giao dịch
                </th>

                <th>
                  Số tiền
                </th>

                <th>
                  Mã tham chiếu
                </th>

                <th>
                  Ghi chú
                </th>

                <th>
                  Số dư sau giao dịch
                </th>

                <th>
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="debt-table-message"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : rows.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="debt-table-message"
                  >
                    Chưa có giao dịch công nợ
                  </td>
                </tr>
              ) : (
                rows.map(
                  (row) => {
                    const locked =
                      !canModify(
                        row
                      );

                    const deleting =
                      Number(
                        deletingId
                      ) ===
                      Number(
                        row.id
                      );

                    return (
                      <tr
                        key={
                          row.id
                        }
                      >
                        <td>
                          {formatDate(
                            row.transaction_date
                          )}
                        </td>

                        <td>
                          {row.supplier
                            ?.supplier_name ||
                            ""}
                        </td>

                        <td>
                          <span
                            className={`debt-transaction-badge ${transactionClass(
                              row.transaction_type
                            )}`}
                          >
                            {transactionLabel(
                              row.transaction_type
                            )}
                          </span>

                          {locked && (
                            <div className="debt-auto-note">
                              Tự động từ phiếu nhập
                            </div>
                          )}
                        </td>

                        <td>
                          {money(
                            row.amount
                          )}
                        </td>

                        <td>
                          {row.reference_code ||
                            ""}
                        </td>

                        <td>
                          {row.note ||
                            ""}
                        </td>

                        <td>
                          <strong>
                            {money(
                              row.balance_after
                            )}
                          </strong>
                        </td>

                        <td>
                          <div className="debt-row-actions">
                            <button
                              type="button"
                              className="debt-row-btn edit"
                              disabled={
                                locked ||
                                deleting
                              }
                              title={
                                locked
                                  ? "Hãy sửa phiếu nhập tương ứng"
                                  : "Sửa giao dịch"
                              }
                              onClick={() =>
                                openEdit(
                                  row
                                )
                              }
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              className="debt-row-btn delete"
                              disabled={
                                locked ||
                                deleting
                              }
                              title={
                                locked
                                  ? "Hãy xóa/sửa phiếu nhập tương ứng"
                                  : "Xóa giao dịch"
                              }
                              onClick={() =>
                                deleteRow(
                                  row
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
      </div>

      {editingRow && (
        <div
          className="debt-edit-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEdit();
            }
          }}
        >
          <form
            className="debt-edit-modal"
            onSubmit={
              saveEdit
            }
          >
            <div className="debt-edit-modal-header">
              <div>
                <h2>
                  Sửa giao dịch công nợ
                </h2>

                <p>
                  {editingRow.supplier
                    ?.supplier_name ||
                    ""}
                </p>
              </div>

              <button
                type="button"
                className="debt-edit-close"
                onClick={
                  closeEdit
                }
                disabled={
                  savingEdit
                }
              >
                ×
              </button>
            </div>

            <label>
              Loại giao dịch
            </label>

            <select
              value={
                editForm.transaction_type
              }
              onChange={(
                event
              ) =>
                setEditForm(
                  (
                    prev
                  ) => ({
                    ...prev,

                    transaction_type:
                      event.target.value,
                  })
                )
              }
            >
              <option value="DEBT">
                Phát sinh nợ
              </option>

              <option value="PAYMENT">
                Trả nợ
              </option>

              <option value="ADJUSTMENT">
                Điều chỉnh
              </option>
            </select>

            <label>
              Số tiền
            </label>

            <input
              type="number"
              step="1"
              value={
                editForm.amount
              }
              onChange={(
                event
              ) =>
                setEditForm(
                  (
                    prev
                  ) => ({
                    ...prev,

                    amount:
                      event.target.value,
                  })
                )
              }
            />

            {editForm.transaction_type ===
              "ADJUSTMENT" && (
              <small className="debt-edit-help">
                Điều chỉnh tăng nhập số dương; điều chỉnh giảm nhập số âm.
              </small>
            )}

            <label>
              Ngày giao dịch
            </label>

            <input
              type="date"
              value={
                editForm.transaction_date
              }
              onChange={(
                event
              ) =>
                setEditForm(
                  (
                    prev
                  ) => ({
                    ...prev,

                    transaction_date:
                      event.target.value,
                  })
                )
              }
            />

            <label>
              Mã tham chiếu
            </label>

            <input
              type="text"
              value={
                editForm.reference_code
              }
              onChange={(
                event
              ) =>
                setEditForm(
                  (
                    prev
                  ) => ({
                    ...prev,

                    reference_code:
                      event.target.value,
                  })
                )
              }
            />

            <label>
              Ghi chú
            </label>

            <textarea
              rows="4"
              value={
                editForm.note
              }
              onChange={(
                event
              ) =>
                setEditForm(
                  (
                    prev
                  ) => ({
                    ...prev,

                    note:
                      event.target.value,
                  })
                )
              }
            />

            <div className="debt-edit-actions">
              <button
                type="button"
                className="debt-edit-cancel"
                onClick={
                  closeEdit
                }
                disabled={
                  savingEdit
                }
              >
                Hủy
              </button>

              <button
                type="submit"
                className="debt-edit-save"
                disabled={
                  savingEdit
                }
              >
                {savingEdit
                  ? "Đang lưu..."
                  : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
