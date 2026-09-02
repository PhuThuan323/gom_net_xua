import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

function BarcodeDisplay({
  value,
  width = 2,
  height = 60
}) {

  const barcodeRef =
    useRef(null);

  useEffect(() => {

    if (
      !value ||
      !barcodeRef.current
    ) {
      return;
    }

    try {

      JsBarcode(
        barcodeRef.current,
        value,
        {
          format: "CODE128",

          displayValue: true,

          width,

          height,

          margin: 10
        }
      );

    } catch (error) {

      console.error(
        "Lỗi tạo barcode:",
        error
      );

    }

  }, [
    value,
    width,
    height
  ]);

  return (

    <svg
      ref={barcodeRef}
    />

  );

}

export default BarcodeDisplay;