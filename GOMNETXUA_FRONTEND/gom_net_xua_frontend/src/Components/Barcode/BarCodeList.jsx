import {
  useState,
  useMemo
} from "react";

import BarcodeDisplay
  from "./BarCodeDisplay";

import "./BarCodeList.css";


function BarcodeList({

  products = [],

  variants = []

}) {


  // =====================================================
  // STATE
  // =====================================================

  const [
    searchKeyword,
    setSearchKeyword
  ] = useState("");

  const [
    selectedVariant,
    setSelectedVariant
  ] = useState(null);


  // =====================================================
  // FILTER
  // =====================================================

  const filteredVariants =
    useMemo(() => {

      const keyword =
        searchKeyword
          .toLowerCase()
          .trim();

      if (!keyword) {
        return variants;
      }

      return variants.filter(
        (variant) => {

          const product =
            products.find(
              (product) =>
                Number(product.id) ===
                Number(
                  variant.product_id
                )
            );

          const productName =
            product?.product_name
              ?.toLowerCase() || "";

          const sku =
            variant.variant_code
              ?.toLowerCase() || "";

          const barcode =
            variant.barcode
              ?.toLowerCase() || "";

          return (

            productName.includes(keyword) ||

            sku.includes(keyword) ||

            barcode.includes(keyword)

          );

        }
      );

    }, [

      searchKeyword,

      products,

      variants

    ]);


  return (

    <div className="barcode-list-card">


      {/* ============================================== */}
      {/* HEADER */}
      {/* ============================================== */}

      <div className="section-title">

        <h2>
          Danh sách mã vạch
        </h2>

        <p>
          Tổng số:{" "}

          <strong>
            {filteredVariants.length}
          </strong>

          {" "}biến thể

        </p>

      </div>


      {/* ============================================== */}
      {/* SEARCH */}
      {/* ============================================== */}

      <div className="barcode-search">

        <input

          type="text"

          placeholder="Tìm theo tên sản phẩm, SKU hoặc barcode..."

          value={
            searchKeyword
          }

          onChange={(e) =>
            setSearchKeyword(
              e.target.value
            )
          }

        />

      </div>


      {/* ============================================== */}
      {/* TABLE */}
      {/* ============================================== */}

      <div className="barcode-table-container">

        <table>

          <thead>

            <tr>

              <th>
                Sản phẩm
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

              <th>
                Trạng thái
              </th>

            </tr>

          </thead>


          <tbody>


            {filteredVariants.length === 0 ? (

              <tr>

                <td
                  colSpan="5"
                  className="empty-barcode"
                >

                  Không tìm thấy mã vạch.

                </td>

              </tr>

            ) : (

              filteredVariants.map(
                (variant) => {

                  const product =
                    products.find(
                      (product) =>
                        Number(product.id) ===
                        Number(
                          variant.product_id
                        )
                    );


                  return (

                    <tr
                      key={
                        variant.id
                      }
                    >


                      {/* SẢN PHẨM */}

                      <td>

                        {
                          product
                            ?.product_name ||
                          "-"
                        }

                      </td>


                      {/* SIZE */}

                      <td>

                        {
                          variant.size ||
                          "-"
                        }

                      </td>


                      {/* SKU */}

                      <td>

                        {
                          variant.variant_code ||
                          "-"
                        }

                      </td>


                      {/* BARCODE */}

                      <td>

                        <button

                          type="button"

                          className="show-barcode-btn"

                          onClick={() =>
                            setSelectedVariant(
                              variant
                            )
                          }

                        >

                          Xem Barcode

                        </button>

                      </td>


                      {/* TRẠNG THÁI */}

                      <td>

                        {
                          variant.status ===
                          "active"
                            ? "Đang sử dụng"
                            : "Ngừng sử dụng"
                        }

                      </td>


                    </tr>

                  );

                }
              )

            )}


          </tbody>

        </table>

      </div>


      {/* ============================================== */}
      {/* MODAL BARCODE */}
      {/* ============================================== */}

      {selectedVariant && (

        <div

          className="barcode-modal-overlay"

          onClick={() =>
            setSelectedVariant(
              null
            )
          }

        >

          <div

            className="barcode-modal"

            onClick={(e) =>
              e.stopPropagation()
            }

          >


            {/* HEADER */}

            <div className="barcode-modal-header">

              <h2>
                Mã Barcode
              </h2>


              <button

                type="button"

                className="barcode-close-btn"

                onClick={() =>
                  setSelectedVariant(
                    null
                  )
                }

              >

                ✕

              </button>

            </div>


            {/* CONTENT */}

            <div className="barcode-modal-content">

              <p>

                <strong>
                  SKU:
                </strong>

                {" "}

                {
                  selectedVariant
                    .variant_code
                }

              </p>


              <p>

                <strong>
                  Barcode:
                </strong>

                {" "}

                {
                  selectedVariant
                    .barcode ||
                  selectedVariant
                    .variant_code
                }

              </p>


              <div className="barcode-display-box">

                <BarcodeDisplay

                  value={
                    selectedVariant
                      .barcode ||
                    selectedVariant
                      .variant_code
                  }

                  width={2}

                  height={80}

                />

              </div>

            </div>


          </div>

        </div>

      )}


    </div>

  );

}

export default BarcodeList;