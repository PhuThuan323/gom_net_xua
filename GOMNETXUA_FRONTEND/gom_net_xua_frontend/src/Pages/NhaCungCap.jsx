import {
  useEffect,
  useMemo,
  useState,
} from "react";

import SupplierForm from "../Components/Suppliers/SupplierForm";

import SupplierTable from "../Components/Suppliers/SupplierTable";

import "../Components/Suppliers/SuppliersPage.css";

const API_URL =
  import.meta.env.VITE_API_URL;

const parseJsonSafe = async (
  response
) => {
  const text =
    await response.text();

  let data = {};

  try {
    data =
      text
        ? JSON.parse(text)
        : {};
  } catch {
    throw new Error(
      `API không trả JSON (HTTP ${response.status}). ` +
        `Kiểm tra lại VITE_API_URL hoặc route backend.`
    );
  }

  return data;
};

function NhaCungCap() {
  const [
    suppliers,
    setSuppliers,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    searchKeyword,
    setSearchKeyword,
  ] = useState("");

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    selectedSupplier,
    setSelectedSupplier,
  ] = useState(null);

  /* =========================================================
     LOAD NCC + CÔNG NỢ

     /suppliers
       = thông tin NCC

     /debt/suppliers
       = total_debt
       = total_payment
       = current_balance
       = total_adjustment
  ========================================================= */

  const loadSuppliers =
    async () => {
      try {
        setLoading(
          true
        );

        const [
          supplierResponse,
          debtResponse,
        ] =
          await Promise.all([
            fetch(
              `${API_URL}/suppliers`
            ),

            fetch(
              `${API_URL}/debt/suppliers`
            ),
          ]);

        const [
          supplierResult,
          debtResult,
        ] =
          await Promise.all([
            parseJsonSafe(
              supplierResponse
            ),

            parseJsonSafe(
              debtResponse
            ),
          ]);

        if (
          !supplierResponse.ok ||
          supplierResult.success ===
            false
        ) {
          throw new Error(
            supplierResult.message ||
              "Không thể tải danh sách nhà cung cấp"
          );
        }

        if (
          !debtResponse.ok ||
          debtResult.success ===
            false
        ) {
          throw new Error(
            debtResult.message ||
              "Không thể tải số liệu công nợ nhà cung cấp"
          );
        }

        const baseSuppliers =
          Array.isArray(
            supplierResult.data
          )
            ? supplierResult.data
            : [];

        const debtSuppliers =
          Array.isArray(
            debtResult.data
          )
            ? debtResult.data
            : [];

        const debtMap =
          new Map(
            debtSuppliers.map(
              (item) => [
                Number(
                  item.id
                ),

                item,
              ]
            )
          );

        const merged =
          baseSuppliers.map(
            (supplier) => {
              const debt =
                debtMap.get(
                  Number(
                    supplier.id
                  )
                ) || {};

              return {
                ...supplier,

                /*
                 * Giữ thông tin NCC từ API /suppliers,
                 * ghép số liệu công nợ từ /debt/suppliers.
                 */
                total_debt:
                  debt.total_debt ??
                  "0",

                gross_debt:
                  debt.gross_debt ??
                  "0",

                total_adjustment:
                  debt.total_adjustment ??
                  "0",

                total_payment:
                  debt.total_payment ??
                  "0",

                paid_amount:
                  debt.total_payment ??
                  debt.paid_amount ??
                  "0",

                current_balance:
                  debt.current_balance ??
                  "0",

                remaining_debt:
                  debt.current_balance ??
                  debt.remaining_debt ??
                  "0",
              };
            }
          );

        setSuppliers(
          merged
        );
      } catch (error) {
        console.error(
          "Lỗi tải nhà cung cấp:",
          error
        );

        alert(
          error.message ||
            "Không thể tải danh sách nhà cung cấp"
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const filteredSuppliers =
    useMemo(() => {
      const keyword =
        searchKeyword
          .toLowerCase()
          .trim();

      if (!keyword) {
        return suppliers;
      }

      return suppliers.filter(
        (supplier) => {
          const supplierCode =
            supplier.supplier_code
              ?.toLowerCase() ||
            "";

          const supplierName =
            supplier.supplier_name
              ?.toLowerCase() ||
            "";

          const phone =
            supplier.phone
              ?.toLowerCase() ||
            "";

          return (
            supplierCode.includes(
              keyword
            ) ||
            supplierName.includes(
              keyword
            ) ||
            phone.includes(
              keyword
            )
          );
        }
      );
    }, [
      suppliers,
      searchKeyword,
    ]);

  const handleAddSupplier =
    () => {
      setSelectedSupplier(
        null
      );

      setShowForm(
        true
      );
    };

  const handleEditSupplier =
    (supplier) => {
      setSelectedSupplier(
        supplier
      );

      setShowForm(
        true
      );
    };

  const handleDeleteSupplier =
    async (
      supplier
    ) => {
      const confirmDelete =
        window.confirm(
          `Bạn có chắc muốn xóa nhà cung cấp "${supplier.supplier_name}" không?`
        );

      if (
        !confirmDelete
      ) {
        return;
      }

      /*
       * Không cho xóa NCC còn công nợ.
       * Tránh cascade xóa luôn lịch sử SupplierDebt.
       */
      if (
        Number(
          supplier.current_balance ||
            0
        ) !== 0
      ) {
        alert(
          `Không thể xóa nhà cung cấp đang còn nợ ` +
            `${Number(
              supplier.current_balance ||
                0
            ).toLocaleString(
              "vi-VN"
            )} đ. ` +
            `Hãy xử lý công nợ trước.`
        );

        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/suppliers/${supplier.id}`,
            {
              method:
                "DELETE",
            }
          );

        const result =
          await parseJsonSafe(
            response
          );

        if (
          !response.ok ||
          result.success ===
            false
        ) {
          throw new Error(
            result.message ||
              "Không thể xóa nhà cung cấp"
          );
        }

        alert(
          "Xóa nhà cung cấp thành công"
        );

        await loadSuppliers();
      } catch (error) {
        console.error(
          "Lỗi xóa:",
          error
        );

        alert(
          error.message ||
            "Không thể xóa nhà cung cấp"
        );
      }
    };

  const handleSaveSupplier =
    async (
      formData
    ) => {
      try {
        let url =
          `${API_URL}/suppliers`;

        let method =
          "POST";

        if (
          selectedSupplier
        ) {
          url =
            `${API_URL}/suppliers/${selectedSupplier.id}`;

          method =
            "PUT";
        }

        const response =
          await fetch(
            url,
            {
              method,

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  formData
                ),
            }
          );

        const result =
          await parseJsonSafe(
            response
          );

        if (
          !response.ok ||
          result.success ===
            false
        ) {
          throw new Error(
            result.message ||
              "Không thể lưu nhà cung cấp"
          );
        }

        alert(
          selectedSupplier
            ? "Cập nhật nhà cung cấp thành công"
            : "Thêm nhà cung cấp thành công"
        );

        setShowForm(
          false
        );

        setSelectedSupplier(
          null
        );

        await loadSuppliers();
      } catch (error) {
        console.error(
          "Lỗi lưu:",
          error
        );

        alert(
          error.message ||
            "Không thể lưu nhà cung cấp"
        );
      }
    };

  return (
    <div className="supplier-page">
      <div className="supplier-header">
        <div>
          <h1>
            Danh mục nhà cung cấp
          </h1>

          <p>
            Quản lý thông tin và theo dõi tổng công nợ theo từng nhà cung cấp.
          </p>
        </div>

        <button
          className="add-supplier-btn"
          onClick={
            handleAddSupplier
          }
        >
          + Thêm nhà cung cấp
        </button>
      </div>

      <div className="supplier-search-card">
        <input
          type="text"
          placeholder="Tìm tên, mã hoặc số điện thoại"
          value={
            searchKeyword
          }
          onChange={(
            event
          ) =>
            setSearchKeyword(
              event.target.value
            )
          }
        />
      </div>

      {loading ? (
        <div className="supplier-loading">
          Đang tải dữ liệu...
        </div>
      ) : (
        <SupplierTable
          suppliers={
            filteredSuppliers
          }
          onEdit={
            handleEditSupplier
          }
          onDelete={
            handleDeleteSupplier
          }
        />
      )}

      {showForm && (
        <SupplierForm
          supplier={
            selectedSupplier
          }
          onSave={
            handleSaveSupplier
          }
          onClose={() => {
            setShowForm(
              false
            );

            setSelectedSupplier(
              null
            );
          }}
        />
      )}
    </div>
  );
}

export default NhaCungCap;
