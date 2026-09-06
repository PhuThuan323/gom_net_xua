import {
  useCallback,
  useEffect,
  useState,
} from "react";

import InvoiceRegistry from "../Components/Invoice/invoiceRegistry";
import InvoiceBrandSettings from "../Components/Invoice/invoiceBrand";
import InvoiceEditor from "../Components/Invoice/invoiceEditor";

import "../Components/Invoice/invoice.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

const INVOICE_API =
  `${API_URL}/invoice`;

async function api(
  path,
  options = {}
) {
  const safePath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  const url =
    `${INVOICE_API}${safePath}`;

  const response =
    await fetch(
      url,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          ...(options.headers ||
            {}),
        },
      }
    );

  const raw =
    await response.text();

  let data;

  try {
    data =
      raw
        ? JSON.parse(
            raw
          )
        : {};
  } catch {
    console.error(
      "API KHÔNG TRẢ JSON:",
      {
        url,
        status:
          response.status,
        raw,
      }
    );

    throw new Error(
      `API không trả JSON: ${url}`
    );
  }

  if (
    !response.ok ||
    data?.success ===
      false
  ) {
    throw new Error(
      data?.message ||
        `API lỗi ${response.status}`
    );
  }

  return data;
}

export default function Invoice() {
  const [
    brands,
    setBrands,
  ] = useState([]);

  const [
    customers,
    setCustomers,
  ] = useState([]);

  const [
    variants,
    setVariants,
  ] = useState([]);

  const [
    invoiceCode,
    setInvoiceCode,
  ] = useState("");

  const [
    invoicesRefresh,
    setInvoicesRefresh,
  ] = useState(0);

  const [
    editingInvoice,
    setEditingInvoice,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const loadBootstrap =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          const result =
            await api(
              "/bootstrap"
            );

          const payload =
            result?.data ||
            {};

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
            error instanceof
            Error
              ? error.message
              : "Không thể tải dữ liệu hóa đơn"
          );

          setBrands([]);
          setCustomers([]);
          setVariants([]);
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    loadBootstrap();
  }, [
    loadBootstrap,
  ]);

  const refreshCustomers =
    useCallback(
      async () => {
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
            error instanceof
            Error
              ? error.message
              : "Không tải được danh bạ khách hàng"
          );
        }
      },
      []
    );

  const handleBrandSaved =
    useCallback(
      async () => {
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
            error instanceof
            Error
              ? error.message
              : "Không tải được thương hiệu"
          );
        }
      },
      []
    );

  const getNextInvoiceCode =
    useCallback(
      async () => {
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
        } catch (error) {
          console.error(
            "NEXT INVOICE CODE:",
            error
          );
        }
      },
      []
    );

  const handleInvoiceSaved =
    useCallback(
      async () => {
        setEditingInvoice(
          null
        );

        await getNextInvoiceCode();

        setInvoicesRefresh(
          (prev) =>
            prev + 1
        );
      },
      [
        getNextInvoiceCode,
      ]
    );

  const handleInvoiceDeleted =
    useCallback(
      async () => {
        setInvoicesRefresh(
          (prev) =>
            prev + 1
        );
      },
      []
    );

  const handleEditInvoice =
    useCallback(
      (invoice) => {
        if (
          !invoice
        ) {
          return;
        }

        if (
          invoice.warehouse_status ===
          "processed"
        ) {
          alert(
            "Báo giá này đã xuất kho nên không thể sửa."
          );

          return;
        }

        setEditingInvoice(
          invoice
        );

        setTimeout(
          () => {
            document
              .getElementById(
                "invoice-editor"
              )
              ?.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "start",
              });
          },
          50
        );
      },
      []
    );

  const cancelEdit =
    useCallback(
      () => {
        setEditingInvoice(
          null
        );
      },
      []
    );

  return (
    <main className="invoice-page">
      <InvoiceRegistry
        api={
          api
        }
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
        onEditInvoice={
          handleEditInvoice
        }
        onInvoicesChanged={
          handleInvoiceDeleted
        }
        refreshKey={
          invoicesRefresh
        }
      />

      <InvoiceBrandSettings
        api={
          api
        }
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
        /*
         * Đổi key khi chuyển Tạo mới <-> Sửa
         * để reset state sạch, tránh giữ dữ liệu báo giá cũ.
         */
        key={
          editingInvoice?.id
            ? `edit-${editingInvoice.id}`
            : `new-${invoiceCode}`
        }
        api={
          api
        }
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
        editingInvoice={
          editingInvoice
        }
        onCancelEdit={
          cancelEdit
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
