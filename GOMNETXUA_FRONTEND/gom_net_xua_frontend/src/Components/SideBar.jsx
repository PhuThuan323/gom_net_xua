function Sidebar({
  activePage,
  setActivePage,
  currentUser,
}) {
  const handleChangePage = (page) => {
    console.log(
      "Chuyển sang:",
      page
    );

    setActivePage(page);
  };

  const isAdmin =
    currentUser?.role === "ADMIN";

  const menus = [
    {
      key: "overall",
      label: "Tổng quan",
      adminOnly: true,
    },

    {
      key: "products",
      label: "Sản phẩm & biến thể",
      adminOnly: false,
    },

    {
      key: "barcode",
      label: "Mã vạch & tem",
      adminOnly: false,
    },

    {
      key: "nhacungcap",
      label: "Nhà cung cấp",
      adminOnly: true,
    },

    {
      key: "nhapkho",
      label: "Nhập kho",
      adminOnly: true,
    },

    {
      key: "no",
      label: "Công nợ nhà cung cấp",
      adminOnly: true,
    },

    {
      key: "baogia",
      label: "Báo Giá",
      adminOnly: true,
    },

    {
      key: "xuatkho",
      label: "Xuất kho",
      adminOnly: false,
    },

    {
      key: "loss",
      label: "Thất Thoát",
      adminOnly: true,
    },

    {
      key: "cashflow",
      label: "Thu - Chi",
      adminOnly: true,
    },

    {
      key: "report",
      label: "Báo cáo",
      adminOnly: true,
    },

    {
      key: "users",
      label: "Quản lý nhân viên",
      adminOnly: true,
    },
  ];

  const visibleMenus =
    menus.filter(
      (item) =>
        !item.adminOnly ||
        isAdmin
    );

  return (
    <aside className="sidebar">
      <nav className="menu">

        {visibleMenus.map(
          (item) => (
            <button
              key={item.key}
              type="button"
              className={`menu-item ${
                activePage === item.key
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleChangePage(
                  item.key
                )
              }
            >
              {item.label}
            </button>
          )
        )}

      </nav>
    </aside>
  );
}

export default Sidebar;