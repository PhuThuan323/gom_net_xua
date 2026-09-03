import { useEffect, useState } from "react";
import "./Sidebar.css";

function Sidebar({
  activePage,
  setActivePage,
  currentUser,
}) {
  const checkMobile = () => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(max-width: 768px)").matches;
  };

  const [isMobile, setIsMobile] = useState(checkMobile);

  const [sidebarOpen, setSidebarOpen] = useState(
    () => !checkMobile()
  );

  // =========================
  // RESPONSIVE
  // =========================

  useEffect(() => {
    const mediaQuery =
      window.matchMedia("(max-width: 768px)");

    const handleScreenChange = (event) => {
      const mobile = event.matches;

      setIsMobile(mobile);

      // Mobile mặc định đóng
      // Desktop mặc định mở
      setSidebarOpen(!mobile);
    };

    // Đồng bộ ngay lần đầu
    setIsMobile(mediaQuery.matches);

    if (mediaQuery.matches) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }

    mediaQuery.addEventListener(
      "change",
      handleScreenChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleScreenChange
      );
    };
  }, []);

  // =========================
  // KHÓA SCROLL KHI MỞ MOBILE
  // =========================

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, sidebarOpen]);

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

  const handleChangePage = (page) => {
    console.log("Chuyển sang:", page);

    setActivePage(page);

    // Mobile chọn xong tự đóng
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* =============================
          NÚT ☰ MOBILE
      ============================== */}

      {isMobile && !sidebarOpen && (
        <button
          type="button"
          className="nx-mobile-menu-button"
          onClick={() =>
            setSidebarOpen(true)
          }
          aria-label="Mở menu"
        >
          ☰
        </button>
      )}

      {/* =============================
          OVERLAY MOBILE
      ============================== */}

      {isMobile && sidebarOpen && (
        <div
          className="nx-sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* =============================
          SIDEBAR
      ============================== */}

      <aside
        className={[
          "nx-sidebar",

          isMobile
            ? "nx-sidebar-mobile"
            : "nx-sidebar-desktop",

          sidebarOpen
            ? "nx-sidebar-open"
            : "nx-sidebar-closed",
        ].join(" ")}
      >
        {/* HEADER RIÊNG MOBILE */}

        {isMobile && (
          <div className="nx-mobile-sidebar-header">
            <div className="nx-mobile-logo">
              NX
            </div>

            <div className="nx-mobile-brand">
              <strong>
                GỐM SỨ ĐẶC SẢN NÉT XƯA
              </strong>

              <span>
                Hệ thống quản lý nội bộ
              </span>
            </div>
          </div>
        )}

        {/* NÚT ĐÓNG */}

        <button
          type="button"
          className="nx-sidebar-toggle"
          onClick={() =>
            setSidebarOpen(false)
          }
          aria-label={
            isMobile
              ? "Đóng menu"
              : "Thu gọn menu"
          }
        >
          {isMobile ? "×" : "‹"}
        </button>

        {/* MENU */}

        <nav className="nx-sidebar-menu">
          {visibleMenus.map((item) => (
            <button
              key={item.key}
              type="button"
              className={[
                "nx-sidebar-menu-item",

                activePage === item.key
                  ? "active"
                  : "",
              ].join(" ")}
              onClick={() =>
                handleChangePage(item.key)
              }
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* =============================
          NÚT MỞ DESKTOP
      ============================== */}

      {!isMobile && !sidebarOpen && (
        <button
          type="button"
          className="nx-sidebar-desktop-open"
          onClick={() =>
            setSidebarOpen(true)
          }
          aria-label="Mở sidebar"
        >
          ›
        </button>
      )}
    </>
  );
}

export default Sidebar;