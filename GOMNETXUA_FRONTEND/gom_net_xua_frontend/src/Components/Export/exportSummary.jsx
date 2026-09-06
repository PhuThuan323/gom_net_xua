const money = (
  value
) =>
  new Intl.NumberFormat(
    "vi-VN"
  ).format(
    Number(
      value ||
        0
    )
  ) + " đ";

export default function ExportSummary({
  items = [],

  totalQuantity = 0,

  totalCost = 0,

  setVariantQuantity,

  onSave,

  onReset,

  saving,

  currentUser,
}) {
  const isAdmin =
    currentUser?.role === "ADMIN";
  return (
    <section className="export-summary">

      <div className="export-summary-left">

        <div className="export-summary-stat">

          <span>
            Sản phẩm đã chọn
          </span>

          <strong>
            {
              items.length
            } biến thể
          </strong>

        </div>

        <div className="export-summary-stat">

          <span>
            Tổng số lượng xuất
          </span>

          <strong>
            {
              totalQuantity
            }
          </strong>

        </div>
        {isAdmin && (
          <div className="export-summary-stat cost">

          <span>
            Tổng giá vốn xuất
          </span>

          <strong>
            {money(
              totalCost
            )}
          </strong>

        </div>
        )}
        

      </div>

      <div className="export-summary-actions">

        <button
          type="button"

          className="export-btn reset"

          disabled={
            saving ||
            items.length ===
              0
          }

          onClick={
            onReset
          }
        >
          Xóa số lượng
        </button>

        <button
          type="button"

          className="export-btn save"

          disabled={
            saving ||
            items.length ===
              0
          }

          onClick={
            onSave
          }
        >
          {saving
            ? "Đang lưu..."
            : `Lưu xuất kho (${totalQuantity})`}
        </button>

      </div>

    </section>
  );
}