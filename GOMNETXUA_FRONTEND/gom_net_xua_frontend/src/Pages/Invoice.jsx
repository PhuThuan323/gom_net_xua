import {
  useCallback,
  useEffect,
  useState,
} from "react";

import InvoiceRegistry from "../Components/Invoice/invoiceRegistry";
import InvoiceBrandSettings from "../Components/Invoice/invoiceBrand";
import InvoiceEditor from "../Components/Invoice/invoiceEditor";

import "../Components/Invoice/invoice.css";

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

/*
 * Không để dấu / ở cuối.
 *
 * API:
 * http://localhost:3000/invoice
 */
const INVOICE_API = `${API_URL}/invoice`;

/*
|--------------------------------------------------------------------------
| API HELPER
|--------------------------------------------------------------------------
*/

async function api(path, options = {}) {
  /*
   * Bảo đảm path luôn bắt đầu bằng /
   */
  const safePath = path.startsWith("/")
    ? path
    : `/${path}`;

  const url = `${INVOICE_API}${safePath}`;

  const response = await fetch(url, {
    ...options,

    headers: {
      "Content-Type": "application/json",

      ...(options.headers || {}),
    },
  });

  const raw = await response.text();

  let data;

  try {
    data = raw
      ? JSON.parse(raw)
      : {};
  } catch (error) {
    console.error(
      "API KHÔNG TRẢ JSON:",
      {
        url,
        status: response.status,
        raw,
      }
    );

    throw new Error(
      `API không trả JSON: ${url}`
    );
  }

  if (
    !response.ok ||
    data?.success === false
  ) {
    throw new Error(
      data?.message ||
        `API lỗi ${response.status}`
    );
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function Invoice() {
  const [brands, setBrands] =
    useState([]);

  const [customers, setCustomers] =
    useState([]);

  const [variants, setVariants] =
    useState([]);

  const [
    invoiceCode,
    setInvoiceCode,
  ] = useState("");

  const [
    invoicesRefresh,
    setInvoicesRefresh,
  ] = useState(0);

  const [loading, setLoading] =
    useState(true);

  /*
  |--------------------------------------------------------------------------
  | Bootstrap
  |--------------------------------------------------------------------------
  */

  const loadBootstrap =
    useCallback(async () => {
      try {
        setLoading(true);

        const result =
          await api(
            "/bootstrap"
          );

        const payload =
          result?.data || {};

        /*
         * Luôn kiểm tra Array
         * để tránh lỗi .filter / .map
         */
        setBrands(
          Array.isArray(
            payload.brands
          )
            ? payload.brands
            : []
        );

        setCustomers(
          Array.isArray(
            payload.customers
          )
            ? payload.customers
            : []
        );

        setVariants(
          Array.isArray(
            payload.variants
          )
            ? payload.variants
            : []
        );

        setInvoiceCode(
          payload.invoice_code ||
            ""
        );
      } catch (error) {
        console.error(
          "LOAD INVOICE BOOTSTRAP:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu hóa đơn"
        );

        /*
         * Không để state undefined
         */
        setBrands([]);
        setCustomers([]);
        setVariants([]);
      } finally {
        setLoading(false);
      }
    }, []);

  /*
  |--------------------------------------------------------------------------
  | Initial
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  /*
  |--------------------------------------------------------------------------
  | Refresh Customers
  |--------------------------------------------------------------------------
  */

  const refreshCustomers =
    useCallback(async () => {
      try {
        const result =
          await api(
            "/customers"
          );

        setCustomers(
          Array.isArray(
            result?.data
          )
            ? result.data
            : []
        );
      } catch (error) {
        console.error(
          "REFRESH CUSTOMERS:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Không tải được danh bạ khách hàng"
        );
      }
    }, []);

  /*
  |--------------------------------------------------------------------------
  | Brand Saved
  |--------------------------------------------------------------------------
  */

  const handleBrandSaved =
    useCallback(async () => {
      try {
        const result =
          await api(
            "/brands"
          );

        setBrands(
          Array.isArray(
            result?.data
          )
            ? result.data
            : []
        );
      } catch (error) {
        console.error(
          "REFRESH BRANDS:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Không tải được thương hiệu"
        );
      }
    }, []);

  /*
  |--------------------------------------------------------------------------
  | Invoice Saved
  |--------------------------------------------------------------------------
  */

  const handleInvoiceSaved =
    useCallback(async () => {
      try {
        const result =
          await api(
            "/next-code"
          );

        setInvoiceCode(
          result?.data
            ?.invoice_code ||
            ""
        );

        setInvoicesRefresh(
          (prev) =>
            prev + 1
        );
      } catch (error) {
        console.error(
          "NEXT INVOICE CODE:",
          error
        );
      }
    }, []);

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <main className="invoice-page">

      <InvoiceRegistry
        api={api}
        customers={
          Array.isArray(
            customers
          )
            ? customers
            : []
        }
        onCustomersChanged={
          refreshCustomers
        }
        refreshKey={
          invoicesRefresh
        }
      />

      <InvoiceBrandSettings
        api={api}
        brands={
          Array.isArray(
            brands
          )
            ? brands
            : []
        }
        onSaved={
          handleBrandSaved
        }
      />

      <InvoiceEditor
        api={api}

        brands={
          Array.isArray(
            brands
          )
            ? brands
            : []
        }

        customers={
          Array.isArray(
            customers
          )
            ? customers
            : []
        }

        variants={
          Array.isArray(
            variants
          )
            ? variants
            : []
        }

        invoiceCode={
          invoiceCode
        }

        onCustomerSaved={
          refreshCustomers
        }

        onInvoiceSaved={
          handleInvoiceSaved
        }
      />

      {loading && (
        <div className="invoice-loading">
          Đang tải dữ liệu...
        </div>
      )}

    </main>
  );
}