import {
  useEffect,
  useState
} from "react";


function SupplierForm({

  supplier,

  onSave,

  onClose

}) {


  // =============================================
  // STATE
  // =============================================

  const [
    formData,
    setFormData
  ] = useState({

    supplier_name: "",

    phone: "",

    email: "",

    address: "",

    note: "",

    status: "active"

  });


  // =============================================
  // KHI SỬA
  // =============================================

  useEffect(() => {

    if (supplier) {

      setFormData({

        supplier_name:

          supplier.supplier_name || "",


        phone:

          supplier.phone || "",


        email:

          supplier.email || "",


        address:

          supplier.address || "",


        note:

          supplier.note || "",


        status:

          supplier.status || "active"

      });

    }

  }, [
    supplier
  ]);


  // =============================================
  // THAY ĐỔI INPUT
  // =============================================

  const handleChange =
    (event) => {

      const {

        name,

        value

      } = event.target;


      setFormData({

        ...formData,

        [name]:
          value

      });

    };


  // =============================================
  // SUBMIT
  // =============================================

  const handleSubmit =
    (event) => {

      event.preventDefault();


      if (

        !formData
          .supplier_name
          .trim()

      ) {

        alert(
          "Vui lòng nhập tên nhà cung cấp"
        );

        return;

      }


      onSave(
        formData
      );

    };


  return (

    <div
      className="supplier-modal-overlay"
    >


      <div
        className="supplier-modal"
      >


        {/* HEADER */}

        <div
          className="supplier-modal-header"
        >

          <h2>

            {

              supplier

                ? "Cập nhật nhà cung cấp"

                : "Thêm nhà cung cấp"

            }

          </h2>


          <button

            className="close-modal-btn"

            onClick={
              onClose
            }

          >

            ×

          </button>

        </div>



        {/* FORM */}

        <form
          onSubmit={
            handleSubmit
          }
        >


          {/* TÊN */}

          <div
            className="supplier-form-group"
          >

            <label>

              Tên nhà cung cấp
              <span>
                *
              </span>

            </label>


            <input

              type="text"

              name="supplier_name"

              placeholder="Nhập tên nhà cung cấp"

              value={
                formData.supplier_name
              }

              onChange={
                handleChange
              }

            />

          </div>



          {/* PHONE + EMAIL */}

          <div
            className="supplier-form-row"
          >


            <div
              className="supplier-form-group"
            >

              <label>
                Số điện thoại
              </label>


              <input

                type="text"

                name="phone"

                placeholder="Nhập số điện thoại"

                value={
                  formData.phone
                }

                onChange={
                  handleChange
                }

              />

            </div>



            <div
              className="supplier-form-group"
            >

              <label>
                Email
              </label>


              <input

                type="email"

                name="email"

                placeholder="Nhập email"

                value={
                  formData.email
                }

                onChange={
                  handleChange
                }

              />

            </div>


          </div>



          {/* ĐỊA CHỈ */}

          <div
            className="supplier-form-group"
          >

            <label>
              Địa chỉ
            </label>


            <input

              type="text"

              name="address"

              placeholder="Nhập địa chỉ"

              value={
                formData.address
              }

              onChange={
                handleChange
              }

            />

          </div>



          {/* GHI CHÚ */}

          <div
            className="supplier-form-group"
          >

            <label>
              Ghi chú
            </label>


            <textarea

              name="note"

              placeholder="Nhập ghi chú"

              value={
                formData.note
              }

              onChange={
                handleChange
              }

            />

          </div>



          {/* TRẠNG THÁI */}

          <div
            className="supplier-form-group"
          >

            <label>
              Trạng thái
            </label>


            <select

              name="status"

              value={
                formData.status
              }

              onChange={
                handleChange
              }

            >

              <option
                value="active"
              >

                Đang hoạt động

              </option>


              <option
                value="inactive"
              >

                Ngừng hoạt động

              </option>


            </select>

          </div>



          {/* BUTTON */}

          <div
            className="supplier-form-actions"
          >


            <button

              type="button"

              className="cancel-btn"

              onClick={
                onClose
              }

            >

              Hủy

            </button>


            <button

              type="submit"

              className="save-btn"

            >

              {

                supplier

                  ? "Cập nhật"

                  : "Thêm nhà cung cấp"

              }

            </button>


          </div>


        </form>


      </div>


    </div>

  );

}


export default SupplierForm;