import { useEffect, useState } from "react";

import Print from "../Components/Barcode/PrintBarCode.jsx";
import BarcodeList from "../Components/Barcode/BarCodeList.jsx";

const API_URL = import.meta.env.VITE_API_URL;

function Tem() {

  const [products, setProducts] =
    useState([]);
    
  const [variants, setVariants] =
    useState([]);
    const [
  searchKeyword,
  setSearchKeyword
] = useState("");
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const loadData = async () => {

      try {

        setLoading(true);
        const response =
          await fetch(
            `${API_URL}/product-groups`
          );

        if (!response.ok) {

          throw new Error(
            "Không thể tải dữ liệu sản phẩm"
          );
        }
        const result =
          await response.json();
        console.log(
          "Dữ liệu product groups:",
          result
        );

        const groups =
          Array.isArray(result.data)
            ? result.data
            : [];

        const allProducts =
          groups.flatMap(
            (group) => {

              return Array.isArray(
                group.products
              )
                ? group.products
                : [];

            }
          );

        const allVariants =
          allProducts.flatMap(
            (product) => {

              return Array.isArray(
                product.variants
              )
                ? product.variants
                : [];

            }
          );

        console.log(
          "Products:",
          allProducts
        );

        console.log(
          "Variants:",
          allVariants
        );

        setProducts(
          allProducts
        );

        setVariants(
          allVariants
        );

      } catch (error) {

        console.error(
          "Lỗi tải dữ liệu:",
          error
        );

        setProducts([]);
        setVariants([]);

      } finally {

        setLoading(false);

      }

    };

    loadData();

  }, []);


  if (loading) {

    return (

      <div>
        Đang tải dữ liệu...
      </div>

    );

  }

  return (

    <div className="tem-page">

      <Print
        products={products}
        variants={variants}
      />

      <BarcodeList
        products={products}
        variants={variants}
      />

    </div>

  );

}

export default Tem;