import {
  useEffect,
  useState,
} from "react";

import "./Sidebar.css";

function Sidebar({
  activePage,
  setActivePage,
  currentUser,
}) {
  const checkMobile = () => {
    if (
      typeof window ===
      "undefined"
    ) {
      return false;
    }

    return window
      .matchMedia(
        "(max-width: 768px)"
      )
      .matches;
  };

  const [
    isMobile,
    setIsMobile,
  ] = useState(
    checkMobile
  );

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(
    () =>
      !checkMobile()
  );

  // =========================
  // ROLE
  // =========================

  const role =
    currentUser?.role ||
    "";

  const isAdmin =
    role === "ADMIN";

  const isWarehouse =
    role === "EMPLOYEE";

  const isLivestreamer =
    role ===
    "LIVESTREAMER";

  // =========================
  // RESPONSIVE
  // =========================

  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        "(max-width: 768px)"
      );

    const handleScreenChange =
      (event) => {
        const mobile =
          event.matches;

        setIsMobile(
          mobile
        );

        // Mobile mặc định đóng
        // Desktop mặc định mở
        setSidebarOpen(
          !mobile
        );
      };

    setIsMobile(
      mediaQuery.matches
    );

    setSidebarOpen(
      !mediaQuery.matches
    );

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
  // KHÓA SCROLL MOBILE
  // =========================

  useEffect(() => {
    if (
      isMobile &&
      sidebarOpen
    ) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow =
        "";
    }

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [
    isMobile,
    sidebarOpen,
  ]);

  // =========================
  // LIVESTREAMER:
  // CHỈ ĐƯỢC Ở TRANG AFFILIATE
  // =========================

  useEffect(() => {
    if (
      isLivestreamer &&
      activePage !==
        "affiliate"
    ) {
      setActivePage(
        "affiliate"
      );
    }
  }, [
    isLivestreamer,
    activePage,
    setActivePage,
  ]);

  // =========================
  // MENU + QUYỀN
  // =========================

  const menus = [
    {
      key:
        "overall",

      label:
        "Tổng quan",

      roles: [
        "ADMIN",
      ],
    },

    {
      key:
        "products",

      label:
        "Sản phẩm & biến thể",

      roles: [
        "ADMIN",
        "EMPLOYEE",
      ],
    },

    {
      key:
        "barcode",

      label:
        "Mã vạch & tem",

      roles: [
        "ADMIN",
        "EMPLOYEE",
      ],
    },

    {
      key:
        "nhacungcap",

      label:
        "Nhà cung cấp",

      roles: [
        "ADMIN",
      ],
    },

    {
      key:
        "nhapkho",

      label:
        "Nhập kho",

      roles: [
        "ADMIN",
      ],
    },

    {
      key:
        "no",

      label:
        "Công nợ nhà cung cấp",

      roles: [
        "ADMIN",
      ],
    },

    {
      key:
        "baogia",

      label:
        "Báo Giá",

      roles: [
        "ADMIN",
      ],
    },

    {
      key:
        "xuatkho",

      label:
        "Xuất kho",

      roles: [
        "ADMIN",
        "EMPLOYEE",
      ],
    },

    {
      key:
        "loss",

      label:
        "Thất Thoát",

      roles: [
        "ADMIN",
      ],
    },

    {
      key:
        "cashflow",

      label:
        "Thu - Chi",

      roles: [
        "ADMIN",
      ],
    },

    {
      key:
        "report",

      label:
        "Báo cáo",

      roles: [
        "ADMIN",
      ],
    },

    {
      key:
        "affiliate",

      label:
        "Hoa hồng đơn hàng",

      roles: [
        "ADMIN",
        "LIVESTREAMER",
      ],
    },

    {
      key:
        "users",

      label:
        "Quản lý nhân viên",

      roles: [
        "ADMIN",
      ],
    },
  ];

  const visibleMenus =
    menus.filter(
      (item) =>
        item.roles.includes(
          role
        )
    );

  // =========================
  // CHUYỂN TRANG
  // =========================

  const handleChangePage =
    (page) => {
      /*
       * Chặn thêm một lớp ở frontend.
       * Livestreamer tuyệt đối không chuyển
       * sang trang khác affiliate.
       */
      if (
        isLivestreamer &&
        page !==
          "affiliate"
      ) {
        setActivePage(
          "affiliate"
        );

        return;
      }

      console.log(
        "Chuyển sang:",
        page
      );

      setActivePage(
        page
      );

      if (
        isMobile
      ) {
        setSidebarOpen(
          false
        );
      }
    };

  return (
    <>
      {/* =============================
          NÚT ☰ MOBILE
      ============================== */}

      {isMobile &&
        !sidebarOpen && (
          <button
            type="button"
            className="nx-mobile-menu-button"
            onClick={() =>
              setSidebarOpen(
                true
              )
            }
            aria-label="Mở menu"
          >
            ☰
          </button>
        )}

      {/* =============================
          OVERLAY MOBILE
      ============================== */}

      {isMobile &&
        sidebarOpen && (
          <div
            className="nx-sidebar-overlay"
            onClick={() =>
              setSidebarOpen(
                false
              )
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
        {/* HEADER MOBILE */}

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
                {isLivestreamer
                  ? "Nhân viên livestream"
                  : isWarehouse
                    ? "Nhân viên kho"
                    : isAdmin
                      ? "Quản trị viên"
                      : "Hệ thống quản lý nội bộ"}
              </span>
            </div>
          </div>
        )}

        {/* NÚT ĐÓNG */}

        <button
          type="button"
          className="nx-sidebar-toggle"
          onClick={() =>
            setSidebarOpen(
              false
            )
          }
          aria-label={
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

        <nav className="nx-sidebar-menu">
          {visibleMenus.map(
            (item) => (
              <button
                key={
                  item.key
                }
                type="button"
                className={[
                  "nx-sidebar-menu-item",

                  activePage ===
                  item.key
                    ? "active"
                    : "",
                ].join(" ")}
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

      {/* =============================
          NÚT MỞ DESKTOP
      ============================== */}

      {!isMobile &&
        !sidebarOpen && (
          <button
            type="button"
            className="nx-sidebar-desktop-open"
            onClick={() =>
              setSidebarOpen(
                true
              )
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
