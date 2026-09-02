
import React, { useState } from "react";
import BarcodeDisplay from "../Barcode/BarCodeDisplay";

function ProductsVariants({
  variants = [],
  products = [],
  groups = [],

  selectedGroup,
  selectedProduct,
  selectedStatus,
  searchKeyword,
  isAdmin = false,

  onChangeGroup,
  onChangeProduct,
  onChangeStatus,
  onSearch,

  onShowBarcode,

  onEditProduct,
  onDeleteProduct,

  onEditVariant,
  onDeleteVariant
}) {

  const [selectedBarcodeVariant, setSelectedBarcodeVariant] = useState(null);

  // Code tiếp theo...
  // =====================================================
  // LẤY TÊN NHÓM
  // =====================================================

  const getGroupName = (groupId) => {
    const group = groups.find(
      (item) =>
        Number(item.id) === Number(groupId)
    );

    return group?.group_name || "-";
  };

  // =====================================================
  // LẤY VARIANT CỦA PRODUCT
  // =====================================================

  const getProductVariants = (productId) => {
    return variants.filter(
      (variant) =>
        Number(variant.product_id) ===
        Number(productId)
    );
  };

  // =====================================================
  // LỌC SẢN PHẨM THEO SEARCH
  // =====================================================

  const displayProducts = products.filter(
    (product) => {
      // -------------------------------------------------
      // FILTER PRODUCT ĐANG CHỌN
      // -------------------------------------------------

      if (
        selectedProduct &&
        Number(product.id) !==
          Number(selectedProduct)
      ) {
        return false;
      }

      // -------------------------------------------------
      // KHÔNG SEARCH
      // -------------------------------------------------

      if (!searchKeyword?.trim()) {
        return true;
      }

      const keyword =
        searchKeyword
          .toLowerCase()
          .trim();

      // -------------------------------------------------
      // SEARCH PRODUCT
      // -------------------------------------------------

      const productNameMatch =
        product.product_name
          ?.toLowerCase()
          .includes(keyword);

      const productCodeMatch =
        product.product_code
          ?.toLowerCase()
          .includes(keyword);

      // -------------------------------------------------
      // SEARCH VARIANT
      // -------------------------------------------------

      const productVariants =
        getProductVariants(
          product.id
        );

      const variantMatch =
        productVariants.some(
          (variant) =>
            variant.variant_code
              ?.toLowerCase()
              .includes(keyword) ||

            variant.size
              ?.toLowerCase()
              .includes(keyword) ||

            variant.barcode
              ?.toLowerCase()
              .includes(keyword)
        );

      return (
        productNameMatch ||
        productCodeMatch ||
        variantMatch
      );
    }
  );

  return (
    <div className="card variants-card">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="section-label">
        CẤP 2 – 3
      </div>

      <h2>
        Danh mục sản phẩm & biến thể
      </h2>


      {/* ================================================= */}
      {/* SEARCH */}
      {/* ================================================= */}

      <div className="filter-section">

        <input
          type="text"
          placeholder="Tìm nhóm, sản phẩm, size, SKU hoặc barcode"
          value={searchKeyword || ""}
          onChange={(e) => {
            onSearch?.(
              e.target.value
            );
          }}
        />

      </div>


      {/* ================================================= */}
      {/* FILTER */}
      {/* ================================================= */}

      <div className="filter-row">

        {/* ================================================= */}
        {/* GROUP */}
        {/* ================================================= */}

        <select
          value={selectedGroup || ""}
          onChange={(e) => {

            onChangeGroup?.(
              e.target.value
            );

          }}
        >

          <option value="">
            Tất cả nhóm sản phẩm
          </option>

          {groups.map(
            (group) => (

              <option
                key={group.id}
                value={group.id}
              >
                {group.group_name}
              </option>

            )
          )}

        </select>


        {/* ================================================= */}
        {/* PRODUCT */}
        {/* ================================================= */}

        <select
          value={
            selectedProduct || ""
          }

          disabled={!selectedGroup}

          onChange={(e) => {

            onChangeProduct?.(
              e.target.value
            );

          }}
        >

          <option value="">

            {!selectedGroup
              ? "Tất cả sản phẩm gốc"
              : "Tất cả sản phẩm gốc"
            }

          </option>

          {products.map(
            (product) => (

              <option
                key={product.id}
                value={product.id}
              >
                {product.product_name}
              </option>

            )
          )}

        </select>


        {/* ================================================= */}
        {/* STATUS */}
        {/* ================================================= */}

        <select
          value={
            selectedStatus || ""
          }

          onChange={(e) => {

            onChangeStatus?.(
              e.target.value
            );

          }}
        >

          <option value="">
            Tất cả trạng thái
          </option>

          <option value="active">
            Đang sử dụng
          </option>

          <option value="inactive">
            Ngừng sử dụng
          </option>

        </select>

      </div>


      {/* ================================================= */}
      {/* THÔNG TIN ĐANG CHỌN
          Chỉ hiện khi có group
      */}
      {/* ================================================= */}

      {selectedGroup && (

        <div className="selected-info">

          <strong>
            Nhóm:
          </strong>

          {" "}

          {getGroupName(
            selectedGroup
          )}

          {selectedProduct && (
            <>
              {" / "}

              <strong>
                Sản phẩm:
              </strong>

              {" "}

              {
                products.find(
                  (product) =>
                    Number(product.id) ===
                    Number(selectedProduct)
                )?.product_name
              }
            </>
          )}

        </div>

      )}


      {/* ================================================= */}
      {/* TABLE */}
      {/* ================================================= */}

      <div className="table-container">

        <table>

          <thead>

            <tr>

              <th>
                Nhóm sản phẩm
              </th>

              <th>
                Sản phẩm gốc
              </th>

              <th>
                Size
              </th>

              <th>
                SKU
              </th>

              <th>
                Barcode
              </th>
              {isAdmin && (
              <th>
                Giá nhập
              </th>
              )}
              <th>
                Giá bán
              </th>
              
              <th>
                Tồn
              </th>
              
              <th>
                Tồn tối thiểu
              </th>
              {isAdmin && (
              <th>
                Giá trị tồn
              </th>
              )}

              <th>
                Trạng thái
              </th>
              {isAdmin && (
              <th>
                Hành động
              </th>
              )}

            </tr>

          </thead>


          <tbody>

            {/* ================================================= */}
            {/* KHÔNG CÓ DỮ LIỆU
                Chỉ báo khi thực sự không có product
            */}
            {/* ================================================= */}

            {displayProducts.length === 0 ? (

              <tr>

                <td
                  colSpan="12"
                  className="empty-table"
                >
                  Không tìm thấy sản phẩm.
                </td>

              </tr>

            ) : (

              displayProducts.map(
                (product) => {

                  const productVariants =
                    getProductVariants(
                      product.id
                    );


                  {/* ================================================= */}
                  {/* PRODUCT KHÔNG CÓ VARIANT */}
                  {/* ================================================= */}

                  if (
                    productVariants.length ===
                    0
                  ) {

                    return (

                      <tr
                        key={`product-${product.id}`}
                      >

                        {/* GROUP */}

                        <td>
                          {getGroupName(
                            product.group_id
                          )}
                        </td>


                        {/* PRODUCT */}

                        <td>

                          <div className="product-name-cell">

                            <strong>
                              {
                                product.product_name
                              }
                            </strong>

                            <small>
                              
                              Mã:{" "}
                              {
                                product.product_code
                              }
                            </small>

                          </div>

                        </td>


                        {/* VARIANT */}

                        <td>
                          -
                        </td>


                        {/* SKU */}

                        <td>
                          -
                        </td>


                        {/* BARCODE */}

                        <td>
                          -
                        </td>


                        {/* PURCHASE */}

                        <td>
                          -
                        </td>


                        {/* SELLING */}

                        <td>
                          -
                        </td>


                        {/* STOCK */}

                        <td>
                          -
                        </td>


                        {/* MIN STOCK */}

                        <td>
                          -
                        </td>


                        {/* INVENTORY VALUE */}

                        <td>
                          -
                        </td>


                        {/* STATUS */}

                        <td>

                          {product.status ===
                          "active"
                            ? "Đang dùng"
                            : "Ngừng dùng"}

                        </td>


                        {/* PRODUCT ACTION */}

                        <td>

                          <div className="action-buttons">
                            {isAdmin && (
                            <button
                              type="button"
                              className="edit-btn"
                              onClick={() =>
                                onEditProduct?.(
                                  product
                                )
                              }
                            >
                              Sửa
                            </button>
                            )}
                            {isAdmin && (
                            <button
                              type="button"
                              className="delete-btn"
                              onClick={() =>
                                onDeleteProduct?.(
                                  product.id
                                )
                              }
                            >
                              Xóa
                            </button>
                            )}
                          </div>

                        </td>

                      </tr>

                    );
                  }


                  {/* ================================================= */}
                  {/* PRODUCT CÓ VARIANT */}
                  {/* ================================================= */}

                  return productVariants.map(
                    (variant, index) => {

                      const currentQuantity =
                        Number(
                          variant.current_quantity ||
                            0
                        );

                      const minQuantity =
                        Number(
                          variant.min_stock_quantity ||
                            0
                        );

                      // TỒN THẤP
                      const isLowStock =
                        currentQuantity <
                        minQuantity;

                      const inventoryValue =
                        Number(
                          variant.purchase_price ||
                            0
                        ) *
                        currentQuantity;


                      return (

                        <tr
                          key={
                            variant.id
                          }
                        >

                          {/* ================================================= */}
                          {/* GROUP */}
                          {/* ================================================= */}

                          <td>

                            {getGroupName(
                              product.group_id
                            )}

                          </td>


                          {/* ================================================= */}
                          {/* PRODUCT */}
                          {/* ================================================= */}

                          <td>

                            <div className="product-name-cell">

                              <strong>
                                {
                                  product.product_name
                                }
                              </strong>

                              <small>
                                Mã:{" "}
                                {
                                  product.product_code
                                }
                              </small>

                            </div>


                            {/* PRODUCT ACTION */}

                            {index === 0 && (

                              <div className="product-action-small">

                                <button
                                  type="button"
                                  className="edit-btn"
                                  onClick={() =>
                                    onEditProduct?.(
                                      product
                                    )
                                  }
                                >
                                  Sửa SP
                                </button>

                                <button
                                  type="button"
                                  className="delete-btn"
                                  onClick={() =>
                                    onDeleteProduct?.(
                                      product.id
                                    )
                                  }
                                >
                                  Xóa SP
                                </button>

                              </div>

                            )}

                          </td>


                          {/* ================================================= */}
                          {/* SIZE */}
                          {/* ================================================= */}

                          <td>
                            {variant.size ||
                              "-"}
                          </td>


                          {/* ================================================= */}
                          {/* SKU */}
                          {/* ================================================= */}

                          <td>
                            {variant.variant_code ||
                              "-"}
                          </td>


                          {/* ================================================= */}
                          {/* BARCODE */}
                          {/* ================================================= */}

                          <td>
                            {/* {variant.barcode ||
                              "-"} */}
                              <button
  type="button"
  className="barcode-btn"
  onClick={() => setSelectedBarcodeVariant(variant)}
>
  Barcode
</button>
                          </td>


                          {/* ================================================= */}
                          {/* PURCHASE PRICE */}
                          {/* ================================================= */}
                          {isAdmin && (
                          <td>

                            {Number(
                              variant.purchase_price ||
                                0
                            ).toLocaleString(
                              "vi-VN"
                            )}

                            {" "}đ

                          </td>
                          )}


                          {/* ================================================= */}
                          {/* SELLING PRICE */}
                          {/* ================================================= */}

                          <td>

                            {Number(
                              variant.selling_price ||
                                0
                            ).toLocaleString(
                              "vi-VN"
                            )}

                            {" "}đ

                          </td>


                          {/* ================================================= */}
                          {/* STOCK */}
                          {/* ================================================= */}

                          <td
                            className={
                              isLowStock
                                ? "low-stock"
                                : ""
                            }
                          >

                            {currentQuantity}

                          </td>


                          {/* ================================================= */}
                          {/* MIN STOCK */}
                          {/* ================================================= */}

                          <td>

                            {minQuantity}

                          </td>


                          {/* ================================================= */}
                          {/* INVENTORY VALUE */}
                          {/* ================================================= */}
                            {isAdmin && (
                          <td>

                            {inventoryValue.toLocaleString(
                              "vi-VN"
                            )}

                            {" "}đ

                          </td>
                            )}


                          {/* ================================================= */}
                          {/* STATUS */}
                          {/* ================================================= */}

                          <td>

                            {variant.status ===
                            "active"
                              ? "Đang dùng"
                              : "Ngừng dùng"}

                          </td>


                          {/* ================================================= */}
                          {/* VARIANT ACTION */}
                          {/* ================================================= */}
                          {isAdmin && (
                          <td>

                            <div className="action-buttons">

                              <button
                                type="button"
                                className="edit-btn"
                                onClick={() =>
                                  onEditVariant?.(
                                    variant
                                  )
                                }
                              >
                                Sửa
                              </button>

                              <button
                                type="button"
                                className="delete-btn"
                                onClick={() =>
                                  onDeleteVariant?.(
                                    variant
                                  )
                                }
                              >
                                Xóa
                              </button>

                            </div>

                          </td>
                          )}
                        </tr>

                      );

                    }
                  );

                }
              )

            )}

          </tbody>

        </table>

      </div>
      {selectedBarcodeVariant && (

  <div
    className="modal-overlay"
    onClick={() => setSelectedBarcodeVariant(null)}
  >

    <div
      className="barcode-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="modal-header">

        <h2>Mã Barcode sản phẩm</h2>

        <button
          onClick={() => setSelectedBarcodeVariant(null)}
        >
          ✕
        </button>

      </div>

      <div className="barcode-content">

        <p>
          SKU:{" "}
          <strong>
            {selectedBarcodeVariant.variant_code}
          </strong>
        </p>

        <BarcodeDisplay
          value={
            selectedBarcodeVariant.barcode ||
            selectedBarcodeVariant.variant_code
          }
          width={2}
          height={80}
        />

      </div>

    </div>

  </div>

)}
    </div>
  );
}

export default ProductsVariants;