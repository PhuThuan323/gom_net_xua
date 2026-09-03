import { useEffect, useState } from "react";
import "./Sidebar.css";
function Sidebar({
  activePage,
  setActivePage,
  currentUser,
}) {
  // =========================
  // RESPONSIVE SIDEBAR
  // =========================

  const getIsMobile = () => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.innerWidth <= 768;
  };

  const [isMobile, setIsMobile] = useState(getIsMobile);

  const [sidebarOpen, setSidebarOpen] = useState(
    () => !getIsMobile()
  );

  useEffect(() => {
    const handleResize = () => {
      const mobile =
        window.innerWidth <= 768;

      setIsMobile((previousMobile) => {
        // Chỉ reset sidebar khi chuyển
        // từ mobile <-> desktop
        if (previousMobile !== mobile) {
          setSidebarOpen(!mobile);
        }

        return mobile;
      });
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  // =========================
  // PHÂN QUYỀN
  // =========================

  const isAdmin =
    currentUser?.role === "ADMIN";

  // =========================
  // MENU
  // =========================

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
      key: "affiliate",
      label: "Hoa hồng đơn hàng",
      adminOnly: false,
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

  // =========================
  // CHUYỂN TRANG
  // =========================

  const handleChangePage = (
    page
  ) => {
    console.log(
      "Chuyển sang:",
      page
    );

    setActivePage(page);

    // Mobile chọn menu xong tự đóng
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* =====================================
          NÚT MENU MOBILE
      ====================================== */}

      {isMobile &&
        !sidebarOpen && (
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() =>
              setSidebarOpen(true)
            }
            aria-label="Mở menu"
            title="Mở menu"
          >
            ☰
          </button>
        )}

      {/* =====================================
          OVERLAY MOBILE
      ====================================== */}

      {isMobile &&
        sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() =>
              setSidebarOpen(false)
            }
          />
        )}

      {/* =====================================
          SIDEBAR
      ====================================== */}

      <aside
        className={[
          "sidebar",

          sidebarOpen
            ? "sidebar-open"
            : "sidebar-closed",

          isMobile
            ? "sidebar-mobile"
            : "sidebar-desktop",
        ].join(" ")}
      >
        {/* NÚT ĐÓNG / THU GỌN */}

        <button
          type="button"
          className="sidebar-toggle-button"
          onClick={() =>
            setSidebarOpen(false)
          }
          aria-label="Đóng menu"
          title={
            isMobile
              ? "Đóng menu"
              : "Thu gọn menu"
          }
        >
          {isMobile
            ? "×"
            : "‹"}
        </button>

        {/* MENU */}

        <nav className="menu">
          {visibleMenus.map(
            (item) => (
              <button
                key={
                  item.key
                }
                type="button"
                className={`menu-item ${
                  activePage ===
                  item.key
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleChangePage(
                    item.key
                  )
                }
              >
                {
                  item.label
                }
              </button>
            )
          )}
        </nav>
      </aside>

      {/* =====================================
          NÚT MỞ LẠI SIDEBAR DESKTOP
      ====================================== */}

      {!isMobile &&
        !sidebarOpen && (
          <button
            type="button"
            className="desktop-sidebar-open"
            onClick={() =>
              setSidebarOpen(true)
            }
            aria-label="Mở menu"
            title="Mở menu"
          >
            ›
          </button>
        )}
    </>
  );
}

export default Sidebar;