function SupplierTable({

  suppliers = [],

  onEdit,

  onDelete

}) {


  // =============================================
  // FORMAT TIỀN
  // =============================================

  const formatCurrency =
    (value) => {

      return Number(
        value || 0
      ).toLocaleString(
        "vi-VN"
      );

    };


  return (

    <div className="supplier-table-card">


      <table
        className="supplier-table"
      >


        {/* ======================================= */}
        {/* HEADER */}
        {/* ======================================= */}

        <thead>

          <tr>

            <th>
              Mã NCC
            </th>

            <th>
              Tên nhà cung cấp
            </th>

            <th>
              Điện thoại
            </th>

            <th>
              Địa chỉ
            </th>

            <th>
              Tổng phát sinh nợ
            </th>

            <th>
              Đã trả
            </th>

            <th>
              Còn nợ
            </th>

            <th>
              Thao tác
            </th>

          </tr>

        </thead>



        {/* ======================================= */}
        {/* BODY */}
        {/* ======================================= */}

        <tbody>


          {suppliers.length === 0 ? (

            <tr>

              <td
                colSpan="8"
                className="empty-table"
              >

                Không tìm thấy nhà cung cấp

              </td>

            </tr>

          ) : (

            suppliers.map(
              (supplier) => {


                /*
                  Các trường công nợ hiện tại API supplier
                  chưa có thì mặc định bằng 0.

                  Sau này khi bạn có API công nợ:
                  supplier.total_debt
                  supplier.paid_amount
                  supplier.remaining_debt

                  thì component vẫn dùng được.
                */


                const totalDebt =
                  Number(
                    supplier.total_debt || 0
                  );


                const paidAmount =
                  Number(
                    supplier.paid_amount || 0
                  );


                const remainingDebt =
                  supplier.remaining_debt !==
                  undefined

                    ? Number(
                        supplier.remaining_debt
                      )

                    : totalDebt -
                      paidAmount;


                return (

                  <tr
                    key={
                      supplier.id
                    }
                  >


                    {/* MÃ NCC */}

                    <td
                      className="supplier-code"
                    >

                      {
                        supplier.supplier_code ||
                        "-"
                      }

                    </td>



                    {/* TÊN */}

                    <td>

                      {
                        supplier.supplier_name ||
                        "-"
                      }

                    </td>



                    {/* ĐIỆN THOẠI */}

                    <td>

                      {
                        supplier.phone ||
                        "-"
                      }

                    </td>



                    {/* ĐỊA CHỈ */}

                    <td>

                      {
                        supplier.address ||
                        "-"
                      }

                    </td>



                    {/* TỔNG PHÁT SINH NỢ */}

                    <td
                      className="money"
                    >

                      {
                        formatCurrency(
                          totalDebt
                        )
                      }

                      đ

                    </td>



                    {/* ĐÃ TRẢ */}

                    <td
                      className="money"
                    >

                      {
                        formatCurrency(
                          paidAmount
                        )
                      }

                      đ

                    </td>



                    {/* CÒN NỢ */}

                    <td
                      className="money debt"
                    >

                      {
                        formatCurrency(
                          remainingDebt
                        )
                      }

                      đ

                    </td>



                    {/* THAO TÁC */}

                    <td>

                      <div
                        className="supplier-actions"
                      >


                        <button

                          className="edit-btn"

                          onClick={
                            () =>

                              onEdit(
                                supplier
                              )
                          }

                        >

                          Sửa

                        </button>


                        <button

                          className="delete-btn"

                          onClick={
                            () =>

                              onDelete(
                                supplier
                              )
                          }

                        >

                          Xóa

                        </button>


                      </div>

                    </td>


                  </tr>

                );

              }
            )

          )}


        </tbody>


      </table>


    </div>

  );

}


export default SupplierTable;