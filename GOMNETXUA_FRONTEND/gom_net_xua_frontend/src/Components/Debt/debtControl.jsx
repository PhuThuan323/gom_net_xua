import { useEffect, useMemo, useState } from "react";

const today = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);

  return local.toISOString().slice(0, 10);
};

const money = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + " đ";

export default function DebtControl({
  suppliers,
  apiBase,
  onSuccess,
}) {
  const [debtForm, setDebtForm] = useState({
    supplier_id: "",
    transaction_date: today(),
    amount: "",
    reference_code: "",
    note: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    supplier_id: "",
    transaction_date: today(),
    amount: "",
    payment_method: "",
    reference_code: "",
    note: "",
  });

  const [currentBalance, setCurrentBalance] = useState(0);

  const [savingDebt, setSavingDebt] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const selectedPaymentSupplier = useMemo(() => {
    return suppliers.find(
      (item) => Number(item.id) === Number(paymentForm.supplier_id)
    );
  }, [suppliers, paymentForm.supplier_id]);

  useEffect(() => {
    if (!paymentForm.supplier_id) {
      setCurrentBalance(0);
      return;
    }

    async function loadSummary() {
      try {
        const response = await fetch(
          `${apiBase}/suppliers/${paymentForm.supplier_id}/summary`
        );

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(
            result.message || "Không thể tải công nợ nhà cung cấp"
          );
        }

        setCurrentBalance(
          Number(result.data?.current_balance || 0)
        );
      } catch (error) {
        console.error(error);

        setCurrentBalance(
          Number(selectedPaymentSupplier?.current_balance || 0)
        );
      }
    }

    loadSummary();
  }, [
    paymentForm.supplier_id,
    apiBase,
    selectedPaymentSupplier,
  ]);

  const supplierLabel = (supplier) => {
    const code = supplier.supplier_code
      ? `${supplier.supplier_code} – `
      : "";

    return `${code}${supplier.supplier_name}`;
  };

  const submitDebt = async (event) => {
    event.preventDefault();

    if (!debtForm.supplier_id) {
      alert("Vui lòng chọn nhà cung cấp");
      return;
    }

    if (!debtForm.amount || Number(debtForm.amount) <= 0) {
      alert("Số tiền nợ phải lớn hơn 0");
      return;
    }

    try {
      setSavingDebt(true);

      const response = await fetch(apiBase, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          supplier_id: Number(debtForm.supplier_id),
          amount: Number(debtForm.amount),
          transaction_date: debtForm.transaction_date,
          reference_code: debtForm.reference_code,
          note: debtForm.note,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Không thể ghi nhận công nợ"
        );
      }

      alert("Đã ghi nhận khoản nợ");

      setDebtForm({
        supplier_id: debtForm.supplier_id,
        transaction_date: today(),
        amount: "",
        reference_code: "",
        note: "",
      });

      await onSuccess?.();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setSavingDebt(false);
    }
  };

  const submitPayment = async (event) => {
    event.preventDefault();

    if (!paymentForm.supplier_id) {
      alert("Vui lòng chọn nhà cung cấp");
      return;
    }

    const amount = Number(paymentForm.amount);

    if (!amount || amount <= 0) {
      alert("Số tiền trả phải lớn hơn 0");
      return;
    }

    if (amount > Number(currentBalance)) {
      alert(
        `Số tiền trả vượt công nợ hiện tại (${money(currentBalance)})`
      );
      return;
    }

    try {
      setSavingPayment(true);

      const response = await fetch(`${apiBase}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          supplier_id: Number(paymentForm.supplier_id),
          amount,
          transaction_date: paymentForm.transaction_date,
          payment_method: paymentForm.payment_method,
          reference_code: paymentForm.reference_code,
          note: paymentForm.note,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Không thể ghi nhận trả công nợ"
        );
      }

      alert("Đã ghi nhận trả công nợ");

      setPaymentForm({
        supplier_id: paymentForm.supplier_id,
        transaction_date: today(),
        amount: "",
        payment_method: "",
        reference_code: "",
        note: "",
      });

      setCurrentBalance(
        Number(result.data?.balance_after || 0)
      );

      await onSuccess?.();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <div className="debt-control-grid">
      <form className="debt-control-card" onSubmit={submitDebt}>
        <h2>Tạo khoản nợ mới / nợ thêm</h2>

        <label>Nhà cung cấp</label>

        <select
          value={debtForm.supplier_id}
          onChange={(event) =>
            setDebtForm((prev) => ({
              ...prev,
              supplier_id: event.target.value,
            }))
          }
        >
          <option value="">
            -- Chọn nhà cung cấp --
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

        <label>Ngày phát sinh</label>

        <input
          type="date"
          value={debtForm.transaction_date}
          onChange={(event) =>
            setDebtForm((prev) => ({
              ...prev,
              transaction_date: event.target.value,
            }))
          }
        />

        <label>Số tiền nợ thêm</label>

        <input
          type="number"
          min="0"
          value={debtForm.amount}
          onChange={(event) =>
            setDebtForm((prev) => ({
              ...prev,
              amount: event.target.value,
            }))
          }
        />

        <label>Mã phiếu / hóa đơn</label>

        <input
          type="text"
          value={debtForm.reference_code}
          onChange={(event) =>
            setDebtForm((prev) => ({
              ...prev,
              reference_code: event.target.value,
            }))
          }
        />

        <label>Ghi chú</label>

        <textarea
          value={debtForm.note}
          onChange={(event) =>
            setDebtForm((prev) => ({
              ...prev,
              note: event.target.value,
            }))
          }
        />

        <button
          type="submit"
          className="debt-primary-button"
          disabled={savingDebt}
        >
          {savingDebt
            ? "Đang lưu..."
            : "Ghi nhận nợ thêm"}
        </button>
      </form>

      <form
        className="debt-control-card"
        onSubmit={submitPayment}
      >
        <h2>Trả công nợ</h2>

        <label>Nhà cung cấp</label>

        <select
          value={paymentForm.supplier_id}
          onChange={(event) =>
            setPaymentForm((prev) => ({
              ...prev,
              supplier_id: event.target.value,
            }))
          }
        >
          <option value="">
            -- Chọn nhà cung cấp --
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

        <div className="debt-current-balance">
          Còn nợ hiện tại:{" "}
          <strong>{money(currentBalance)}</strong>
        </div>

        <label>Ngày trả</label>

        <input
          type="date"
          value={paymentForm.transaction_date}
          onChange={(event) =>
            setPaymentForm((prev) => ({
              ...prev,
              transaction_date: event.target.value,
            }))
          }
        />

        <label>Số tiền trả</label>

        <input
          type="number"
          min="0"
          max={currentBalance || undefined}
          value={paymentForm.amount}
          onChange={(event) =>
            setPaymentForm((prev) => ({
              ...prev,
              amount: event.target.value,
            }))
          }
        />

        <label>Hình thức thanh toán</label>

        <select
          value={paymentForm.payment_method}
          onChange={(event) =>
            setPaymentForm((prev) => ({
              ...prev,
              payment_method: event.target.value,
            }))
          }
        >
          <option value="">
            -- Chọn hình thức thanh toán --
          </option>

          <option value="Chuyển khoản">
            Chuyển khoản
          </option>

          <option value="Tiền mặt">
            Tiền mặt
          </option>

          <option value="Khác">
            Khác
          </option>
        </select>

        <label>Mã tham chiếu</label>

        <input
          type="text"
          value={paymentForm.reference_code}
          onChange={(event) =>
            setPaymentForm((prev) => ({
              ...prev,
              reference_code: event.target.value,
            }))
          }
        />

        <label>Ghi chú</label>

        <textarea
          value={paymentForm.note}
          onChange={(event) =>
            setPaymentForm((prev) => ({
              ...prev,
              note: event.target.value,
            }))
          }
        />

        <button
          type="submit"
          className="debt-primary-button"
          disabled={savingPayment}
        >
          {savingPayment
            ? "Đang lưu..."
            : "Ghi nhận trả nợ"}
        </button>
      </form>
    </div>
  );
}