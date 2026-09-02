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

const normalize = (
  value
) =>
  String(
    value || ""
  )
    .toLowerCase()
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );

export default function LossProductPicker({
  variants = [],

  search,

  setSearch,

  selectedVariant,

  setSelectedVariant,

  loading,
}) {
  const keyword =
    normalize(
      search
    );

  const filtered =
    variants.filter(
      (
        variant
      ) => {
        if (!keyword) {
          return true;
        }

        return normalize(
          [
            variant.group_name,

            variant.product_name,

            variant.product_code,

            variant.size,

            variant.variant_code,

            variant.barcode,
          ]
            .filter(Boolean)
            .join(" ")
        ).includes(
          keyword
        );
      }
    );

  return (
    <section className="loss-card">

      <h2>
        Chọn sản phẩm / biến thể
      </h2>

      <input
        className="loss-search"

        value={
          search
        }

        placeholder="Tìm sản phẩm, size, SKU hoặc barcode"

        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
      />

      {loading ? (
        <div className="loss-empty">
          Đang tải...
        </div>
      ) : (
        <div className="loss-product-grid">

          {filtered.map(
            (
              variant
            ) => {
              const selected =
                Number(
                  selectedVariant?.id
                ) ===
                Number(
                  variant.id
                );

              return (
                <button
                  key={
                    variant.id
                  }

                  type="button"

                  className={
                    selected
                      ? "loss-product-item selected"
                      : "loss-product-item"
                  }

                  onClick={() =>
                    setSelectedVariant(
                      variant
                    )
                  }
                >

                  <div className="loss-product-image">

                    {variant.image_url ? (
                      <img
                        src={
                          variant.image_url
                        }

                        alt=""
                      />
                    ) : (
                      <span>
                        Không ảnh
                      </span>
                    )}

                  </div>

                  <div className="loss-product-info">

                    <strong>
                      {
                        variant.display_name
                      }
                    </strong>

                    <span>
                      Nhóm:{" "}
                      {
                        variant.group_name
                      }
                    </span>

                    <span>
                      SKU:{" "}
                      <b>
                        {
                          variant.variant_code
                        }
                      </b>
                    </span>

                    <span>
                      Barcode:{" "}
                      {
                        variant.barcode ||
                        "—"
                      }
                    </span>

                    <span>
                      Tồn:{" "}
                      <b>
                        {
                          variant.current_quantity
                        }
                      </b>
                      {" · "}
                      Giá vốn:{" "}
                      <b>
                        {money(
                          variant.purchase_price
                        )}
                      </b>
                    </span>

                  </div>

                </button>
              );
            }
          )}

        </div>
      )}

    </section>
  );
}