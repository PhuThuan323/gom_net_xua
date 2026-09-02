export default function TopBar({
  employeeName = "Nguyễn Văn A",
  employeeRole = "Quản trị viên",
  avatarUrl = "",
  onLogout,
}) {
  return (
    <header className="topbar">
      <div className="topbar-company">
        <div className="topbar-company-logo">
          NX
        </div>

        <div className="topbar-company-text">
          <strong>
            GỐM SỨ ĐẶC SẢN NÉT XƯA
          </strong>

          <span>
            Hệ thống quản lý kho nội bộ
          </span>
        </div>
      </div>

      <div className="topbar-user">
        <div className="topbar-user-info">
          <strong>
            {employeeName}
          </strong>

          <span>
            {employeeRole}
          </span>
        </div>

        <button
          type="button"
          className="topbar-logout"
          onClick={onLogout}
        >
          Đăng xuất
        </button>

        <div className="topbar-avatar">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={employeeName}
            />
          ) : (
            <span>
              {String(
                employeeName || "NV"
              )
                .trim()
                .charAt(0)
                .toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}