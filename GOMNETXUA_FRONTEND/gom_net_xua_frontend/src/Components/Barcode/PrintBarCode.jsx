import {
  useState,
  useMemo
} from "react";

import BarcodeDisplay from "./BarCodeDisplay";

import "./PrintBarCode.css";

function Print({

  variants = [],

  products = []

}) {

  // =====================================================
  // STATE
  // =====================================================

  const [
    selectedVariantId,
    setSelectedVariantId
  ] = useState("");

  const [
    searchKeyword,
    setSearchKeyword
  ] = useState("");

  const [
    quantity,
    setQuantity
  ] = useState(1);

  const [
    labelSize,
    setLabelSize
  ] = useState("40x30");

  const [
    previewLabels,
    setPreviewLabels
  ] = useState([]);


  // =====================================================
  // LẤY BIẾN THỂ ĐANG CHỌN
  // =====================================================

  const selectedVariant =
    useMemo(() => {

      return variants.find(
        (variant) =>
          Number(variant.id) ===
          Number(selectedVariantId)
      );

    }, [
      selectedVariantId,
      variants
    ]);


  // =====================================================
  // LẤY SẢN PHẨM CỦA BIẾN THỂ
  // =====================================================

  const selectedProduct =
    useMemo(() => {

      if (!selectedVariant) {
        return null;
      }

      return products.find(
        (product) =>
          Number(product.id) ===
          Number(
            selectedVariant.product_id
          )
      );

    }, [
      selectedVariant,
      products
    ]);


  // =====================================================
  // TÌM KIẾM BIẾN THỂ
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
              (item) =>
                Number(item.id) ===
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
      variants,
      products
    ]);


  // =====================================================
  // KÍCH THƯỚC TEM
  // =====================================================

  const labelConfig = {

    "40x30": {
      width: "40mm",
      height: "30mm"
    },

    "50x30": {
      width: "50mm",
      height: "30mm"
    },

    "50x40": {
      width: "50mm",
      height: "40mm"
    },

    "60x40": {
      width: "60mm",
      height: "40mm"
    }

  };


  // =====================================================
  // XEM TRƯỚC TEM
  // =====================================================

  const handlePreview = () => {

    if (!selectedVariant) {

      alert(
        "Vui lòng chọn sản phẩm hoặc biến thể!"
      );

      return;

    }

    const totalQuantity =
      Math.max(
        1,
        Number(quantity) || 1
      );

    const labels =
      Array.from(
        {
          length: totalQuantity
        },
        (_, index) => ({

          id:
            `${selectedVariant.id}-${index}`,

          variant:
            selectedVariant,

          product:
            selectedProduct

        })
      );

    setPreviewLabels(
      labels
    );

  };


  // =====================================================
  // IN TEM
  // =====================================================

  const handlePrint = () => {

    if (
      previewLabels.length === 0
    ) {

      alert(
        "Vui lòng xem trước tem trước khi in!"
      );

      return;

    }

    window.print();

  };


  return (

    <div className="barcode-print-page">


      {/* ============================================== */}
      {/* TITLE */}
      {/* ============================================== */}

      <div className="page-title">

        <h1>
          In tem mã vạch
        </h1>

        <p>
          Tìm kiếm sản phẩm, chọn biến thể và in tem.
        </p>

      </div>


      {/* ============================================== */}
      {/* FORM */}
      {/* ============================================== */}

      <div className="barcode-form-card">


        {/* TÌM KIẾM */}

        <div className="form-group">

          <label>
            Tìm sản phẩm hoặc SKU
          </label>

          <input

            type="text"

            placeholder="Nhập tên sản phẩm, SKU hoặc barcode..."

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


        {/* CHỌN BIẾN THỂ */}

        <div className="form-group">

          <label>
            Chọn sản phẩm / biến thể
          </label>

          <select

            value={
              selectedVariantId
            }

            onChange={(e) =>
              setSelectedVariantId(
                e.target.value
              )
            }

          >

            <option value="">

              -- Chọn biến thể --

            </option>


            {filteredVariants.map(
              (variant) => {

                const product =
                  products.find(
                    (item) =>
                      Number(item.id) ===
                      Number(
                        variant.product_id
                      )
                  );

                return (

                  <option

                    key={
                      variant.id
                    }

                    value={
                      variant.id
                    }

                  >

                    {
                      product?.product_name ||
                      "Không xác định"
                    }

                    {" - "}

                    {
                      variant.size
                        ? `SIZE ${variant.size}`
                        : "Không có size"
                    }

                    {" ("}

                    {
                      variant.variant_code
                    }

                    {")"}

                  </option>

                );

              }
            )}

          </select>

        </div>


        {/* ============================================ */}
        {/* SỐ LƯỢNG + SIZE */}
        {/* ============================================ */}

        <div className="form-row">


          {/* SỐ LƯỢNG */}

          <div className="form-group">

            <label>
              Số lượng tem
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


          {/* KÍCH THƯỚC */}

          <div className="form-group">

            <label>
              Kích thước tem
            </label>

            <select

              value={
                labelSize
              }

              onChange={(e) =>
                setLabelSize(
                  e.target.value
                )
              }

            >

              <option value="40x30">
                40 × 30 mm
              </option>

              <option value="50x30">
                50 × 30 mm
              </option>

              <option value="50x40">
                50 × 40 mm
              </option>

              <option value="60x40">
                60 × 40 mm
              </option>

            </select>

          </div>


        </div>


        {/* BUTTON */}

        <div className="barcode-actions">

          <button

            type="button"

            className="preview-btn"

            onClick={
              handlePreview
            }

          >

            Xem trước tem

          </button>


          <button

            type="button"

            className="print-btn"

            onClick={
              handlePrint
            }

          >

            In tem / Lưu PDF

          </button>


        </div>


      </div>


      {/* ============================================== */}
      {/* PREVIEW */}
      {/* ============================================== */}

      <div className="label-preview-area">

        {previewLabels.length === 0 ? (

          <div className="empty-preview">

            Chọn biến thể và nhấn
            {" "}
            "Xem trước tem"

          </div>

        ) : (

          <div
            className="print-label-container"
            data-label-size={labelSize}
          >

            {previewLabels.map(
              (label) => (

                <div

                  key={
                    label.id
                  }

                  className="barcode-label"

                  style={{

                    width:
                      labelConfig[
                        labelSize
                      ].width,

                    height:
                      labelConfig[
                        labelSize
                      ].height

                  }}

                >


                  {/* TÊN */}

                  <div className="label-product-name">

                    {
                      label.product
                        ?.product_name
                    }

                    {
                      label.variant?.size &&
                      ` - SIZE ${label.variant.size}`
                    }

                  </div>


                  {/* SKU */}

                  <div className="label-sku">

                    {
                      label.variant
                        ?.variant_code
                    }

                  </div>


                  {/* BARCODE */}

                  <div className="label-barcode">

                    <BarcodeDisplay

                      value={
                        label.variant
                          ?.barcode ||
                        label.variant
                          ?.variant_code
                      }

                      width={1.5}

                      height={45}

                    />

                  </div>


                  {/* GIÁ */}

                  <div className="label-price">

                    {
                      Number(
                        label.variant
                          ?.selling_price || 0
                      ).toLocaleString(
                        "vi-VN"
                      )
                    }

                    đ

                  </div>


                </div>

              )
            )}

          </div>

        )}

      </div>


    </div>

  );

}

export default Print;