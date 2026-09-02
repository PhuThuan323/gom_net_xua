import React, { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function ProductsGroupsList({
  groups = [],
  selectedGroup,
  onSelectGroup,
  onRefresh,
  isAdmin = false,
}) {
  const [editingGroup, setEditingGroup] = useState(null);

  const [formData, setFormData] = useState({
    group_code: "",
    group_name: "",
    description: "",
    status: "active"
  });

  // ============================
  // MỞ FORM SỬA
  // ============================
  const handleEditClick = (e, group) => {
    e.stopPropagation();

    setEditingGroup(group);

    setFormData({
      group_code: group.group_code || "",
      group_name: group.group_name || "",
      description: group.description || "",
      status: group.status || "active"
    });
  };

  // ============================
  // CHANGE INPUT
  // ============================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // ============================
  // LƯU SỬA
  // ============================
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingGroup) return;

    try {
      const response = await fetch(
        `${API_URL}/product-groups/${editingGroup.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        alert("Cập nhật nhóm sản phẩm thành công!");

        setEditingGroup(null);

        // Load lại danh sách nhóm bên trái
        if (onRefresh) {
          onRefresh();
        }
      } else {
        alert(
          result.message || "Không thể cập nhật nhóm sản phẩm!"
        );
      }

    } catch (error) {
      console.error("Lỗi cập nhật nhóm sản phẩm:", error);

      alert("Có lỗi xảy ra khi cập nhật nhóm sản phẩm!");
    }
  };

  return (
    <>
      <div className="card product-group-card">

        <div className="section-label">
          CẤP 1
        </div>

        <h2>
          Nhóm sản phẩm
        </h2>

        {/* ================================= */}
        {/* TẤT CẢ SẢN PHẨM */}
        {/* ================================= */}

        <div
          className={`group-item ${
            selectedGroup === ""
              ? "selected"
              : ""
          }`}
          onClick={() => {
            onSelectGroup({ id: "" });
          }}
        >
          <strong>
            Tất cả sản phẩm
          </strong>
        </div>


        {/* ================================= */}
        {/* DANH SÁCH NHÓM */}
        {/* ================================= */}

        <div className="group-list">

          {groups.map((group) => (

            <div
              key={group.id}
              className={`group-item ${
                selectedGroup === group.id
                  ? "selected"
                  : ""
              }`}
              onClick={() => {
                onSelectGroup(group);
              }}
            >

              {/* THÔNG TIN GROUP */}
              <div className="group-info">

                <strong>
                  {group.group_name}
                </strong>

                <br />

                <span>
                  Mã: {group.group_code}
                </span>

              </div>


              {/* NÚT SỬA */}
              {isAdmin && (
              <button
                type="button"
                className="edit-group-button"
                onClick={(e) =>
                  handleEditClick(e, group)
                }
              >
                Sửa
              </button>
              )}

            </div>

          ))}

        </div>

      </div>


      {/* ================================= */}
      {/* MODAL SỬA GROUP */}
      {/* ================================= */}

      {editingGroup && (

        <div className="modal-overlay">

          <div className="group-edit-modal">

            <h2>
              Sửa nhóm sản phẩm
            </h2>

            <form onSubmit={handleUpdate}>

              <div className="form-group">
                <label>Mã nhóm</label>

                <input
                  type="text"
                  name="group_code"
                  value={formData.group_code}
                  onChange={handleChange}
                  required
                />
              </div>


              <div className="form-group">
                <label>Tên nhóm sản phẩm</label>

                <input
                  type="text"
                  name="group_name"
                  value={formData.group_name}
                  onChange={handleChange}
                  required
                />
              </div>


              <div className="form-group">
                <label>Mô tả</label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>


              <div className="form-group">
                <label>Trạng thái</label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">
                    Hoạt động
                  </option>

                  <option value="inactive">
                    Ngừng hoạt động
                  </option>
                </select>
              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  onClick={() =>
                    setEditingGroup(null)
                  }
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Lưu thay đổi
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </>
  );
  console.log("GROUPS TRONG ProductsGroupsList:", groups);
}


export default ProductsGroupsList;