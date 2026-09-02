import {
  useEffect,
  useMemo,
  useState,
} from "react";

const today = () => {
  const now =
    new Date();

  const offset =
    now.getTimezoneOffset();

  return new Date(
    now.getTime() -
      offset * 60000
  )
    .toISOString()
    .slice(0, 10);
};

const money = (value) =>
  new Intl.NumberFormat(
    "vi-VN"
  ).format(
    Number(value || 0)
  ) + " đ";

const emptyItem = () => ({
  variant_id: "",
  quantity: 0,
  unit_price: 0,
});


/* =========================================================
   HÓA ĐƠN ĐÃ LƯU - DÙNG CHUNG CHO INVOICE REGISTRY
========================================================= */

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const savedDateVN = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
};

export function buildSavedInvoiceHtml(invoice, autoPrint = false) {
  const brand = invoice?.brand || {};
  const customer = invoice?.customer || {};
  const invoiceItems = Array.isArray(invoice?.items) ? invoice.items : [];

  const subtotal = Number(invoice?.subtotal || 0);
  const shippingFee = Number(invoice?.shipping_fee || 0);
  const totalAmount = Number(invoice?.total_amount || 0);
  const depositAmount = Number(
    invoice?.deposit_amount || invoice?.paid_amount || 0
  );
  const remaining = Math.max(0, totalAmount - depositAmount);

  const rows = invoiceItems
    .map((item, index) => {
      const variant = item?.variant || {};
      const product = variant?.product || {};
      const productName = [product.product_name, variant.size]
        .filter(Boolean)
        .join(" - ");

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(productName)}</td>
          <td>CÁI</td>
          <td>${Number(item.quantity || 0)}</td>
          <td>${money(item.unit_price)}</td>
          <td>${money(item.total_price)}</td>
        </tr>
      `;
    })
    .join("");

  const minimumRows = 5;
  const emptyRows = Array.from({
    length: Math.max(0, minimumRows - invoiceItems.length),
  })
    .map(
      (_, index) => `
        <tr>
          <td>${invoiceItems.length + index + 1}</td>
          <td>&nbsp;</td>
          <td>CÁI</td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      `
    )
    .join("");

  const printScript = autoPrint
    ? `
      <script>
        window.onload = function () {
          setTimeout(function () {
            window.print();
          }, 300);
        };
      <\/script>
    `
    : "";

  return `
<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8">

<title>${escapeHtml(invoice?.invoice_code || "Hóa đơn")}</title>

<style>
@page {
  size: A4;
  margin: 12mm;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: "Segoe UI", Arial, Helvetica, sans-serif;
  color: #111;
  font-size: 11px;
  background: #fff;
}

.invoice-a4 {
  width: 100%;
  max-width: 190mm;
  margin: 0 auto;
}

.preview-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 15px;
}

.preview-toolbar button {
  border: 0;
  border-radius: 8px;
  padding: 9px 14px;
  font-family: "Segoe UI", Arial, sans-serif;
  font-weight: 700;
  cursor: pointer;
}

.preview-toolbar .print {
  background: #873e17;
  color: #fff;
}

.preview-toolbar .close {
  background: #ead7c5;
  color: #602800;
}

.header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 2px solid #333;
  padding-bottom: 10px;
}

.brand {
  display: flex;
  gap: 12px;
}

.logo {
  width: 50px;
  height: 50px;
  flex: 0 0 50px;
  border: 2px solid #444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 17px;
}

.brand h2 {
  margin: 3px 0 5px;
  font-size: 18px;
}

.brand-info,
.document-info {
  line-height: 1.5;
}

.document-info {
  text-align: right;
}

.title {
  text-align: center;
  margin: 16px 0;
}

.title h1 {
  font-size: 20px;
  margin: 0;
}

.invoice-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  border: 1px solid #aaa;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 10px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.box {
  border: 1px solid #aaa;
  border-radius: 6px;
  padding: 10px;
}

.box-title {
  font-weight: 800;
  margin-bottom: 7px;
}

.line {
  margin: 5px 0;
}

