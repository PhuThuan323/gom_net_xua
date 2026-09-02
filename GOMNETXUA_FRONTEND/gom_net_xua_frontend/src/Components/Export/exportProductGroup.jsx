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

/* =========================================================
   TEXT NORMALIZE
========================================================= */

const normalize = (
  value
) =>
  String(
    value ||
      ""
  )
    .toLowerCase()
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim();

/* =========================================================
   COMPONENT
========================================================= */

export default function ExportProductGroups({
  groups = [],
  search = "",

  quantityMap = {},

  setVariantQuantity,

  incrementVariant,

  loading,
  
  isAdmin = false
}) {
  const keyword =
    normalize(
      search
    );

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredGroups =
    groups
      .map(
        (
          group
        ) => {
          const products =
            (
              group.products ||
              []
            )
              .map(
                (
                  product
                ) => {
                  const variants =
                    (
                      product.variants ||
                      []
                    ).filter(
                      (
                        variant
                      ) => {
                        if (
                          !keyword
                        ) {
                          return true;
                        }

                        const haystack =
                          normalize(
                            [
                              group.group_name,

                              product.product_name,

                              product.product_code,

                              variant.size,

                              variant.variant_code,

                              variant.barcode,
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                " "
                              )
                          );

                        return haystack.includes(
                          keyword
                        );
                      }
                    );

                  return {
                    ...product,

                    variants,
                  };
                }
              )
              .filter(
                (
                  product
                ) =>
                  product.variants
                    .length >
                  0
              );

          return {
            ...group,

            products,
          };
        }
      )
      .filter(
        (
          group
        ) =>
          group.products
            .length >
          0
      );

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="export-loading-card">
        Đang tải danh mục kho...
      </div>
    );
  }

  if (
    filteredGroups.length ===
    0
  ) {
    return (
      <div className="export-empty">
        Không tìm thấy sản phẩm phù hợp.
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="export-catalog">

      {filteredGroups.map(
        (
          group
        ) => (
          <section
            key={
              group.id
            }
            className="export-group"
          >

            {group.products.map(
              (
                product
              ) => (
                <div
                  key={
                    product.id
                  }
                  className="export-product"
                >

                  {/* =======================================
                      TITLE
                  ======================================= */}

                  <h2 className="export-product-title">

                    <span>
                      {
                        group.group_name
                      }
                    </span>

                    <span className="export-product-arrow">
                      →
                    </span>

                    <strong>
                      {
                        product.product_name
                      }
                    </strong>

                  </h2>

                  {/* =======================================
                      VARIANTS
                  ======================================= */}

                  <div className="export-variant-grid">

                    {product.variants.map(
                      (
                        variant
                      ) => {
                        const id =
                          Number(
                            variant.id
                          );

                        const quantity =
                          Number(
                            quantityMap[
                              id
                            ] || 0
                          );

                        const stock =
                          Number(
                            variant.current_quantity ||
                              0
                          );

                        const remaining =
                          stock -
                          quantity;

                        const outOfStock =
                          stock <=
                          0;

                        const selected =
                          quantity >
                          0;

                        const displayVariant = {
                          ...variant,

                          group_name:
                            group.group_name,

                          product_name:
                            product.product_name,

                          product_code:
                            product.product_code,

                          display_name:
                            [
                              product.product_name,
                              variant.size,
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                " - "
                              ),
                        };

                        return (
                          <div
                            key={
                              variant.id
                            }

                            className={[
                              "export-variant-card",

                              selected
                                ? "selected"
                                : "",

                              outOfStock
                                ? "out-of-stock"
                                : "",
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                " "
                              )}
                          >

                            {/* ===========================
                                IMAGE
                            =========================== */}

                            <div className="export-variant-image">

                              {variant.image_url ||
                              product.image_url ? (
                                <img
                                  src={
                                    variant.image_url ||
                                    product.image_url
                                  }

                                  alt={
                                    variant.size ||
                                    product.product_name
                                  }
                                />
                              ) : (
                                <span>
                                  Không
                                  <br />
                                  ảnh
                                </span>
                              )}

                            </div>

                            {/* ===========================
                                CONTENT
                            =========================== */}

                            <div className="export-variant-content">

                              <strong className="export-variant-size">
                                {variant.size ||
                                  "Không size"}
                              </strong>

                              <div className="export-variant-meta">

                                <span>
                                  SKU:{" "}
                                  <b>
                                    {
                                      variant.variant_code
                                    }
                                  </b>
                                </span>

                                {variant.barcode && (
                                  <span>
                                    Barcode:{" "}
                                    <b>
                                      {
                                        variant.barcode
                                      }
                                    </b>
                                  </span>
                                )}

                                <span>
                                  Tồn:{" "}
                                  <b>
                                    {
                                      stock
                                    }
                                  </b>
                                </span>
                                {isAdmin && (
                                <span>
                                  Giá vốn:{" "}
                                  <b>
                                    {money(
                                      variant.purchase_price
                                    )}
                                  </b>
                                </span>
                                )}
                              </div>

                              {selected && (
                                <div className="export-remaining">

                                  Sau xuất còn:{" "}

                                  <strong>
                                    {
                                      remaining
                                    }
                                  </strong>

                                </div>
                              )}

                            </div>

                            {/* ===========================
                                QUANTITY
                            =========================== */}

                            <div className="export-quantity-control">

                              <button
                                type="button"

                                className="export-qty-btn"

                                disabled={
                                  quantity <=
                                  0
                                }

                                onClick={() =>
                                  setVariantQuantity(
                                    id,
                                    quantity -
                                      1
                                  )
                                }
                              >
                                −
                              </button>

                              <input
                                type="number"

                                min="0"

                                max={
                                  stock
                                }

                                value={
                                  quantity
                                }

                                disabled={
                                  outOfStock
                                }

                                onChange={(e) =>
                                  setVariantQuantity(
                                    id,
                                    e.target.value
                                  )
                                }
                              />

                              <button
                                type="button"

                                className="export-qty-btn"

                                disabled={
                                  quantity >=
                                    stock ||
                                  outOfStock
                                }

                                onClick={() =>
                                  incrementVariant(
                                    displayVariant,
                                    1
                                  )
                                }
                              >
                                +
                              </button>

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>
              )
            )}

          </section>
        )
      )}

    </div>
  );
}