import {
  openSavedInvoice,
} from "./invoiceEditor";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const money = (value) =>
  new Intl.NumberFormat(
    "vi-VN"
  ).format(
    Number(value || 0)
  ) + " đ";

const dateVN = (value) => {
  if (!value) return "";

  return new Date(
    value
  ).toLocaleDateString(
    "vi-VN"
  );
};

export default function InvoiceRegistry({
  api,
  customers = [],
  onCustomersChanged,
  onEditInvoice,
  onInvoicesChanged,
  refreshKey = 0,
}) {
  const [
    invoices,
    setInvoices,
  ] = useState([]);

  const [
    invoiceSearch,
    setInvoiceSearch,
  ] = useState("");

  const [
    customerSearch,
    setCustomerSearch,
  ] = useState("");

  const [editing, setEditing] =
    useState(null);

  const [showCustomerForm, setShowCustomerForm] =
    useState(false);

  const invoiceScrollRef =
    useRef(null);

  const [
    deletingInvoiceId,
    setDeletingInvoiceId,
  ] = useState(null);

  const loadInvoices =
    useCallback(
      async () => {
        try {
          const params =
            new URLSearchParams();

          if (
            invoiceSearch.trim()
          ) {
            params.set(
              "search",
              invoiceSearch.trim()
            );
          }

          const result =
            await api(
              `/invoices?${params.toString()}`
            );

          setInvoices(
            result.data || []
          );
        } catch (error) {
          console.error(
            error
          );
        }
      },
      [
        api,
        invoiceSearch,
      ]
    );

  useEffect(() => {
    const timer =
      setTimeout(
        loadInvoices,
        250
      );

    return () =>
      clearTimeout(timer);
  }, [
    loadInvoices,
    refreshKey,
  ]);
  const safeCustomers =
  Array.isArray(customers)
    ? customers
    : [];
  const filteredCustomers =
    customers.filter(
      (customer) => {
        const keyword =
          customerSearch
            .trim()
            .toLowerCase();

        if (!keyword) {
          return true;
        }

        return [
          customer.customer_name,
          customer.phone,
          customer.tax_code,
          customer.email,
          customer.address,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      }
    );

  const openNewCustomer =
    () => {
      setEditing({
        customer_name: "",
        phone: "",
        address: "",
        shipping_address: "",
        tax_code: "",
        email: "",
      });

      setShowCustomerForm(
        true
      );
    };

  const editCustomer =
    (customer) => {
      setEditing({
        ...customer,
      });

      setShowCustomerForm(
        true
      );
    };

  const saveCustomer =
    async () => {
      if (
        !editing.customer_name
          ?.trim()
      ) {
        alert(
          "Nhập tên khách hàng"
        );
        return;
      }

      try {
        if (editing.id) {
          await api(
            `/customers/${editing.id}`,
            {
              method: "PUT",

              body:
                JSON.stringify(
                  editing
                ),
            }
          );
        } else {
          await api(
            "/customers",
            {
              method: "POST",

              body:
                JSON.stringify(
                  editing
                ),
            }
          );
        }

        setShowCustomerForm(
          false
        );

        await onCustomersChanged?.();
      } catch (error) {
        alert(
          error.message
        );
      }
    };

  const removeCustomer =
    async (customer) => {
      if (
        !window.confirm(
          `Xóa khách hàng "${customer.customer_name}"?`
        )
      ) {
        return;
      }

      try {
        await api(
          `/customers/${customer.id}`,
          {
            method: "DELETE",
          }
        );

        await onCustomersChanged?.();
      } catch (error) {
        alert(
          error.message
        );
      }
    };
    const getInvoiceDetail = async (invoiceId) => {
  const result = await api(
    `/invoices/${invoiceId}`
  );

  if (!result?.data) {
    throw new Error(
      "Không tìm thấy hóa đơn"
    );
  }

  return result.data;
};

const viewInvoice = async (invoice) => {
  try {
    const detail =
      await getInvoiceDetail(
        invoice.id
      );

    openSavedInvoice(
      detail,
      false
    );
  } catch (error) {
    alert(
      error?.message ||
        "Không thể xem hóa đơn"
    );
  }
};

const printInvoice = async (invoice) => {
  try {
    const detail =
      await getInvoiceDetail(
        invoice.id
      );

    openSavedInvoice(
      detail,
      true
    );
  } catch (error) {
    alert(
      error?.message ||
        "Không thể xuất hóa đơn"
    );
  }
};


const editInvoice = async (invoice) => {
  if (
    invoice.warehouse_status ===
    "processed"
  ) {
    alert(
      "Báo giá này đã xuất kho nên không thể sửa."
    );

    return;
  }

  try {
    const detail =
      await getInvoiceDetail(
        invoice.id
      );

    if (
      detail.warehouse_status ===
      "processed"
    ) {
      alert(
        "Báo giá này đã xuất kho nên không thể sửa."
      );

      return;
    }

    onEditInvoice?.(
      detail
    );
  } catch (error) {
    alert(
      error?.message ||
        "Không thể tải báo giá để sửa"
    );
  }
};

const deleteInvoice = async (invoice) => {
  if (
    invoice.warehouse_status ===
    "processed"
  ) {
    alert(
      "Báo giá này đã xuất kho nên không thể xóa. " +
        "Hệ thống cần giữ lại để đối chiếu xuất kho."
    );

    return;
  }

  const confirmed =
    window.confirm(
      `Bạn có chắc muốn xóa báo giá ${invoice.invoice_code}?`
    );

  if (!confirmed) {
    return;
  }

  try {
    setDeletingInvoiceId(
      invoice.id
    );

    await api(
      `/invoices/${invoice.id}`,
      {
        method:
          "DELETE",
      }
    );

    alert(
      "Đã xóa báo giá"
    );

    await loadInvoices();

    await onInvoicesChanged?.();
  } catch (error) {
    alert(
      error?.message ||
        "Không thể xóa báo giá"
    );
  } finally {
    setDeletingInvoiceId(
      null
    );
  }
};

const scrollInvoices =
  (direction) => {
    const el =
      invoiceScrollRef.current;

    if (!el) {
      return;
    }

    el.scrollBy({
      top:
        direction *
        320,

      behavior:
        "smooth",
    });
  };
  return (
    <>
      <section className="invoice-card">
        <div className="invoice-registry-toolbar">
          <input
            className="invoice-search"
            placeholder="Tìm số báo giá, tên khách, SĐT, mã đơn"
            value={invoiceSearch}
            onChange={(e) =>
              setInvoiceSearch(
                e.target.value
              )
            }
          />

          <div className="invoice-scroll-buttons">
            <button
              type="button"
              className="invoice-scroll-btn"
              onClick={() =>
                scrollInvoices(-1)
              }
              title="Trượt lên"
            >
              ▲
            </button>

            <button
              type="button"
              className="invoice-scroll-btn"
              onClick={() =>
                scrollInvoices(1)
              }
              title="Trượt xuống"
            >
              ▼
            </button>
          </div>
        </div>

        <div
          ref={invoiceScrollRef}
          className="invoice-table-wrap invoice-registry-scroll"
        >
          <table className="invoice-table">
            <thead>
              <tr>
                <th>
                  Số hóa đơn
                </th>
                <th>Ngày</th>
                <th>
                  Thương hiệu
                </th>
                <th>
                  Khách hàng
                </th>
                <th>
                  Điện thoại
                </th>
                <th>Kênh</th>
                <th>
                  Tổng tiền
                </th>

                <th>
                  Kho
                </th>

                <th>
                  Thao tác
                </th>
                
              </tr>
            </thead>

            <tbody>
              {invoices.length ===
              0 ? (
                <tr>
                  <td colSpan="9">
                    Chưa có hóa
                    đơn bán hàng.
                  </td>
                </tr>
              ) : (
                invoices.map(
                  (
                    invoice
                  ) => (
                    <tr
                      key={
                        invoice.id
                      }
                    >
                      <td>
                        {
                          invoice.invoice_code
                        }
                      </td>

                      <td>
                        {dateVN(
                          invoice.invoice_date
                        )}
                      </td>

                      <td>
                        {
                          invoice
                            .brand
                            ?.brand_name
                        }
                      </td>

                      <td>
                        {
                          invoice
                            .customer
                            ?.customer_name
                        }
                      </td>

                      <td>
                        {
                          invoice
                            .customer
                            ?.phone
                        }
                      </td>

                      <td>
                        {
                          invoice.channel
                        }
                      </td>

                      <td>
                        {money(
                          invoice.total_amount
                        )}
                      </td>
                      <td>
                        <span
                          className={`invoice-warehouse-badge ${
                            invoice.warehouse_status ===
                            "processed"
                              ? "processed"
                              : "pending"
                          }`}
                        >
                          {invoice.warehouse_status ===
                          "processed"
                            ? "Đã xuất kho"
                            : "Chưa xuất kho"}
                        </span>
                      </td>

                      <td>
                        <div className="invoice-row-actions">
                          <button
                            type="button"
                            className="invoice-btn invoice-view-btn"
                            onClick={() =>
                              viewInvoice(invoice)
                            }
                          >
                            Xem
                          </button>

                          <button
                            type="button"
                            className="invoice-btn invoice-pdf-btn"
                            onClick={() =>
                              printInvoice(invoice)
                            }
                          >
                            PDF / A4
                          </button>

                          <button
                            type="button"
                            className="invoice-btn invoice-edit-quote-btn"
                            disabled={
                              invoice.warehouse_status ===
                              "processed"
                            }
                            onClick={() =>
                              editInvoice(invoice)
                            }
                            title={
                              invoice.warehouse_status ===
                              "processed"
                                ? "Đã xuất kho nên không thể sửa"
                                : "Sửa báo giá"
                            }
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            className="invoice-btn invoice-delete-quote-btn"
                            disabled={
                              invoice.warehouse_status ===
                                "processed" ||
                              Number(
                                deletingInvoiceId
                              ) ===
                                Number(
                                  invoice.id
                                )
                            }
                            onClick={() =>
                              deleteInvoice(invoice)
                            }
                            title={
                              invoice.warehouse_status ===
                              "processed"
                                ? "Đã xuất kho nên không thể xóa"
                                : "Xóa báo giá"
                            }
                          >
                            {Number(
                              deletingInvoiceId
                            ) ===
                            Number(
                              invoice.id
                            )
                              ? "Đang xóa..."
                              : "Xóa"}
                          </button>
                        </div>
                      </td>
                      
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="invoice-card">
        <div className="invoice-section-heading">
          <div>
            <h2>
              Danh bạ khách hàng
            </h2>

            <p>
              Lưu khách hàng để
              chọn nhanh khi tạo
              hóa đơn lần sau.
            </p>
          </div>

          <button
            className="invoice-btn primary"
            onClick={
              openNewCustomer
            }
          >
            + Thêm khách hàng
          </button>
        </div>

        <input
          className="invoice-search"
          placeholder="Tìm theo tên, số điện thoại, MST hoặc email"
          value={customerSearch}
          onChange={(e) =>
            setCustomerSearch(
              e.target.value
            )
          }
        />

        <div className="invoice-table-wrap">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>
                  Khách hàng
                </th>
                <th>
                  Điện thoại
                </th>
                <th>
                  Địa chỉ
                </th>
                <th>MST</th>
                <th>Email</th>
                <th>
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map(
                (
                  customer
                ) => (
                  <tr
                    key={
                      customer.id
                    }
                  >
                    <td>
                      <strong>
                        {
                          customer.customer_name
                        }
                      </strong>
                    </td>

                    <td>
                      {
                        customer.phone
                      }
                    </td>

                    <td>
                      {
                        customer.address
                      }
                    </td>

                    <td>
                      {
                        customer.tax_code
                      }
                    </td>

                    <td>
                      {
                        customer.email
                      }
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          className="invoice-btn secondary"
                          onClick={() =>
                            editCustomer(
                              customer
                            )
                          }
                        >
                          Sửa
                        </button>

                        <button
                          className="invoice-btn danger"
                          onClick={() =>
                            removeCustomer(
                              customer
                            )
                          }
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showCustomerForm && (
        <div className="invoice-modal-backdrop">
          <div className="invoice-modal">
            <h2>
              {editing.id
                ? "Sửa khách hàng"
                : "Thêm khách hàng"}
            </h2>

            <label>
              Khách hàng
            </label>

            <input
              value={
                editing.customer_name ||
                ""
              }
              onChange={(e) =>
                setEditing(
                  (x) => ({
                    ...x,

                    customer_name:
                      e.target
                        .value,
                  })
                )
              }
            />

            <label>
              Điện thoại
            </label>

            <input
              value={
                editing.phone ||
                ""
              }
              onChange={(e) =>
                setEditing(
                  (x) => ({
                    ...x,

                    phone:
                      e.target
                        .value,
                  })
                )
              }
            />

            <label>
              Địa chỉ
            </label>

            <input
              value={
                editing.address ||
                ""
              }
              onChange={(e) =>
                setEditing(
                  (x) => ({
                    ...x,

                    address:
                      e.target
                        .value,
                  })
                )
              }
            />

            <label>
              Địa chỉ nhận hàng
            </label>

            <input
              value={
                editing.shipping_address ||
                ""
              }
              onChange={(e) =>
                setEditing(
                  (x) => ({
                    ...x,

                    shipping_address:
                      e.target
                        .value,
                  })
                )
              }
            />

            <label>MST</label>

            <input
              value={
                editing.tax_code ||
                ""
              }
              onChange={(e) =>
                setEditing(
                  (x) => ({
                    ...x,

                    tax_code:
                      e.target
                        .value,
                  })
                )
              }
            />

            <label>Email</label>

            <input
              value={
                editing.email ||
                ""
              }
              onChange={(e) =>
                setEditing(
                  (x) => ({
                    ...x,

                    email:
                      e.target
                        .value,
                  })
                )
              }
            />

            <div className="modal-actions">
              <button
                className="invoice-btn primary"
                onClick={
                  saveCustomer
                }
              >
                Lưu
              </button>

              <button
                className="invoice-btn secondary"
                onClick={() =>
                  setShowCustomerForm(
                    false
                  )
                }
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}