.shipping-address {
  margin-top: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

th,
td {
  border: 1px solid #777;
  padding: 6px;
}

th {
  background: #f3f3f3;
  text-align: center;
}

td:nth-child(1),
td:nth-child(3),
td:nth-child(4) {
  text-align: center;
}

td:nth-child(5),
td:nth-child(6) {
  text-align: right;
}

.total {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin: 5px 0;
}

.total-final {
  margin-top: 7px;
  padding-top: 7px;
  border-top: 1px solid #555;
  font-weight: 800;
  font-size: 12px;
}

.bank {
  border-left: 4px solid #333;
  padding: 8px;
  margin-top: 10px;
}

.note {
  border: 1px solid #aaa;
  border-radius: 6px;
  padding: 8px;
  margin-top: 10px;
}

.signature {
  display: grid;
  grid-template-columns: 1fr 1fr;
  text-align: center;
  margin-top: 18px;
  min-height: 90px;
}

.signature-name {
  margin-top: 45px;
}

.footer {
  text-align: center;
  border-top: 1px solid #aaa;
  padding-top: 8px;
  margin-top: 10px;
  font-size: 9px;
}

@media print {
  .preview-toolbar {
    display: none;
  }
}
</style>
</head>

<body>

<div class="preview-toolbar">
  <button class="print" onclick="window.print()">
    Xuất PDF / In A4
  </button>

  <button class="close" onclick="window.close()">
    Đóng
  </button>
</div>

<div class="invoice-a4">

<div class="header">

  <div class="brand">
    <div class="logo">
      ${escapeHtml(brand.logo_text || "NX")}
    </div>

    <div>
      <h2>${escapeHtml(brand.brand_name || "")}</h2>

      <div class="brand-info">
        ${escapeHtml(brand.address || "")}
        <br>
        Điện thoại/Zalo: ${escapeHtml(brand.phone || "")}
        · MST: ${escapeHtml(brand.tax_code || "")}
      </div>
    </div>
  </div>

  <div class="document-info">
    <b>${escapeHtml(invoice?.invoice_code || "")}</b>
    <br>
    Ngày phát hành:
    ${escapeHtml(savedDateVN(invoice?.invoice_date))}
  </div>

</div>

<div class="title">
  <h1>HÓA ĐƠN BÁN HÀNG</h1>
  <div>Phiếu xác nhận giá trị đơn hàng gửi khách</div>
</div>

<div class="invoice-info">
  <div>
    <b>Số hóa đơn:</b>
    ${escapeHtml(invoice?.invoice_code || "")}
  </div>

  <div>
    <b>Ngày lập:</b>
    ${escapeHtml(savedDateVN(invoice?.invoice_date))}
  </div>
</div>

<div class="grid">

<div class="box">
  <div class="box-title">BÊN BÁN</div>

  <div class="line">
    <b>Đơn vị:</b>
    ${escapeHtml(brand.brand_name || "")}
  </div>

  <div class="line">
    <b>Địa chỉ:</b>
    ${escapeHtml(brand.address || "")}
  </div>

  <div class="line">
    <b>Điện thoại:</b>
    ${escapeHtml(brand.phone || "")}
  </div>

  <div class="line">
    <b>MST:</b>
    ${escapeHtml(brand.tax_code || "")}
  </div>

  <div class="line">
    <b>Email:</b>
    ${escapeHtml(brand.email || "")}
  </div>

  <div class="line">
    <b>Kênh:</b>
    ${escapeHtml(invoice?.channel || "")}
  </div>
</div>

<div class="box">
  <div class="box-title">BÊN MUA</div>

  <div class="line">
    <b>Khách hàng:</b>
    ${escapeHtml(customer.customer_name || "")}
  </div>

  <div class="line">
    <b>Địa chỉ:</b>
    ${escapeHtml(customer.address || "")}
  </div>

  <div class="line">
    <b>Điện thoại:</b>
    ${escapeHtml(customer.phone || "")}
  </div>

  <div class="line">
    <b>MST:</b>
    ${escapeHtml(customer.tax_code || "")}
  </div>

  <div class="line">
    <b>Email:</b>
    ${escapeHtml(customer.email || "")}
  </div>

  <div class="line">
    <b>Mã đơn:</b>
    ${escapeHtml(invoice?.order_code || "")}
  </div>
</div>

</div>

<div class="box shipping-address">
  <b>Địa chỉ nhận hàng:</b>
  ${escapeHtml(
    invoice?.shipping_address ||
      customer.shipping_address ||
      customer.address ||
      ""
  )}
</div>

<table>
<thead>
<tr>
  <th>STT</th>
  <th>Tên sản phẩm</th>
  <th>ĐVT</th>
  <th>SL</th>
  <th>Đơn giá</th>
  <th>Thành tiền</th>
</tr>
</thead>

<tbody>
${rows}
${emptyRows}
</tbody>
</table>

<div class="total">

<div class="box">
  <div class="box-title">THANH TOÁN</div>

  <div class="total-row">
    <span>Hình thức:</span>
    <b>${escapeHtml(invoice?.payment_method || "")}</b>
  </div>

  <div class="total-row">
    <span>Đã cọc:</span>
    <b>${money(depositAmount)}</b>
  </div>

  <div class="total-row">
    <span>Còn lại:</span>
    <b>${money(remaining)}</b>
  </div>
</div>

<div class="box">
  <div class="box-title">TỔNG GIÁ TRỊ</div>

  <div class="total-row">
    <span>Cộng tiền hàng:</span>
    <b>${money(subtotal)}</b>
  </div>

  <div class="total-row">
    <span>Phí vận chuyển:</span>
    <b>${money(shippingFee)}</b>
  </div>

  <div class="total-row total-final">
    <span>TỔNG THANH TOÁN:</span>
    <b>${money(totalAmount)}</b>
  </div>
</div>

</div>

<div class="bank">
  <b>THÔNG TIN CHUYỂN KHOẢN</b>
  <br>
  ${escapeHtml(brand.bank_name || "")}
  · STK:
  <b>${escapeHtml(brand.bank_account || "")}</b>
  · Chủ TK:
  <b>${escapeHtml(brand.bank_holder || "")}</b>
</div>

<div class="note">
  <b>GHI CHÚ:</b>
  ${escapeHtml(invoice?.note || "")}
</div>

<div class="signature">
  <div>
    <b>NGƯỜI MUA/NGƯỜI NHẬN</b>
    <br>
    <small>(Ký, ghi rõ họ tên)</small>
  </div>

  <div>
    <b>NGƯỜI BÁN</b>
    <br>
    <small>(Ký, ghi rõ họ tên)</small>

    <div class="signature-name">
      ${escapeHtml(brand.bank_holder || "")}
    </div>
  </div>
</div>

<div class="footer">
  ${escapeHtml(brand.brand_name || "")}
  ·
  ${escapeHtml(brand.address || "")}
  ·
  ${escapeHtml(brand.phone || "")}
</div>

</div>

${printScript}

</body>
</html>
`;
}

export function openSavedInvoice(
  invoice,
  autoPrint = false
) {
  if (!invoice) {
    alert("Không có dữ liệu hóa đơn");
    return;
  }

  const win = window.open(
    "",
    "_blank",
    "width=1000,height=900"
  );

  if (!win) {
    alert(
      "Trình duyệt đang chặn cửa sổ. Vui lòng cho phép popup."
    );
    return;
  }

  const html =
    buildSavedInvoiceHtml(
      invoice,
      autoPrint
    );

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}

/* =========================================================
   COMPONENT TẠO HÓA ĐƠN
========================================================= */

export default function InvoiceEditor({
  api,
  brands,
  customers,
  variants,
  invoiceCode,
  onCustomerSaved,
  onInvoiceSaved,
}) {
  const defaultBrand =
    brands.find(
      (b) =>
        b.is_default
    ) || brands[0];

  const [form, setForm] =
    useState({
      brand_id: "",

      invoice_code: "",

      invoice_date:
        today(),

      channel: "",

      order_code: "",

      customer_id: "",

      customer_name: "",
      phone: "",
      address: "",
      shipping_address: "",
      tax_code: "",
      email: "",

      payment_method:
        "COD",

      deposit_amount: 0,

      shipping_fee: 0,

      note:
        "HÀNG DỄ VỠ NÊN QUÝ KHÁCH HÀNG VUI LÒNG ĐỒNG KIỂM VỚI SHIPPER VÀ QUAY VIDEO LẠI ĐỂ ĐƯỢC BẢO VỆ QUYỀN LỢI BAO BỂ VỠ.",
    });

  const [items, setItems] =
    useState([
      emptyItem(),
    ]);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    setForm(
      (x) => ({
        ...x,

        invoice_code:
          invoiceCode ||
          x.invoice_code,
      })
    );
  }, [invoiceCode]);

  useEffect(() => {
    if (
      !form.brand_id &&
      defaultBrand
    ) {
      setForm(
        (x) => ({
          ...x,

          brand_id:
            String(
              defaultBrand.id
            ),
        })
      );
    }
  }, [
    defaultBrand,
    form.brand_id,
  ]);

  /*
   * Brand được chọn.
   *
   * Đây chính là object
   * dùng khi xuất A4.
   */
  const selectedBrand =
    useMemo(
      () =>
        brands.find(
          (brand) =>
            String(
              brand.id
            ) ===
            String(
              form.brand_id
            )
        ) || null,

      [
        brands,
        form.brand_id,
      ]
    );

  const chooseCustomer =
    (id) => {
      const customer =
        customers.find(
          (x) =>
            String(x.id) ===
            String(id)
        );

      if (!customer) {
        setForm(
          (old) => ({
            ...old,

            customer_id: "",
          })
        );

        return;
      }

      /*
       * CHỌN KHÁCH
       * => THÔNG TIN TỰ NHẢY.
       */
      setForm(
        (old) => ({
          ...old,

          customer_id:
            String(
              customer.id
            ),

          customer_name:
            customer.customer_name ||
            "",

          phone:
            customer.phone ||
            "",

          address:
            customer.address ||
            "",

          shipping_address:
            customer.shipping_address ||
            "",

          tax_code:
            customer.tax_code ||
            "",

          email:
            customer.email ||
            "",
        })
      );
    };

  const updateItem =
    (
      index,
      field,
      value
    ) => {
      setItems(
        (old) => {
          const next =
            [...old];

          next[index] = {
            ...next[index],

            [field]:
              value,
          };

          /*
           * Chọn sản phẩm
           * => tự nhảy giá bán.
           */
          if (
            field ===
            "variant_id"
          ) {
            const variant =
              variants.find(
                (x) =>
                  String(
                    x.id
                  ) ===
                  String(
                    value
                  )
              );

            next[index] = {
              ...next[index],

              variant_id:
                value,

              unit_price:
                Number(
                  variant
                    ?.selling_price ||
                    0
                ),
            };
          }

          return next;
        }
      );
    };

  const subtotal =
    useMemo(
      () =>
        items.reduce(
          (
            sum,
            item
          ) =>
            sum +
            Number(
              item.quantity ||
                0
            ) *
              Number(
                item.unit_price ||
                  0
              ),

          0
        ),

      [items]
    );

  const total =
    subtotal +
    Number(
      form.shipping_fee ||
        0
    );

  const remaining =
    Math.max(
      0,

      total -
        Number(
          form.deposit_amount ||
            0
        )
    );

  const saveCustomer =
    async () => {
      if (
        !form.customer_name.trim()
      ) {
        alert(
          "Nhập tên khách hàng"
        );
        return;
      }

      try {
        const result =
          await api(
            "/customers",
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  customer_name:
                    form.customer_name,

                  phone:
                    form.phone,

                  address:
                    form.address,

                  shipping_address:
                    form.shipping_address,

                  tax_code:
                    form.tax_code,

                  email:
                    form.email,
                }),
            }
          );

        setForm(
          (x) => ({
            ...x,

            customer_id:
              String(
                result.data.id
              ),
          })
        );

        await onCustomerSaved?.();

        alert(
          "Đã lưu khách vào danh bạ"
        );
      } catch (error) {
        alert(
          error.message
        );
      }
    };

  const saveInvoice =
    async () => {
      const validItems =
        items.filter(
          (item) =>
            item.variant_id &&
            Number(
              item.quantity
            ) > 0
        );

      if (
        !form.brand_id
      ) {
        alert(
          "Vui lòng chọn thương hiệu"
        );
        return null;
      }

      if (
        validItems.length ===
        0
      ) {
        alert(
          "Vui lòng chọn ít nhất 1 sản phẩm"
        );
        return null;
      }

      try {
        setSaving(true);

        const result =
          await api(
            "/invoices",
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  invoice_code:
                    form.invoice_code,

                  invoice_date:
                    form.invoice_date,

                  brand_id:
                    Number(
                      form.brand_id
                    ),

                  customer_id:
                    form.customer_id
                      ? Number(
                          form.customer_id
                        )
                      : null,

                  channel:
                    form.channel,

                  order_code:
                    form.order_code,

                  shipping_address:
                    form.shipping_address,

                  payment_method:
                    form.payment_method,

                  deposit_amount:
                    Number(
                      form.deposit_amount ||
                        0
                    ),

                  shipping_fee:
                    Number(
                      form.shipping_fee ||
                        0
                    ),

                  note:
                    form.note,

                  items:
                    validItems.map(
                      (
                        item
                      ) => ({
                        variant_id:
                          Number(
                            item.variant_id
                          ),

                        quantity:
                          Number(
                            item.quantity
                          ),

                        unit_price:
                          Number(
                            item.unit_price
                          ),
                      })
                    ),
                }),
            }
          );

        await onInvoiceSaved?.();

        alert(
          "Đã lưu hóa đơn"
        );

        return result.data;
      } catch (error) {
        alert(
          error.message
        );

        return null;
      } finally {
        setSaving(false);
      }
    };

  const printA4 =
    () => {
      if (!selectedBrand) {
        alert(
          "Chưa chọn thương hiệu"
        );
        return;
      }

      const html =
        buildInvoiceHtml();

      const win =
        window.open(
          "",
          "_blank",
          "width=1000,height=900"
        );

      if (!win) {
        alert(
          "Trình duyệt đang chặn cửa sổ in"
        );
        return;
      }

      win.document.write(
        html
      );

      win.document.close();

      win.focus();

      setTimeout(
        () =>
          win.print(),
        300
      );
    };

  const buildInvoiceHtml =
    () => {
      const rows =
        items
          .filter(
            (item) =>
              item.variant_id
          )
          .map(
            (
              item,
              index
            ) => {
              const variant =
                variants.find(
                  (x) =>
                    String(
                      x.id
                    ) ===
                    String(
                      item.variant_id
                    )
                );

              return `
              <tr>
                <td>${index + 1}</td>
                <td>${variant?.display_name || ""}</td>
                <td>CÁI</td>
                <td>${item.quantity}</td>
                <td>${money(item.unit_price)}</td>
                <td>${money(
                  Number(item.quantity) *
                    Number(item.unit_price)
                )}</td>
              </tr>
            `;
            }
          )
          .join("");

      return `
<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<title>${form.invoice_code}</title>

<style>
@page {
  size: A4;
  margin: 12mm;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  color: #111;
  font-size: 11px;
}

.invoice-a4 {
  width: 100%;
}

.header {
  display:flex;
  justify-content:space-between;
  gap:20px;
  border-bottom:2px solid #333;
  padding-bottom:10px;
}

.brand {
  display:flex;
  gap:12px;
}

.logo {
  width:50px;
  height:50px;
  border:2px solid #444;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:800;
  font-size:17px;
}

.brand h2 {
  margin:3px 0 5px;
  font-size:18px;
}

.title {
  text-align:center;
  margin:16px 0;
}

.title h1 {
  font-size:20px;
  margin:0;
}

.grid {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
}

.box {
  border:1px solid #aaa;
  border-radius:6px;
  padding:10px;
}

.line {
  margin:5px 0;
}

table {
  width:100%;
  border-collapse:collapse;
  margin-top:10px;
}

th,
td {
  border:1px solid #777;
  padding:6px;
}

th {
  background:#f3f3f3;
}

.total {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px;
  margin-top:12px;
}

.bank {
  border-left:4px solid #333;
  padding:8px;
  margin-top:10px;
}

.note {
  border:1px solid #aaa;
  border-radius:6px;
  padding:8px;
  margin-top:10px;
}

.signature {
  display:grid;
  grid-template-columns:1fr 1fr;
  text-align:center;
  margin-top:18px;
  min-height:90px;
}

.footer {
  text-align:center;
  border-top:1px solid #aaa;
  padding-top:8px;
  margin-top:10px;
  font-size:9px;
}
</style>
</head>

<body>

<div class="invoice-a4">

<div class="header">

  <div class="brand">

    <div class="logo">
      ${selectedBrand.logo_text || "NX"}
    </div>

    <div>
      <h2>
        ${selectedBrand.brand_name || ""}
      </h2>

      <div>
        ${selectedBrand.address || ""}
      </div>

      <div>
        Điện thoại/Zalo:
        ${selectedBrand.phone || ""}
        · MST:
        ${selectedBrand.tax_code || ""}
      </div>
    </div>

  </div>

  <div style="text-align:right">
    <b>${form.invoice_code}</b><br>
    Ngày phát hành:
    ${form.invoice_date}
  </div>

</div>


<div class="title">
  <h1>HÓA ĐƠN BÁN HÀNG</h1>
  <div>
    Phiếu xác nhận giá trị đơn hàng gửi khách
  </div>
</div>


<div class="grid">

  <div class="box">
    <b>BÊN BÁN</b>

    <div class="line">
      <b>Đơn vị:</b>
      ${selectedBrand.brand_name || ""}
    </div>

    <div class="line">
      <b>Địa chỉ:</b>
      ${selectedBrand.address || ""}
    </div>

    <div class="line">
      <b>Điện thoại:</b>
      ${selectedBrand.phone || ""}
    </div>

    <div class="line">
      <b>MST:</b>
      ${selectedBrand.tax_code || ""}
    </div>

    <div class="line">
      <b>Email:</b>
      ${selectedBrand.email || ""}
    </div>

    <div class="line">
      <b>Kênh:</b>
      ${form.channel || ""}
    </div>
  </div>


  <div class="box">
    <b>BÊN MUA</b>

    <div class="line">
      <b>Khách hàng:</b>
      ${form.customer_name || ""}
    </div>

    <div class="line">
      <b>Địa chỉ:</b>
      ${form.address || ""}
    </div>

    <div class="line">
      <b>Điện thoại:</b>
      ${form.phone || ""}
    </div>

    <div class="line">
      <b>MST:</b>
      ${form.tax_code || ""}
    </div>

    <div class="line">
      <b>Email:</b>
      ${form.email || ""}
    </div>

    <div class="line">
      <b>Mã đơn:</b>
      ${form.order_code || ""}
    </div>
  </div>

</div>


<div class="box" style="margin-top:10px">
  <b>Địa chỉ nhận hàng:</b>
  ${form.shipping_address || form.address || ""}
</div>


<table>
<thead>
<tr>
  <th>STT</th>
  <th>Tên sản phẩm</th>
  <th>ĐVT</th>
  <th>SL</th>
  <th>Đơn giá</th>
  <th>Thành tiền</th>
</tr>
</thead>

<tbody>
${rows}
</tbody>
</table>


<div class="total">

  <div class="box">
    <b>THANH TOÁN</b>

    <div class="line">
      <b>Hình thức:</b>
      ${form.payment_method || ""}
    </div>

    <div class="line">
      <b>Đã cọc:</b>
      ${money(form.deposit_amount)}
    </div>

    <div class="line">
      <b>Còn lại:</b>
      ${money(remaining)}
    </div>
  </div>


  <div class="box">
    <b>TỔNG GIÁ TRỊ</b>

    <div class="line">
      Cộng tiền hàng:
      <b>${money(subtotal)}</b>
    </div>

    <div class="line">
      Phí vận chuyển:
      <b>${money(form.shipping_fee)}</b>
    </div>

    <hr>

    <div class="line">
      <b>TỔNG THANH TOÁN:</b>
      <b style="float:right">
        ${money(total)}
      </b>
    </div>
  </div>

</div>


<div class="bank">
  <b>THÔNG TIN CHUYỂN KHOẢN</b><br>

  ${selectedBrand.bank_name || ""}
  · STK:
  ${selectedBrand.bank_account || ""}
  · Chủ TK:
  <b>
    ${selectedBrand.bank_holder || ""}
  </b>
</div>


<div class="note">
  <b>GHI CHÚ:</b>
  ${form.note || ""}
</div>


<div class="signature">
  <div>
    <b>NGƯỜI MUA/NGƯỜI NHẬN</b><br>
    <small>(Ký, ghi rõ họ tên)</small>
  </div>

  <div>
    <b>NGƯỜI BÁN</b><br>
    <small>(Ký, ghi rõ họ tên)</small>

    <div style="margin-top:45px">
      ${selectedBrand.bank_holder || ""}
    </div>
  </div>
</div>


<div class="footer">
  ${selectedBrand.brand_name || ""}
  ·
  ${selectedBrand.address || ""}
  ·
  ${selectedBrand.phone || ""}
</div>

</div>

</body>
</html>
`;
    };

  return (
    <section className="invoice-card invoice-editor">
      <div className="invoice-section-heading">
        <div>
          <h2>
            Tạo hóa đơn bán hàng
          </h2>

          <p>
            Chỉ phục vụ báo
            giá/xác nhận đơn với
            khách, không hạch
            toán doanh thu và
            không tự trừ kho.
          </p>
        </div>

        <div className="action-buttons">
          <button
            className="invoice-btn primary"
            onClick={
              saveInvoice
            }
            disabled={saving}
          >
            {saving
              ? "Đang lưu..."
              : "Lưu hóa đơn"}
          </button>

          <button
            className="invoice-btn secondary"
            onClick={printA4}
          >
            Xuất PDF / In A4
          </button>
        </div>
      </div>


      <div className="invoice-form-grid">

        <div className="invoice-subcard">
          <h3>
            Thông tin hóa đơn
          </h3>

          <label>
            Thương hiệu phát
            hành hóa đơn
          </label>

          <select
            value={
              form.brand_id
            }
            onChange={(e) =>
              setForm(
                (x) => ({
                  ...x,

                  brand_id:
                    e.target
                      .value,
                })
              )
            }
          >
            {brands.map(
              (brand) => (
                <option
                  key={
                    brand.id
                  }
                  value={
                    brand.id
                  }
                >
                  {
                    brand.brand_name
                  }
                </option>
              )
            )}
          </select>

          {selectedBrand && (
            <div className="selected-brand-preview">
              <strong>
                {
                  selectedBrand.brand_name
                }
              </strong>

              <span>
                MST:{" "}
                {selectedBrand.tax_code ||
                  "—"}
              </span>

              <span>
                {
                  selectedBrand.address
                }
              </span>

              <span>
                {
                  selectedBrand.bank_name
                }{" "}
                -{" "}
                {
                  selectedBrand.bank_account
                }
              </span>
            </div>
          )}

          <div className="two-column">
            <div>
              <label>
                Số hóa đơn
              </label>

              <input
                value={
                  form.invoice_code
                }
                onChange={(e) =>
                  setForm(
                    (x) => ({
                      ...x,

                      invoice_code:
                        e.target
                          .value,
                    })
                  )
                }
              />
            </div>

            <div>
              <label>
                Ngày lập /
                phát hành
              </label>

              <input
                type="date"
                value={
                  form.invoice_date
                }
                onChange={(e) =>
                  setForm(
                    (x) => ({
                      ...x,

                      invoice_date:
                        e.target
                          .value,
                    })
                  )
                }
              />
            </div>
          </div>

          <div className="two-column">
            <div>
              <label>
                Kênh bán
              </label>

              <input
                value={
                  form.channel
                }
                placeholder="Zalo, Facebook, Shopee..."
                onChange={(e) =>
                  setForm(
                    (x) => ({
                      ...x,

                      channel:
                        e.target
                          .value,
                    })
                  )
                }
              />
            </div>

            <div>
              <label>
                Mã đơn
              </label>

              <input
                value={
                  form.order_code
                }
                placeholder="Nếu có"
                onChange={(e) =>
                  setForm(
                    (x) => ({
                      ...x,

                      order_code:
                        e.target
                          .value,
                    })
                  )
                }
              />
            </div>
          </div>
        </div>


        <div className="invoice-subcard">
          <div className="invoice-section-heading compact">
            <h3>
              Thông tin khách
              hàng
            </h3>

            <button
              className="invoice-btn secondary"
              onClick={
                saveCustomer
              }
            >
              Lưu vào danh bạ
            </button>
          </div>

          <label>
            Chọn khách hàng đã
            lưu
          </label>

          <select
            value={
              form.customer_id
            }
            onChange={(e) =>
              chooseCustomer(
                e.target.value
              )
            }
          >
            <option value="">
              -- Chọn khách hàng
              --
            </option>

            {customers.map(
              (customer) => (
                <option
                  key={
                    customer.id
                  }
                  value={
                    customer.id
                  }
                >
                  {
                    customer.customer_name
                  }
                  {customer.phone
                    ? ` · ${customer.phone}`
                    : ""}
                </option>
              )
            )}
          </select>

          <div className="two-column">
            <div>
              <label>
                Khách hàng
              </label>

              <input
                value={
                  form.customer_name
                }
                onChange={(e) =>
                  setForm(
                    (x) => ({
                      ...x,

                      customer_name:
                        e.target
                          .value,
                    })
                  )
                }
              />
            </div>

            <div>
              <label>
                Số điện thoại
              </label>

              <input
                value={
                  form.phone
                }
                onChange={(e) =>
                  setForm(
                    (x) => ({
                      ...x,

                      phone:
                        e.target
                          .value,
                    })
                  )
                }
              />
            </div>
          </div>

          <label>
            Địa chỉ
          </label>

          <input
            value={
              form.address
            }
            onChange={(e) =>
              setForm(
                (x) => ({
                  ...x,

                  address:
                    e.target
                      .value,
                })
              )
            }
          />

          <div className="two-column">
            <div>
              <label>MST</label>

              <input
                value={
                  form.tax_code
                }
                onChange={(e) =>
                  setForm(
                    (x) => ({
                      ...x,

                      tax_code:
                        e.target
                          .value,
                    })
                  )
                }
              />
            </div>

            <div>
              <label>Email</label>

              <input
                value={
                  form.email
                }
                onChange={(e) =>
                  setForm(
                    (x) => ({
                      ...x,

                      email:
                        e.target
                          .value,
                    })
                  )
                }
              />
            </div>
          </div>

          <label>
            Địa chỉ nhận hàng
            (nếu khác)
          </label>

          <input
            value={
              form.shipping_address
            }
            onChange={(e) =>
              setForm(
                (x) => ({
                  ...x,

                  shipping_address:
                    e.target
                      .value,
                })
              )
            }
          />
        </div>

      </div>


      <div className="invoice-subcard product-area">
        <div className="invoice-section-heading compact">
          <div>
            <h3>Sản phẩm</h3>

            <p>
              Chỉ kiểm tra tồn
              hiện tại, không giữ
              hàng và không trừ
              kho.
            </p>
          </div>

          <button
            className="invoice-btn secondary"
            onClick={() =>
              setItems(
                (x) => [
                  ...x,
                  emptyItem(),
                ]
              )
            }
          >
            + Thêm sản phẩm
          </button>
        </div>

        <div className="invoice-table-wrap">
          <table className="invoice-table product-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>
                  Sản phẩm /
                  biến thể
                </th>
                <th>ĐVT</th>
                <th>Tồn</th>
                <th>SL</th>
                <th>
                  Đơn giá
                </th>
                <th>
                  Thành tiền
                </th>
                <th>
                  Tình trạng
                </th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {items.map(
                (
                  item,
                  index
                ) => {
                  const variant =
                    variants.find(
                      (x) =>
                        String(
                          x.id
                        ) ===
                        String(
                          item.variant_id
                        )
                    );

                  const quantity =
                    Number(
                      item.quantity ||
                        0
                    );

                  const invalid =
                    variant &&
                    quantity >
                      variant.current_quantity;

                  return (
                    <tr
                      key={
                        index
                      }
                    >
                      <td>
                        {index +
                          1}
                      </td>

                      <td>
                        <select
                          value={
                            item.variant_id
                          }
                          onChange={(e) =>
                            updateItem(
                              index,
                              "variant_id",
                              e.target
                                .value
                            )
                          }
                        >
                          <option value="">
                            -- Chọn
                            sản phẩm
                            --
                          </option>

                          {variants.map(
                            (
                              variantOption
                            ) => (
                              <option
                                key={
                                  variantOption.id
                                }
                                value={
                                  variantOption.id
                                }
                              >
                                {
                                  variantOption.display_name
                                }
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td>
                        CÁI
                      </td>

                      <td>
                        {variant
                          ? variant.current_quantity
                          : "—"}
                      </td>

                      <td>
                        <input
                          type="number"
                          min="0"
                          value={
                            item.quantity
                          }
                          onChange={(e) =>
                            updateItem(
                              index,
                              "quantity",
                              e.target
                                .value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          min="0"
                          value={
                            item.unit_price
                          }
                          onChange={(e) =>
                            updateItem(
                              index,
                              "unit_price",
                              e.target
                                .value
                            )
                          }
                        />
                      </td>

                      <td>
                        {money(
                          quantity *
                            Number(
                              item.unit_price ||
                                0
                            )
                        )}
                      </td>

                      <td>
                        {!variant
                          ? "Chưa chọn"
                          : invalid
                            ? "Vượt tồn"
                            : "Đủ hàng"}
                      </td>

                      <td>
                        <button
                          className="invoice-btn danger small"
                          onClick={() =>
                            setItems(
                              (old) =>
                                old.length ===
                                1
                                  ? [
                                      emptyItem(),
                                    ]
                                  : old.filter(
                                      (
                                        _,
                                        i
                                      ) =>
                                        i !==
                                        index
                                    )
                            )
                          }
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>


      <div className="payment-summary-grid">
        <div className="invoice-subcard">
          <h3>
            Thanh toán
          </h3>

          <div className="two-column">
            <div>
              <label>
                Hình thức
              </label>

              <input
                value={
                  form.payment_method
                }
                onChange={(e) =>
                  setForm(
                    (x) => ({
                      ...x,

                      payment_method:
                        e.target
                          .value,
                    })
                  )
                }
              />
            </div>

            <div>
              <label>
                Đã cọc
              </label>

              <input
                type="number"
                value={
                  form.deposit_amount
                }
                onChange={(e) =>
                  setForm(
                    (x) => ({
                      ...x,

                      deposit_amount:
                        e.target
                          .value,
                    })
                  )
                }
              />
            </div>
          </div>

          <div className="two-column">
            <div>
              <label>
                Phí vận chuyển
              </label>

              <input
                type="number"
                value={
                  form.shipping_fee
                }
                onChange={(e) =>
                  setForm(
                    (x) => ({
                      ...x,

                      shipping_fee:
                        e.target
                          .value,
                    })
                  )
                }
              />
            </div>

            <div>
              <label>
                Còn lại
              </label>

              <input
                disabled
                value={money(
                  remaining
                )}
              />
            </div>
          </div>
        </div>

        <div className="invoice-subcard total-card">
          <h3>
            Tổng cộng
          </h3>

          <div>
            <span>
              Cộng tiền hàng
            </span>

            <strong>
              {money(
                subtotal
              )}
            </strong>
          </div>

          <div>
            <span>
              Phí vận chuyển
            </span>

            <strong>
              {money(
                form.shipping_fee
              )}
            </strong>
          </div>

          <div className="grand-total">
            <span>
              TỔNG THANH TOÁN
            </span>

            <strong>
              {money(total)}
            </strong>
          </div>
        </div>
      </div>


      <div className="invoice-subcard">
        <label>
          Ghi chú
        </label>

        <textarea
          className="invoice-note"
          value={
            form.note
          }
          onChange={(e) =>
            setForm(
              (x) => ({
                ...x,

                note:
                  e.target
                    .value,
              })
            )
          }
        />
      </div>

    </section>
  );
}