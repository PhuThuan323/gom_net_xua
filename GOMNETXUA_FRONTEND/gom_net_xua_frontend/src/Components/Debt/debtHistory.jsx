import { useCallback, useEffect, useState } from "react";

const money = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + " đ";

const transactionLabel = (type) => {
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

const transactionClass = (type) => {
  switch (type) {
    case "DEBT":
      return "debt";

    case "PAYMENT":
      return "payment";

    default:
      return "adjustment";
  }
};

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("vi-VN");
};

export default function DebtHistory({
  suppliers,
  apiBase,
  refreshKey,
}) {
  const [supplierId, setSupplierId] = useState("");
  const [transactionType, setTransactionType] = useState("");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      params.set("page", "1");
      params.set("limit", "200");

      if (supplierId) {
        params.set("supplier_id", supplierId);
      }

      if (transactionType) {
        params.set(
          "transaction_type",
          transactionType
        );
      }

      const response = await fetch(
        `${apiBase}/transactions?${params.toString()}`
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Không thể tải lịch sử công nợ"
        );
      }

      setRows(result.data || []);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }, [apiBase, supplierId, transactionType]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, refreshKey]);

  const supplierLabel = (supplier) => {
    const code = supplier.supplier_code
      ? `${supplier.supplier_code} – `
      : "";

    return `${code}${supplier.supplier_name}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="debt-history-section">
      <div className="debt-history-filter">
        <select
          value={supplierId}
          onChange={(event) =>
            setSupplierId(event.target.value)
          }
        >
          <option value="">
            Tất cả nhà cung cấp
          </option>

          {suppliers.map((supplier) => (
            <option
              key={supplier.id}
              value={supplier.id}
            >
              {supplierLabel(supplier)}
            </option>
          ))}
        </select>

        <select
          value={transactionType}
          onChange={(event) =>
            setTransactionType(event.target.value)
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
          onClick={handlePrint}
        >
          In báo cáo công nợ
        </button>
      </div>

      <div className="debt-history-table-wrap">
        <table className="debt-history-table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Nhà cung cấp</th>
              <th>Loại giao dịch</th>
              <th>Số tiền</th>
              <th>Mã tham chiếu</th>
              <th>Ghi chú</th>
              <th>Số dư sau giao dịch</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="7"
                  className="debt-table-message"
                >
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="debt-table-message"
                >
                  Chưa có giao dịch công nợ
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    {formatDate(row.transaction_date)}
                  </td>

                  <td>
                    {row.supplier?.supplier_name || ""}
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
                  </td>

                  <td>{money(row.amount)}</td>

                  <td>
                    {row.reference_code || ""}
                  </td>

                  <td>{row.note || ""}</td>

                  <td>
                    <strong>
                      {money(row.balance_after)}
                    </strong>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}