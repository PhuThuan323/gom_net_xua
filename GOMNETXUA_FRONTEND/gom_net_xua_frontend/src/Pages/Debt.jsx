import { useCallback, useEffect, useState } from "react";
import DebtControl from "../Components/Debt/debtControl";
import DebtHistory from "../Components/Debt/debtHistory";
import "../Components/Debt/debt.css"
const API_BASE = import.meta.env.VITE_API_URL + "/debt";

const money = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + " đ";

export default function Debt() {
  const [dashboard, setDashboard] = useState({
    total_debt: 0,
    total_payment: 0,
    total_balance: 0,
    overdue_balance: 0,
  });

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchJson = useCallback(async (url, options = {}) => {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.message || "Không thể tải dữ liệu");
    }

    return data;
  }, []);

  const loadDashboard = useCallback(async () => {
    const result = await fetchJson(`${API_BASE}/dashboard`);
    setDashboard(result.data || {});
  }, [fetchJson]);

  const loadSuppliers = useCallback(async () => {
    const result = await fetchJson(`${API_BASE}/suppliers`);
    setSuppliers(result.data || []);
  }, [fetchJson]);

  const refreshAll = useCallback(async () => {
    try {
      setLoading(true);

      await Promise.all([
        loadDashboard(),
        loadSuppliers(),
      ]);

      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }, [loadDashboard, loadSuppliers]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <div className="debt-page">
      <div className="debt-summary-grid">
        <div className="debt-summary-card">
          <div className="debt-summary-label">
            Tổng phát sinh nợ
          </div>

          <div className="debt-summary-value">
            {money(dashboard.total_debt)}
          </div>
        </div>

        <div className="debt-summary-card">
          <div className="debt-summary-label">
            Tổng đã trả
          </div>

          <div className="debt-summary-value">
            {money(dashboard.total_payment)}
          </div>
        </div>

        <div className="debt-summary-card">
          <div className="debt-summary-label">
            Tổng còn nợ
          </div>

          <div className="debt-summary-value">
            {money(dashboard.total_balance)}
          </div>
        </div>

        <div className="debt-summary-card">
          <div className="debt-summary-label">
            Nợ quá hạn
          </div>

          <div className="debt-summary-value">
            {money(dashboard.overdue_balance)}
          </div>
        </div>
      </div>

      <DebtControl
        suppliers={suppliers}
        apiBase={API_BASE}
        onSuccess={refreshAll}
      />

      <DebtHistory
        suppliers={suppliers}
        apiBase={API_BASE}
        refreshKey={refreshKey}
      />

      {loading && (
        <div className="debt-loading">
          Đang cập nhật dữ liệu công nợ...
        </div>
      )}
    </div>
  );
}