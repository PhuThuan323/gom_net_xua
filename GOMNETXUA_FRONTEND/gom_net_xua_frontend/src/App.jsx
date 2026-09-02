import {
  useEffect,
  useState,
} from "react";

import Sidebar from "./Components/SideBar";
import TopBar from "./Components/TopBar";
import AffiliateCommission from "./Pages/AffiliateCommission";
import Auth from "./Pages/Auth";
import UserManagement from "./Pages/userMana";
import ProductManagement from "./Pages/TongQuan";
import Tem from "./Pages/Tem";
import NhapKho from "./Pages/NhapKho";
import NhaCungCap from "./Pages/NhaCungCap";
import NoNhaCungCap from "./Pages/Debt";
import BaoGia from "./Pages/Invoice";
import Export from "./Pages/Export";
import Loss from "./Pages/Loss";
import CashFlow from "./Pages/CashFlow";
import Overall from "./Pages/Overall";
import Report from "./Pages/Reports2";

import "./App.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

/* =========================================================
   AVATAR
========================================================= */

const getAvatarUrl = (
  avatarUrl
) => {
  if (!avatarUrl) {
    return "";
  }

  if (
    avatarUrl.startsWith(
      "http://"
    ) ||
    avatarUrl.startsWith(
      "https://"
    )
  ) {
    return avatarUrl;
  }

  return `${API_URL}${avatarUrl}`;
};

/* =========================================================
   APP
========================================================= */

function App() {
  const [
    activePage,
    setActivePage,
  ] = useState(
    "overall"
  );

  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);

  const [
    checkingAuth,
    setCheckingAuth,
  ] = useState(true);

  /* =======================================================
     CHECK LOGIN
  ======================================================= */

  useEffect(() => {
    const checkLogin =
      async () => {
        const token =
          localStorage.getItem(
            "nx_token"
          );

        if (!token) {
          setCheckingAuth(
            false
          );

          return;
        }

        try {
          const response =
            await fetch(
              `${API_URL}/users/me`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
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
              "API /users/me không trả JSON"
            );
          }

          if (
            !response.ok ||
            data.success === false
          ) {
            throw new Error(
              data.message ||
                "Phiên đăng nhập không hợp lệ"
            );
          }

          setCurrentUser(
            data.data
          );

          localStorage.setItem(
            "nx_user",
            JSON.stringify(
              data.data
            )
          );
        } catch (error) {
          console.error(
            "CHECK AUTH:",
            error
          );

          localStorage.removeItem(
            "nx_token"
          );

          localStorage.removeItem(
            "nx_user"
          );

          setCurrentUser(
            null
          );
        } finally {
          setCheckingAuth(
            false
          );
        }
      };

    checkLogin();
  }, []);

  /* =======================================================
     LOGIN SUCCESS
  ======================================================= */

  const handleAuthenticated = (user) => {
  setCurrentUser(user);

  if (
    user.role === "ADMIN"
  ) {
    setActivePage(
      "overall"
    );
  } else {
    setActivePage(
      "products"
    );
  }
};

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout =
    () => {
      const ok =
        window.confirm(
          "Bạn có chắc muốn đăng xuất?"
        );

      if (!ok) {
        return;
      }

      localStorage.removeItem(
        "nx_token"
      );

      localStorage.removeItem(
        "nx_user"
      );

      setCurrentUser(
        null
      );
      if (
  data.data.role !==
  "ADMIN"
) {
  setActivePage(
    "products"
  );
}

localStorage.setItem(
  "nx_user",
  JSON.stringify(
    data.data
  )
);

      setActivePage(
        "overall"
      );
    };

  /* =======================================================
     CHECKING AUTH
  ======================================================= */

  if (checkingAuth) {
    return (
      <div className="app-auth-loading">
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  /* =======================================================
     NOT LOGIN
  ======================================================= */

  if (!currentUser) {
    return (
      <Auth
        onAuthenticated={
          handleAuthenticated
        }
      />
    );
  }

  /* =======================================================
     LOGIN SUCCESS
  ======================================================= */

  return (
    <div className="app">

      <TopBar
        employeeName={
          currentUser.full_name ||
          "Nhân viên"
        }

        employeeRole={
          currentUser.role ===
          "ADMIN"
            ? "Quản trị viên"
            : currentUser.position ||
              "Nhân viên"
        }

        avatarUrl={
          getAvatarUrl(
            currentUser.avatar_url
          )
        }

        onLogout={
          handleLogout
        }
      />

      <Sidebar
        activePage={
          activePage
        }

        setActivePage={
          setActivePage
        }

        currentUser={
          currentUser
        }
      />

      <main className="main-content">

        {activePage ===
          "overall" &&
          currentUser.role ===
            "ADMIN" && (
            <Overall />
          )}

        {activePage === "products" && (
          <ProductManagement
          currentUser={currentUser}
          />
        )}

        {activePage ===
          "barcode" && (
          <Tem />
        )}

        {activePage ===
          "nhapkho" &&
          currentUser.role ===
            "ADMIN" && (
            <NhapKho />
          )}
        {activePage ===
          "nhacungcap" &&
          currentUser.role ===
            "ADMIN" && (
            <NhaCungCap />
          )}
        {activePage ===
          "no" &&
          currentUser.role ===
            "ADMIN" && (
            <NoNhaCungCap />
          )}

      
        {activePage ===
          "baogia" &&
          currentUser.role ===
            "ADMIN" && (
            <BaoGia />
          )}

        {activePage === "xuatkho" && (
          <Export
          currentUser={currentUser}
          />
)}

        {activePage ===
          "loss" &&
          currentUser.role ===
            "ADMIN" && (
            <Loss />
          )}

        {activePage ===
          "cashflow" &&
          currentUser.role ===
            "ADMIN" && (
            <CashFlow />
          )}
          {activePage ===
          "report" &&
          currentUser.role ===
            "ADMIN" && (
            <Report />
          )}
        
        {activePage === "affiliate" && (
          <AffiliateCommission
          currentUser={currentUser}
          />
        )}

        {activePage ===
          "users" &&
          currentUser.role ===
            "ADMIN" && (
            <UserManagement />
          )}

      </main>

    </div>
  );
}

export default App;