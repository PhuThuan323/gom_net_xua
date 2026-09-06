import {
  useCallback,
  useEffect,
  useState,
} from "react";

import "../Components/userMana.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

const getToken = () =>
  localStorage.getItem(
    "nx_token"
  );

const getAvatarUrl = (
  avatar
) => {
  if (!avatar) {
    return "";
  }

  if (
    avatar.startsWith("http://") ||
    avatar.startsWith("https://")
  ) {
    return avatar;
  }

  return `${API_URL}${avatar}`;
};

async function api(
  path,
  options = {}
) {
  const response =
    await fetch(
      `${API_URL}${path}`,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${getToken()}`,

          ...(options.headers || {}),
        },
      }
    );

  const raw =
    await response.text();

  let data = {};

  try {
    data =
      raw
        ? JSON.parse(raw)
        : {};
  } catch {
    throw new Error(
      "API không trả JSON"
    );
  }

  if (
    !response.ok ||
    data.success === false
  ) {
    throw new Error(
      data.message ||
        "Có lỗi xảy ra"
    );
  }

  return data;
}

const roleLabel = (
  role
) => {
  switch (role) {
    case "ADMIN":
      return "Quản trị viên";

    case "LIVESTREAMER":
      return "Nhân viên livestream";

    case "EMPLOYEE":
    default:
      return "Nhân viên kho";
  }
};

export default function UserManagement() {
  const [
    users,
    setUsers,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    role,
    setRole,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    editingUser,
    setEditingUser,
  ] = useState(null);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    resettingUser,
    setResettingUser,
  ] = useState(null);

  const loadUsers =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const params =
            new URLSearchParams();

          if (search) {
            params.set(
              "search",
              search
            );
          }

          if (role) {
            params.set(
              "role",
              role
            );
          }

          if (status) {
            params.set(
              "status",
              status
            );
          }

          const result =
            await api(
              `/users?${params.toString()}`
            );

          setUsers(
            result.data || []
          );
        } catch (error) {
          console.error(error);

          alert(
            error.message
          );
        } finally {
          setLoading(false);
        }
      },
      [
        search,
        role,
        status,
      ]
    );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const changeStatus =
    async (
      user
    ) => {
      const nextStatus =
        user.status === "active"
          ? "inactive"
          : "active";

      const ok =
        window.confirm(
          nextStatus === "inactive"
            ? `Khóa tài khoản ${user.full_name}?`
            : `Mở lại tài khoản ${user.full_name}?`
        );

      if (!ok) {
        return;
      }

      try {
        await api(
          `/users/${user.id}/status`,
          {
            method: "PATCH",

            body:
              JSON.stringify({
                status:
                  nextStatus,
              }),
          }
        );

        await loadUsers();
      } catch (error) {
        alert(
          error.message
        );
      }
    };

  return (
    <main className="user-admin-page">

      <section className="user-admin-header">

        <div>
          <span className="user-admin-eyebrow">
            QUẢN TRỊ HỆ THỐNG
          </span>

          <h1>
            Quản lý nhân viên
          </h1>

          <p>
            Xem tài khoản, chức vụ,
            quyền truy cập và trạng thái
            nhân viên.
          </p>
        </div>

        <button
          type="button"
          className="user-btn primary"
          onClick={() =>
            setCreating(true)
          }
        >
          + Thêm nhân viên
        </button>

      </section>

      <section className="user-stat-grid">

        <div className="user-stat-card">
          <span>
            Tổng tài khoản
          </span>

          <strong>
            {users.length}
          </strong>
        </div>

        <div className="user-stat-card">
          <span>
            Quản trị viên
          </span>

          <strong>
            {
              users.filter(
                (user) =>
                  user.role ===
                  "ADMIN"
              ).length
            }
          </strong>
        </div>

        <div className="user-stat-card">
          <span>
            Nhân viên kho
          </span>

          <strong>
            {
              users.filter(
                (user) =>
                  user.role ===
                  "EMPLOYEE"
              ).length
            }
          </strong>
        </div>

        <div className="user-stat-card">
          <span>
            Đang hoạt động
          </span>

          <strong>
            {
              users.filter(
                (user) =>
                  user.status ===
                  "active"
              ).length
            }
          </strong>
        </div>

      </section>

      <section className="user-filter-card">

        <input
          type="search"
          placeholder="Tìm tên, email hoặc số điện thoại"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        <select
          value={role}
          onChange={(e) =>
            setRole(
              e.target.value
            )
          }
        >
          <option value="">
            Tất cả quyền
          </option>

          <option value="ADMIN">
            Quản trị viên
          </option>

          <option value="EMPLOYEE">
            Nhân viên kho
          </option>

          <option value="LIVESTREAMER">
            Nhân viên livestream
          </option>
        </select>

        <select
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
        >
          <option value="">
            Tất cả trạng thái
          </option>

          <option value="active">
            Đang hoạt động
          </option>

          <option value="inactive">
            Đã khóa
          </option>
        </select>

        <button
          type="button"
          className="user-btn secondary"
          onClick={loadUsers}
        >
          Làm mới
        </button>

      </section>

      <section className="user-table-card">

        <div className="user-table-wrap">

          <table className="user-table">

            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Chức vụ</th>
                <th>Quyền</th>
                <th>Google</th>
                <th>Đăng nhập gần nhất</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>

              {users.map(
                (user) => (
                  <tr key={user.id}>

                    <td>
                      <div className="user-person">

                        <div className="user-avatar">

                          {user.avatar_url ? (
                            <img
                              src={
                                getAvatarUrl(
                                  user.avatar_url
                                )
                              }
                              alt={
                                user.full_name
                              }
                            />
                          ) : (
                            <span>
                              {String(
                                user.full_name ||
                                  "N"
                              )
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}

                        </div>

                        <div>
                          <strong>
                            {user.full_name}
                          </strong>

                          <small>
                            ID #{user.id}
                          </small>
                        </div>

                      </div>
                    </td>

                    <td>
                      {user.email}
                    </td>

                    <td>
                      {user.phone || "—"}
                    </td>

                    <td>
                      {user.position || "—"}
                    </td>

                    <td>
                      <span
                        className={`user-role ${
                          user.role === "ADMIN"
                            ? "admin"
                            : "employee"
                            
                        }`}
                      >
                        {roleLabel(
                          user.role
                        )}
                      </span>
                    </td>

                    <td>
                      {user.google_connected
                        ? "Đã liên kết"
                        : "Chưa liên kết"}
                    </td>

                    <td>
                      {user.last_login_at
                        ? new Date(
                            user.last_login_at
                          ).toLocaleString(
                            "vi-VN"
                          )
                        : "Chưa đăng nhập"}
                    </td>

                    <td>
                      <span
                        className={`user-status ${
                          user.status
                        }`}
                      >
                        {user.status ===
                        "active"
                          ? "Hoạt động"
                          : "Đã khóa"}
                      </span>
                    </td>

                    <td>
                      <div className="user-actions">

                        <button
                          type="button"
                          className="user-small-btn edit"
                          onClick={() =>
                            setEditingUser(
                              user
                            )
                          }
                        >
                          Sửa
                        </button>

                        <button
                          type="button"
                          className="user-small-btn reset"
                          onClick={() =>
                            setResettingUser(
                              user
                            )
                          }
                        >
                          Reset MK
                        </button>

                        <button
                          type="button"
                          className={`user-small-btn ${
                            user.status ===
                            "active"
                              ? "lock"
                              : "unlock"
                          }`}
                          onClick={() =>
                            changeStatus(
                              user
                            )
                          }
                        >
                          {user.status ===
                          "active"
                            ? "Khóa"
                            : "Mở"}
                        </button>

                      </div>
                    </td>

                  </tr>
                )
              )}

              {!users.length &&
                !loading && (
                  <tr>
                    <td
                      colSpan="9"
                      className="user-empty"
                    >
                      Chưa có tài khoản phù hợp.
                    </td>
                  </tr>
                )}

            </tbody>

          </table>

        </div>

      </section>

      {creating && (
        <UserFormModal
          title="Thêm nhân viên"
          onClose={() =>
            setCreating(false)
          }
          onSaved={async () => {
            setCreating(false);

            await loadUsers();
          }}
        />
      )}

      {editingUser && (
        <UserFormModal
          title="Cập nhật nhân viên"
          user={editingUser}
          onClose={() =>
            setEditingUser(null)
          }
          onSaved={async () => {
            setEditingUser(null);

            await loadUsers();
          }}
        />
      )}

      {resettingUser && (
        <ResetPasswordModal
          user={resettingUser}
          onClose={() =>
            setResettingUser(null)
          }
        />
      )}

    </main>
  );
}

/* =========================================================
   CREATE / EDIT
========================================================= */

function UserFormModal({
  title,
  user = null,
  onClose,
  onSaved,
}) {
  const [
    form,
    setForm,
  ] = useState({
    full_name:
      user?.full_name || "",

    email:
      user?.email || "",

    phone:
      user?.phone || "",

    position:
      user?.position || "",

    role:
      user?.role || "EMPLOYEE",

    status:
      user?.status || "active",

    password: "",
  });

  const [
    saving,
    setSaving,
  ] = useState(false);

  const submit =
    async (event) => {
      event.preventDefault();

      if (
        !form.full_name.trim()
      ) {
        alert(
          "Vui lòng nhập họ tên"
        );

        return;
      }

      if (
        !user &&
        !form.email.trim()
      ) {
        alert(
          "Vui lòng nhập email"
        );

        return;
      }

      if (
        !user &&
        form.password.length < 8
      ) {
        alert(
          "Mật khẩu tối thiểu 8 ký tự"
        );

        return;
      }

      try {
        setSaving(true);

        if (user) {
          await api(
            `/users/${user.id}`,
            {
              method: "PATCH",

              body:
                JSON.stringify({
                  full_name:
                    form.full_name,

                  phone:
                    form.phone,

                  position:
                    form.position,

                  role:
                    form.role,

                  status:
                    form.status,
                }),
            }
          );
        } else {
          await api(
            "/users",
            {
              method: "POST",

              body:
                JSON.stringify({
                  full_name:
                    form.full_name,

                  email:
                    form.email,

                  phone:
                    form.phone,

                  position:
                    form.position,

                  role:
                    form.role,

                  password:
                    form.password,
                }),
            }
          );
        }

        onSaved();
      } catch (error) {
        alert(
          error.message
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="user-modal-backdrop">

      <form
        className="user-modal"
        onSubmit={submit}
      >

        <div className="user-modal-heading">

          <h2>
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
          >
            ×
          </button>

        </div>

        <label>
          Họ và tên
        </label>

        <input
          value={form.full_name}
          onChange={(e) =>
            setForm({
              ...form,
              full_name:
                e.target.value,
            })
          }
        />

        {!user && (
          <>
            <label>
              Email đăng nhập
            </label>

            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email:
                    e.target.value,
                })
              }
            />

            <label>
              Mật khẩu ban đầu
            </label>

            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password:
                    e.target.value,
                })
              }
            />
          </>
        )}

        {user && (
          <>
            <label>
              Email
            </label>

            <input
              value={form.email}
              disabled
            />
          </>
        )}

        <div className="user-modal-grid">

          <div>
            <label>
              Số điện thoại
            </label>

            <input
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone:
                    e.target.value,
                })
              }
            />
          </div>

          <div>
            <label>
              Chức vụ
            </label>

            <input
              placeholder="Thủ kho, Kế toán..."
              value={form.position}
              onChange={(e) =>
                setForm({
                  ...form,
                  position:
                    e.target.value,
                })
              }
            />
          </div>

        </div>

        <label>
          Quyền tài khoản
        </label>

        <select
          value={form.role}
          onChange={(e) =>
            setForm({
              ...form,
              role:
                e.target.value,
            })
          }
        >
          <option value="EMPLOYEE">
            Nhân viên kho 
          </option>

          <option value="ADMIN">
            Quản trị viên
          </option>
          <option value="LIVESTREAMER">
            Nhân viên livestream
          </option>
        </select>

        {user && (
          <>
            <label>
              Trạng thái
            </label>

            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status:
                    e.target.value,
                })
              }
            >
              <option value="active">
                Hoạt động
              </option>

              <option value="inactive">
                Đã khóa
              </option>
            </select>
          </>
        )}

        <div className="user-modal-actions">

          <button
            type="button"
            className="user-btn secondary"
            onClick={onClose}
          >
            Hủy
          </button>

          <button
            type="submit"
            className="user-btn primary"
            disabled={saving}
          >
            {saving
              ? "Đang lưu..."
              : "Lưu tài khoản"}
          </button>

        </div>

      </form>

    </div>
  );
}

/* =========================================================
   RESET PASSWORD
========================================================= */

function ResetPasswordModal({
  user,
  onClose,
}) {
  const [
    password,
    setPassword,
  ] = useState("");

  const [
    repeatPassword,
    setRepeatPassword,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const submit =
    async (event) => {
      event.preventDefault();

      if (
        password.length < 8
      ) {
        alert(
          "Mật khẩu tối thiểu 8 ký tự"
        );

        return;
      }

      if (
        password !==
        repeatPassword
      ) {
        alert(
          "Hai mật khẩu không giống nhau"
        );

        return;
      }

      const ok =
        window.confirm(
          `Reset mật khẩu của ${user.full_name}?`
        );

      if (!ok) {
        return;
      }

      try {
        setSaving(true);

        await api(
          `/users/${user.id}/reset-password`,
          {
            method: "PATCH",

            body:
              JSON.stringify({
                new_password:
                  password,
              }),
          }
        );

        alert(
          "Reset mật khẩu thành công"
        );

        onClose();
      } catch (error) {
        alert(
          error.message
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="user-modal-backdrop">

      <form
        className="user-modal reset-modal"
        onSubmit={submit}
      >

        <div className="user-modal-heading">

          <div>
            <h2>
              Reset mật khẩu
            </h2>

            <p>
              {user.full_name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
          >
            ×
          </button>

        </div>

        <label>
          Mật khẩu mới
        </label>

        <input
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
        />

        <label>
          Nhập lại mật khẩu
        </label>

        <input
          type="password"
          value={repeatPassword}
          onChange={(e) =>
            setRepeatPassword(
              e.target.value
            )
          }
        />

        <div className="user-modal-actions">

          <button
            type="button"
            className="user-btn secondary"
            onClick={onClose}
          >
            Hủy
          </button>

          <button
            type="submit"
            className="user-btn primary"
            disabled={saving}
          >
            Reset mật khẩu
          </button>

        </div>

      </form>

    </div>
  );
}