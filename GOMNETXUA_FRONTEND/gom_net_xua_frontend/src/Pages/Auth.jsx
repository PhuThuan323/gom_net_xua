import {
  useEffect,
  useRef,
  useState,
} from "react";

import "../Components/Auth.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

const GOOGLE_CLIENT_ID =
  import.meta.env
    .VITE_GOOGLE_CLIENT_ID ||
  "";

/* =========================================================
   API
========================================================= */

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

          ...(options.headers ||
            {}),
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
    console.error(
      "AUTH API RESPONSE:",
      raw
    );

    throw new Error(
      "Server không trả về JSON"
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

/* =========================================================
   PAGE
========================================================= */

export default function Auth({
  onAuthenticated,
}) {
  const [
    mode,
    setMode,
  ] = useState(
    "login"
  );

  const [
    loginForm,
    setLoginForm,
  ] = useState({
    email: "",
    password: "",
  });

  const [
    registerForm,
    setRegisterForm,
  ] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    repeat_password: "",
  });

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const googleButtonRef =
    useRef(null);

  /* =======================================================
     SAVE LOGIN
  ======================================================= */

  const finishLogin = (
    result
  ) => {
    const token =
      result?.data?.token;

    const user =
      result?.data?.user;

    if (
      !token ||
      !user
    ) {
      throw new Error(
        "Dữ liệu đăng nhập không hợp lệ"
      );
    }

    localStorage.setItem(
      "nx_token",
      token
    );

    localStorage.setItem(
      "nx_user",
      JSON.stringify(
        user
      )
    );

    onAuthenticated?.(
      user
    );
  };

  /* =======================================================
     LOGIN
  ======================================================= */

  const handleLogin =
    async (event) => {
      event.preventDefault();

      setError("");
      setMessage("");

      if (
        !loginForm.email ||
        !loginForm.password
      ) {
        setError(
          "Vui lòng nhập email và mật khẩu."
        );

        return;
      }

      try {
        setLoading(true);

        const result =
          await api(
            "/users/login",
            {
              method:
                "POST",

              body:
                JSON.stringify(
                  loginForm
                ),
            }
          );

        finishLogin(
          result
        );
      } catch (error) {
        setError(
          error.message
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     REGISTER
  ======================================================= */

  const handleRegister =
    async (event) => {
      event.preventDefault();

      setError("");
      setMessage("");

      if (
        !registerForm.full_name ||
        !registerForm.email ||
        !registerForm.password
      ) {
        setError(
          "Vui lòng nhập đầy đủ họ tên, email và mật khẩu."
        );

        return;
      }

      if (
        registerForm.password
          .length < 8
      ) {
        setError(
          "Mật khẩu phải có ít nhất 8 ký tự."
        );

        return;
      }

      if (
        registerForm.password !==
        registerForm.repeat_password
      ) {
        setError(
          "Hai mật khẩu không giống nhau."
        );

        return;
      }

      try {
        setLoading(true);

        const result =
          await api(
            "/users/register",
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  full_name:
                    registerForm.full_name,

                  phone:
                    registerForm.phone,

                  email:
                    registerForm.email,

                  password:
                    registerForm.password,
                }),
            }
          );

        finishLogin(
          result
        );
      } catch (error) {
        setError(
          error.message
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     GOOGLE LOGIN
  ======================================================= */

  const handleGoogleCredential =
    async (
      credentialResponse
    ) => {
      try {
        setLoading(true);

        setError("");

        const result =
          await api(
            "/users/google-login",
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  credential:
                    credentialResponse
                      .credential,
                }),
            }
          );

        finishLogin(
          result
        );
      } catch (error) {
        setError(
          error.message
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (
      !GOOGLE_CLIENT_ID
    ) {
      return;
    }

    const initializeGoogle =
      () => {
        if (
          !window.google ||
          !googleButtonRef.current
        ) {
          return;
        }

        googleButtonRef.current.innerHTML =
          "";

        window.google.accounts.id.initialize({
          client_id:
            GOOGLE_CLIENT_ID,

          callback:
            handleGoogleCredential,

          auto_select:
            false,

          cancel_on_tap_outside:
            true,
        });

        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            theme:
              "outline",

            size:
              "large",

            width:
              410,

            text:
              mode ===
              "login"
                ? "signin_with"
                : "signup_with",

            shape:
              "rectangular",
          }
        );
      };

    if (
      window.google
    ) {
      initializeGoogle();

      return;
    }

    let script =
      document.querySelector(
        'script[data-google-identity="true"]'
      );

    if (!script) {
      script =
        document.createElement(
          "script"
        );

      script.src =
        "https://accounts.google.com/gsi/client";

      script.async =
        true;

      script.defer =
        true;

      script.dataset.googleIdentity =
        "true";

      script.onload =
        initializeGoogle;

      document.head.appendChild(
        script
      );
    } else {
      script.addEventListener(
        "load",
        initializeGoogle
      );
    }
  }, [
    mode,
  ]);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="nx-auth-page">

      <section className="nx-auth-card">

        {/* =================================================
            LEFT
        ================================================= */}

        <div className="nx-auth-left">

          <div className="nx-auth-brand">

            <div className="nx-auth-logo">
              NX
            </div>

            <div>
              <strong>
                GỐM SỨ ĐẶC SẢN NÉT XƯA
              </strong>

              <span>
                Hệ thống quản lý kho
              </span>
            </div>

          </div>

          <div className="nx-auth-form-container">

            {mode ===
            "login" ? (
              <>
                <h1>
                  Đăng nhập
                </h1>

                <p className="nx-auth-subtitle">
                  Chào mừng bạn quay lại hệ thống.
                </p>
              </>
            ) : (
              <>
                <h1>
                  Đăng ký ngay
                </h1>

                <p className="nx-auth-subtitle">
                  Tạo tài khoản nhân viên mới.
                </p>
              </>
            )}

            {/* GOOGLE */}

            <div className="nx-google-area">

              {GOOGLE_CLIENT_ID ? (
                <div
                  ref={
                    googleButtonRef
                  }
                  className="nx-google-render"
                />
              ) : (
                <div className="nx-google-disabled">
                  Chưa cấu hình Google Login
                </div>
              )}

            </div>

            <div className="nx-auth-divider">

              <span></span>

              <b>
                hoặc
              </b>

              <span></span>

            </div>

            {/* =============================================
                LOGIN FORM
            ============================================= */}

            {mode ===
            "login" && (
              <form
                onSubmit={
                  handleLogin
                }
              >

                <label>
                  Email
                </label>

                <input
                  type="email"

                  autoComplete="username"

                  placeholder="Email đăng nhập"

                  value={
                    loginForm.email
                  }

                  onChange={(e) =>
                    setLoginForm(
                      (old) => ({
                        ...old,

                        email:
                          e.target.value,
                      })
                    )
                  }
                />

                <div className="nx-password-heading">

                  <label>
                    Mật khẩu
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (old) =>
                          !old
                      )
                    }
                  >
                    {showPassword
                      ? "Ẩn"
                      : "Hiện"}
                  </button>

                </div>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }

                  autoComplete="current-password"

                  placeholder="Mật khẩu"

                  value={
                    loginForm.password
                  }

                  onChange={(e) =>
                    setLoginForm(
                      (old) => ({
                        ...old,

                        password:
                          e.target.value,
                      })
                    )
                  }
                />

                <div className="nx-login-options">

                  <label className="nx-remember">

                    <input
                      type="checkbox"
                    />

                    <span>
                      Ghi nhớ đăng nhập
                    </span>

                  </label>

                  <button
                    type="button"
                    className="nx-link-button"
                    onClick={() =>
                      alert(
                        "Quản trị viên có thể reset mật khẩu trong phần quản lý người dùng."
                      )
                    }
                  >
                    Quên mật khẩu?
                  </button>

                </div>

                {error && (
                  <div className="nx-auth-error">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="nx-auth-success">
                    {message}
                  </div>
                )}

                <button
                  className="nx-auth-submit"

                  type="submit"

                  disabled={
                    loading
                  }
                >
                  {loading
                    ? "Đang đăng nhập..."
                    : "Đăng nhập"}
                </button>

              </form>
            )}

            {/* =============================================
                REGISTER FORM
            ============================================= */}

            {mode ===
            "register" && (
              <form
                onSubmit={
                  handleRegister
                }
              >

                <label>
                  Họ và tên
                </label>

                <input
                  type="text"

                  placeholder="Họ tên nhân viên"

                  value={
                    registerForm.full_name
                  }

                  onChange={(e) =>
                    setRegisterForm(
                      (old) => ({
                        ...old,

                        full_name:
                          e.target.value,
                      })
                    )
                  }
                />

                <label>
                  Số điện thoại
                </label>

                <input
                  type="tel"

                  placeholder="Số điện thoại"

                  value={
                    registerForm.phone
                  }

                  onChange={(e) =>
                    setRegisterForm(
                      (old) => ({
                        ...old,

                        phone:
                          e.target.value,
                      })
                    )
                  }
                />

                <label>
                  Email
                </label>

                <input
                  type="email"

                  placeholder="Email"

                  autoComplete="email"

                  value={
                    registerForm.email
                  }

                  onChange={(e) =>
                    setRegisterForm(
                      (old) => ({
                        ...old,

                        email:
                          e.target.value,
                      })
                    )
                  }
                />

                <label>
                  Mật khẩu
                </label>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }

                  autoComplete="new-password"

                  placeholder="Tối thiểu 8 ký tự"

                  value={
                    registerForm.password
                  }

                  onChange={(e) =>
                    setRegisterForm(
                      (old) => ({
                        ...old,

                        password:
                          e.target.value,
                      })
                    )
                  }
                />

                <label>
                  Nhập lại mật khẩu
                </label>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }

                  autoComplete="new-password"

                  placeholder="Nhập lại mật khẩu"

                  value={
                    registerForm.repeat_password
                  }

                  onChange={(e) =>
                    setRegisterForm(
                      (old) => ({
                        ...old,

                        repeat_password:
                          e.target.value,
                      })
                    )
                  }
                />

                <label className="nx-show-password">

                  <input
                    type="checkbox"

                    checked={
                      showPassword
                    }

                    onChange={(e) =>
                      setShowPassword(
                        e.target.checked
                      )
                    }
                  />

                  <span>
                    Hiển thị mật khẩu
                  </span>

                </label>

                {error && (
                  <div className="nx-auth-error">
                    {error}
                  </div>
                )}

                <button
                  className="nx-auth-submit"

                  type="submit"

                  disabled={
                    loading
                  }
                >
                  {loading
                    ? "Đang tạo tài khoản..."
                    : "Đăng ký"}
                </button>

              </form>
            )}

            <div className="nx-auth-switch">

              {mode ===
              "login" ? (
                <>
                  Chưa có tài khoản?

                  <button
                    type="button"

                    onClick={() => {
                      setError("");

                      setMode(
                        "register"
                      );
                    }}
                  >
                    Đăng ký
                  </button>
                </>
              ) : (
                <>
                  Đã có tài khoản?

                  <button
                    type="button"

                    onClick={() => {
                      setError("");

                      setMode(
                        "login"
                      );
                    }}
                  >
                    Đăng nhập
                  </button>
                </>
              )}

            </div>

          </div>

        </div>

        {/* =================================================
            RIGHT IMAGE
        ================================================= */}

        <div className="nx-auth-cover">

          <div className="nx-auth-cover-overlay"></div>

          <div className="nx-auth-cover-content">

            <div className="nx-auth-cover-badge">
              NX ERP
            </div>

            <h2>
              Quản lý kho dễ dàng,
              <br />
              dữ liệu rõ ràng hơn.
            </h2>

            <p>
              Quản lý nhập – xuất – tồn,
              công nợ, thu chi và vận hành
              trên một hệ thống thống nhất.
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}