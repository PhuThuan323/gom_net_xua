import {
  useEffect,
  useMemo,
  useState
} from "react";

import SupplierForm from "../Components/Suppliers/SupplierForm";

import SupplierTable
  from "../Components/Suppliers/SupplierTable";

import "../Components/Suppliers/SuppliersPage.css";


const API_URL =
  import.meta.env.VITE_API_URL;


function NhaCungCap() {


  // =============================================
  // STATE
  // =============================================

  const [
    suppliers,
    setSuppliers
  ] = useState([]);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    searchKeyword,
    setSearchKeyword
  ] = useState("");


  const [
    showForm,
    setShowForm
  ] = useState(false);


  const [
    selectedSupplier,
    setSelectedSupplier
  ] = useState(null);


  // =============================================
  // LẤY DANH SÁCH NHÀ CUNG CẤP
  // =============================================

  const loadSuppliers =
    async () => {

      try {

        setLoading(true);


        const response =
          await fetch(
            `${API_URL}/suppliers`
          );


        const result =
          await response.json();


        if (!response.ok) {

          throw new Error(
            result.message ||
            "Không thể tải danh sách nhà cung cấp"
          );

        }


        setSuppliers(

          Array.isArray(
            result.data
          )

            ? result.data

            : []

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

        setLoading(false);

      }

    };


  // =============================================
  // LOAD DATA
  // =============================================

  useEffect(() => {

    loadSuppliers();

  }, []);


  // =============================================
  // TÌM KIẾM
  // =============================================

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
              ?.toLowerCase()
              || "";


          const supplierName =
            supplier.supplier_name
              ?.toLowerCase()
              || "";


          const phone =
            supplier.phone
              ?.toLowerCase()
              || "";


          return (

            supplierCode.includes(
              keyword
            )

            ||

            supplierName.includes(
              keyword
            )

            ||

            phone.includes(
              keyword
            )

          );

        }

      );


    }, [

      suppliers,
      searchKeyword

    ]);


  // =============================================
  // THÊM NHÀ CUNG CẤP
  // =============================================

  const handleAddSupplier =
    () => {

      setSelectedSupplier(
        null
      );

      setShowForm(
        true
      );

    };


  // =============================================
  // SỬA NHÀ CUNG CẤP
  // =============================================

  const handleEditSupplier =
    (supplier) => {

      setSelectedSupplier(
        supplier
      );

      setShowForm(
        true
      );

    };


  // =============================================
  // XÓA NHÀ CUNG CẤP
  // =============================================

  const handleDeleteSupplier =
    async (supplier) => {

      const confirmDelete =
        window.confirm(

          `Bạn có chắc muốn xóa nhà cung cấp "${supplier.supplier_name}" không?`

        );


      if (!confirmDelete) {

        return;

      }


      try {

        const response =
          await fetch(

            `${API_URL}/suppliers/${supplier.id}`,

            {
              method:
                "DELETE"
            }

          );


        const result =
          await response.json();


        if (!response.ok) {

          throw new Error(

            result.message ||
            "Không thể xóa nhà cung cấp"

          );

        }


        alert(
          "Xóa nhà cung cấp thành công"
        );


        loadSuppliers();


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


  // =============================================
  // LƯU FORM
  // =============================================

  const handleSaveSupplier =
    async (formData) => {

      try {

        let url =
          `${API_URL}/suppliers`;


        let method =
          "POST";


        // Nếu đang sửa
        if (selectedSupplier) {

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
                  "application/json"

              },

              body:

                JSON.stringify(
                  formData
                )

            }

          );


        const result =
          await response.json();


        if (!response.ok) {

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


        loadSuppliers();


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


  // =============================================
  // RENDER
  // =============================================

  return (

    <div className="supplier-page">


      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

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



      {/* ========================================= */}
      {/* SEARCH */}
      {/* ========================================= */}

      <div className="supplier-search-card">

        <input

          type="text"

          placeholder="Tìm tên, mã hoặc số điện thoại"

          value={
            searchKeyword
          }

          onChange={
            (event) =>

              setSearchKeyword(
                event.target.value
              )
          }

        />

      </div>



      {/* ========================================= */}
      {/* TABLE */}
      {/* ========================================= */}

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



      {/* ========================================= */}
      {/* FORM MODAL */}
      {/* ========================================= */}

      {showForm && (

        <SupplierForm

          supplier={
            selectedSupplier
          }

          onSave={
            handleSaveSupplier
          }

          onClose={
            () => {

              setShowForm(
                false
              );


              setSelectedSupplier(
                null
              );

            }
          }

        />

      )}


    </div>

  );

}


export default NhaCungCap;