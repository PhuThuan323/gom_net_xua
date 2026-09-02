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

export default function LossForm({
  transactionType,
  setTransactionType,

  transactionDate,
  setTransactionDate,

  performedBy,
  setPerformedBy,

  reason,
  setReason,

  quantity,
  setQuantity,

  note,
  setNote,

  selectedVariant,

  onSave,

  saving,
}) {
  const isLoss =
    transactionType ===
    "LOSS";

  const totalValue =
    selectedVariant
      ? Number(
          selectedVariant.purchase_price ||
            0
        ) *
        Number(
          quantity ||
            0
        )
      : 0;

  return (
    <section className="loss-card">

      <div className="loss-title-row">

        <div>
          <h2>
            Bể vỡ / thất thoát / hàng trả
          </h2>

          <p>
            Thất thoát sẽ trừ tồn kho. Khách trả còn bán được sẽ cộng lại tồn kho.
          </p>
        </div>

        <div className="loss-type-switch">

          <button
            type="button"
            className={
              isLoss
                ? "active loss"
                : ""
            }
            onClick={() =>
              setTransactionType(
                "LOSS"
              )
            }
          >
            − Bể vỡ / thất thoát
          </button>

          <button
            type="button"
            className={
              !isLoss
                ? "active return"
                : ""
            }
            onClick={() =>
              setTransactionType(
                "CUSTOMER_RETURN_RESALE"
              )
            }
          >
            + Khách trả còn bán được
          </button>

        </div>

      </div>

      <div className="loss-form-grid">

        <div>
          <label>
            Ngày
          </label>

          <input
            type="date"

            value={
              transactionDate
            }

            onChange={(e) =>
              setTransactionDate(
                e.target.value
              )
            }
          />
        </div>

        <div>
          <label>
            Người thực hiện
          </label>

          <input
            value={
              performedBy
            }

            placeholder="Tên nhân viên"

            onChange={(e) =>
              setPerformedBy(
                e.target.value
              )
            }
          />
        </div>

        <div>
          <label>
            Lý do
          </label>

          <select
            value={
              reason
            }

            onChange={(e) =>
              setReason(
                e.target.value
              )
            }
          >
            {isLoss ? (
              <>
                <option>
                  Bể trong kho
                </option>

                <option>
                  Thất thoát
                </option>

                <option>
                  Hàng lỗi
                </option>

                <option>
                  Bể khi đóng hàng
                </option>

                <option>
                  Bể khi vận chuyển nội bộ
                </option>

                <option>
                  Kiểm kho thiếu
                </option>

                <option>
                  Khác
                </option>
              </>
            ) : (
              <>
                <option>
                  Khách trả còn bán được
                </option>

                <option>
                  Đổi trả còn nguyên
                </option>

                <option>
                  Hoàn đơn còn bán được
                </option>
              </>
            )}
          </select>
        </div>

      </div>

      {selectedVariant ? (
        <div className="loss-selected-product">

          <div>

            <span>
              Sản phẩm
            </span>

            <strong>
              {
                selectedVariant.display_name
              }
            </strong>

          </div>

          <div>

            <span>
              SKU
            </span>

            <strong>
              {
                selectedVariant.variant_code
              }
            </strong>

          </div>

          <div>

            <span>
              Tồn hiện tại
            </span>

            <strong>
              {
                selectedVariant.current_quantity
              }
            </strong>

          </div>

          <div>

            <span>
              Giá vốn
            </span>

            <strong>
              {money(
                selectedVariant.purchase_price
              )}
            </strong>

          </div>

        </div>
      ) : (
        <div className="loss-no-product">
          Chưa chọn sản phẩm.
        </div>
      )}

      <div className="loss-bottom-form">

        <div>
          <label>
            Số lượng
          </label>

          <input
            type="number"

            min="1"

            value={
              quantity
            }

            onChange={(e) =>
              setQuantity(
                e.target.value
              )
            }
          />
        </div>

        <div className="loss-note-field">
          <label>
            Ghi chú
          </label>

          <input
            value={
              note
            }

            placeholder="Ghi chú nếu có"

            onChange={(e) =>
              setNote(
                e.target.value
              )
            }
          />
        </div>

        <div className="loss-value-box">

          <span>
            Giá trị
          </span>

          <strong>
            {money(
              totalValue
            )}
          </strong>

        </div>

        <button
          type="button"

          className={
            isLoss
              ? "loss-save-btn danger"
              : "loss-save-btn return"
          }

          disabled={
            saving ||
            !selectedVariant
          }

          onClick={
            onSave
          }
        >
          {saving
            ? "Đang lưu..."
            : isLoss
              ? "Ghi nhận thất thoát"
              : "Nhập lại kho"}
        </button>

      </div>

    </section>
  );
}