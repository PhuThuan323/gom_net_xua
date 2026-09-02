import "./ImportReceiptPrint.css";

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString("vi-VN") + " đ";
};

const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("vi-VN");
};

function ImportReceiptPrint({ receipt, onClose }) {
  if (!receipt) return null;

  const items = receipt.items || [];

  const totalQuantity = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.total_price || 0),
    0
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="receipt-modal">

      {/* THANH NÚT - KHÔNG IN */}
      <div className="receipt-toolbar no-print">
        <button
          type="button"
          className="print-button"
          onClick={handlePrint}
        >
          🖨 In / Lưu PDF
        </button>

        <button
          type="button"
          className="close-button"
          onClick={onClose}
        >
          Đóng
        </button>
      </div>

      {/* NỘI DUNG PHIẾU */}
      <div className="print-receipt">

        {/* HEADER */}
        <div className="receipt-company-header">

          <div className="company-logo">
            NX
          </div>

          <div className="company-info">
            <h1>GỐM SỨ ĐẶC SẢN NÉT XƯA</h1>

            <p>
              Địa chỉ: Xã Mỹ Hiệp, Đồng Tháp
            </p>

            <p>
              Hotline: 0926 18 5457
            </p>
          </div>

          <div className="receipt-meta">
            <div>
              Mã biểu mẫu: <strong>NX-BM-01</strong>
            </div>

            <div>
              Ngày in:{" "}
              <strong>
                {new Date().toLocaleDateString("vi-VN")}
              </strong>
            </div>

            <div>
              Phiên bản: <strong>01</strong>
            </div>
          </div>

        </div>

        <div className="receipt-line" />

        {/* TIÊU ĐỀ */}
        <div className="receipt-title">
          <h2>PHIẾU NHẬP KHO</h2>

          <p>
            Biểu mẫu quản trị nội bộ
          </p>
        </div>

        {/* THÔNG TIN PHIẾU */}
        <div className="receipt-information">

          <div>
            <p>
              <strong>Số phiếu:</strong>{" "}
              {receipt.receipt_code}
            </p>

            <p>
              <strong>Đối tượng:</strong>{" "}
              {receipt.supplier?.supplier_name ||
                "Nhà cung cấp chưa chọn"}
            </p>
          </div>

          <div>
            <p>
              <strong>Ngày:</strong>{" "}
              {formatDate(receipt.import_date)}
            </p>

            <p>
              <strong>Người thực hiện:</strong>{" "}
              {receipt.received_by || ""}
            </p>
          </div>

        </div>

        {/* BẢNG SẢN PHẨM */}
        <table className="receipt-table">

          <thead>
            <tr>
              <th className="stt">STT</th>
              <th>Sản phẩm gốc</th>
              <th>Biến thể</th>
              <th>SKU</th>
              <th className="sl">SL</th>
              <th className="price">Đơn giá</th>
              <th className="price">Thành tiền</th>
            </tr>
          </thead>

          <tbody>

            {items.map((item, index) => {

              const variant = item.variant || {};
              const product = variant.product || {};

              return (
                <tr key={item.id || index}>

                  <td className="center">
                    {index + 1}
                  </td>

                  <td>
                    {product.product_name || "—"}
                  </td>

                  <td>
                    {variant.size
                      ? `SIZE ${variant.size}`
                      : variant.variant_code || "—"}
                  </td>

                  <td>
                    {variant.variant_code || "—"}
                  </td>

                  <td className="center">
                    {Number(item.quantity || 0).toLocaleString(
                      "vi-VN"
                    )}
                  </td>

                  <td className="money">
                    {formatMoney(item.purchase_price)}
                  </td>

                  <td className="money">
                    {formatMoney(item.total_price)}
                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

        {/* TỔNG */}
        <div className="receipt-total">

          <span>
            Tổng số lượng:{" "}
            <strong>
              {totalQuantity.toLocaleString("vi-VN")}
            </strong>
          </span>

          <span>
            Tổng giá trị:{" "}
            <strong>
              {formatMoney(totalAmount)}
            </strong>
          </span>

        </div>

        {/* GHI CHÚ */}
        {receipt.note && (
          <div className="receipt-note">
            <strong>Ghi chú:</strong> {receipt.note}
          </div>
        )}

        {/* CHỮ KÝ */}
        <div className="signature-section">

          <div className="signature-box">
            <strong>Người lập biểu</strong>

            <div className="signature-space" />

            <span>
              (Ký, ghi rõ họ tên)
            </span>
          </div>

          <div className="signature-box">
            <strong>Thủ kho / Kế toán</strong>

            <div className="signature-space" />

            <span>
              (Ký, ghi rõ họ tên)
            </span>
          </div>

          <div className="signature-box">
            <strong>Người phê duyệt</strong>

            <div className="signature-space" />

            <span>
              (Ký, ghi rõ họ tên)
            </span>
          </div>

        </div>

        {/* FOOTER */}
        <div className="receipt-footer">

          <span>
            Gốm Sứ Đặc Sản Nét Xưa - Xã Mỹ Hiệp, Đồng Tháp
          </span>

          <span>
            Hotline: 0926 18 5457
          </span>

        </div>

      </div>

    </div>
  );
}

export default ImportReceiptPrint;