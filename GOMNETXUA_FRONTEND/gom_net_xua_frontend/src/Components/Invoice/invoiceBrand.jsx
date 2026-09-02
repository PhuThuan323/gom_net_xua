import {
  useEffect,
  useState,
} from "react";

const EMPTY = {
  id: "",
  brand_name: "",
  tax_code: "",
  phone: "",
  address: "",
  email: "",
  bank_name: "",
  bank_account: "",
  bank_holder: "",
  logo_text: "",
};

export default function InvoiceBrandSettings({
  api,
  brands,
  onSaved,
}) {
  const [
    selectedId,
    setSelectedId,
  ] = useState("");

  const [
    form,
    setForm,
  ] = useState(EMPTY);

  const [saving, setSaving] =
    useState(false);

  /*
   * Khi API load brands lần đầu
   * chọn brand default.
   */
  useEffect(() => {
    if (
      brands.length === 0
    ) {
      return;
    }

    if (!selectedId) {
      const defaultBrand =
        brands.find(
          (x) =>
            x.is_default
        ) || brands[0];

      setSelectedId(
        String(
          defaultBrand.id
        )
      );
    }
  }, [
    brands,
    selectedId,
  ]);

  /*
   * Chọn brand
   * => tự đổ dữ liệu vào form.
   */
  useEffect(() => {
    if (!selectedId) {
      setForm(EMPTY);
      return;
    }

    const brand =
      brands.find(
        (x) =>
          String(x.id) ===
          String(selectedId)
      );

    if (!brand) {
      return;
    }

    setForm({
      id:
        brand.id,

      brand_name:
        brand.brand_name ||
        "",

      tax_code:
        brand.tax_code ||
        "",

      phone:
        brand.phone ||
        "",

      address:
        brand.address ||
        "",

      email:
        brand.email ||
        "",

      bank_name:
        brand.bank_name ||
        "",

      bank_account:
        brand.bank_account ||
        "",

      bank_holder:
        brand.bank_holder ||
        "",

      logo_text:
        brand.logo_text ||
        "",
    });
  }, [
    selectedId,
    brands,
  ]);

  const update =
    (field, value) => {
      setForm(
        (old) => ({
          ...old,
          [field]: value,
        })
      );
    };

  const save =
    async () => {
      if (!form.id) {
        return;
      }

      if (
        !form.brand_name.trim()
      ) {
        alert(
          "Vui lòng nhập tên thương hiệu"
        );
        return;
      }

      try {
        setSaving(true);

        await api(
          `/brands/${form.id}`,
          {
            method:
              "PUT",

            body:
              JSON.stringify(
                form
              ),
          }
        );

        await onSaved?.();

        alert(
          "Đã lưu cài đặt thương hiệu"
        );
      } catch (error) {
        alert(
          error.message
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <section className="invoice-card invoice-brand-settings">
      <div className="invoice-section-heading">
        <div>
          <h2>
            Cài đặt thương hiệu hóa đơn
          </h2>

          <p>
            Mỗi thương hiệu có
            thông tin riêng. Khi
            tạo hóa đơn, hệ thống
            tự dùng đúng thông
            tin của thương hiệu
            được chọn.
          </p>
        </div>

        <button
          type="button"
          className="invoice-btn primary"
          onClick={save}
          disabled={saving}
        >
          {saving
            ? "Đang lưu..."
            : "Lưu cài đặt"}
        </button>
      </div>

      <label>
        Đang chỉnh thương hiệu
      </label>

      <select
        className="brand-selector"
        value={selectedId}
        onChange={(e) =>
          setSelectedId(
            e.target.value
          )
        }
      >
        {brands.map(
          (brand) => (
            <option
              key={brand.id}
              value={brand.id}
            >
              {
                brand.brand_name
              }
            </option>
          )
        )}
      </select>

      <div className="brand-setting-grid">
        <div className="invoice-subcard">
          <h3>
            Thông tin đơn vị
          </h3>

          <label>
            Tên thương hiệu
          </label>

          <input
            value={
              form.brand_name
            }
            onChange={(e) =>
              update(
                "brand_name",
                e.target.value
              )
            }
          />

          <div className="two-column">
            <div>
              <label>
                Mã số thuế
              </label>

              <input
                value={
                  form.tax_code
                }
                onChange={(e) =>
                  update(
                    "tax_code",
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label>
                Điện thoại /
                Zalo
              </label>

              <input
                value={
                  form.phone
                }
                onChange={(e) =>
                  update(
                    "phone",
                    e.target.value
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
              update(
                "address",
                e.target.value
              )
            }
          />

          <label>
            Email
          </label>

          <input
            value={
              form.email
            }
            onChange={(e) =>
              update(
                "email",
                e.target.value
              )
            }
          />
        </div>

        <div className="invoice-subcard">
          <h3>
            Thông tin nhận tiền
          </h3>

          <div className="two-column">
            <div>
              <label>
                Ngân hàng
              </label>

              <input
                value={
                  form.bank_name
                }
                onChange={(e) =>
                  update(
                    "bank_name",
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label>
                Số tài khoản
              </label>

              <input
                value={
                  form.bank_account
                }
                onChange={(e) =>
                  update(
                    "bank_account",
                    e.target.value
                  )
                }
              />
            </div>
          </div>

          <label>
            Chủ tài khoản
          </label>

          <input
            value={
              form.bank_holder
            }
            onChange={(e) =>
              update(
                "bank_holder",
                e.target.value
              )
            }
          />

          <label>
            Chữ logo
          </label>

          <input
            value={
              form.logo_text
            }
            maxLength={20}
            placeholder="NX / HQ"
            onChange={(e) =>
              update(
                "logo_text",
                e.target.value
              )
            }
          />
        </div>
      </div>
    </section>
  );
}