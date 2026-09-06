import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./AffiliateCommission.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

/* =========================================================
   HELPERS
========================================================= */

const numberValue = (
  value
) => {

  const number =
    Number(
      value || 0
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;
};

const money = (
  value
) =>
  new Intl.NumberFormat(
    "vi-VN",
    {
      maximumFractionDigits:
        0,
    }
  ).format(
    numberValue(value)
  ) + " đ";

const normalize = (
  value
) =>
  String(
    value || ""
  )
    .trim()
    .toLowerCase();

const isSuccess = (
  value
) =>
  normalize(value)
    .includes(
      "thành công"
    );

const isCancelled = (
  value
) => {

  const text =
    normalize(value);

  return (
    text.includes(
      "bom"
    ) ||
    text.includes(
      "hủy"
    ) ||
    text.includes(
      "huỷ"
    )
  );
};

const getCurrentMonth =
  () => {

    const date =
      new Date();

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    )}`;
  };

const displayDate = (
  value
) => {

  if (!value) {
    return "-";
  }

  const date =
    new Date(
      String(value)
        .replace(
          " ",
          "T"
        )
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date
    .toLocaleDateString(
      "vi-VN"
    );
};

/* =========================================================
   COMPONENT
========================================================= */


export default function AffiliateCommission({
  currentUser,
}) {
  const isAdmin =
    currentUser?.role ===
    "ADMIN";

  const isLivestreamer =
    currentUser?.role ===
    "LIVESTREAMER";

  const assignedAffiliate =
    String(
      currentUser?.affiliate_code ||
        ""
    ).trim();

  const [
    selectedMonth,
    setSelectedMonth
  ] =
    useState(
      getCurrentMonth()
    );

  const [
    selectedAffiliate,
    setSelectedAffiliate,
  ] =
    useState(
      currentUser?.role ===
        "LIVESTREAMER"
        ? String(
            currentUser?.affiliate_code ||
              ""
          ).trim()
        : "ALL"
    );

  const [
    selectedStatus,
    setSelectedStatus,
  ] =
    useState(
      "ALL"
    );

  const [
    affiliateOptions,
    setAffiliateOptions,
  ] =
    useState([]);

  const [
    orders,
    setOrders,
  ] =
    useState([]);

  const [
    summary,
    setSummary,
  ] =
    useState({
      tong_don: 0,

      tong_gia_tri_hang:
        0,

      so_du_dau_ky:
        0,

      hoa_hong_phat_sinh:
        0,

      hoa_hong_thu_hoi:
        0,

      hoa_hong_thuc_nhan:
        0,

      so_don_thanh_cong:
        0,

      so_don_bom:
        0,

      ty_le_bom:
        0,

      so_du_cuoi_ky:
        0,
    });

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =====================================================
     ĐỒNG BỘ AFFILIATE ĐƯỢC GẮN CHO LIVESTREAMER
  ===================================================== */

  useEffect(() => {
    if (
      isLivestreamer
    ) {
      setSelectedAffiliate(
        assignedAffiliate
      );
    }
  }, [
    isLivestreamer,
    assignedAffiliate,
  ]);

  /* =====================================================
     LOAD AFFILIATE
  ===================================================== */

  useEffect(() => {
    const load =
      async () => {
        try {
          const token =
            localStorage.getItem(
              "nx_token"
            );

          if (!token) {
            return;
          }

          const response =
            await fetch(
              `${API_URL}/affiliate-commissions/affiliates`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                  Accept:
                    "application/json",
                },
                cache:
                  "no-store",
              }
            );

          const raw =
            await response.text();

          let result = {};

          try {
            result =
              raw
                ? JSON.parse(
                    raw
                  )
                : {};
          } catch {
            throw new Error(
              "API Affiliate không trả JSON"
            );
          }

          if (
            !response.ok ||
            result.success ===
              false
          ) {
            throw new Error(
              result.message ||
                "Không tải được danh sách Affiliate"
            );
          }

          const list =
            Array.isArray(
              result.data
            )
              ? result.data
              : [];

          setAffiliateOptions(
            list
          );

          /*
           * ADMIN:
           * - API trả toàn bộ Affiliate từ Sheet.
           *
           * LIVESTREAMER:
           * - Backend phải chỉ trả Affiliate đã gắn.
           * - Không cho user thấy danh sách của người khác.
           */
          if (
            isLivestreamer &&
            assignedAffiliate
          ) {
            setSelectedAffiliate(
              assignedAffiliate
            );
          }
        } catch (error) {
          console.error(
            "LOAD AFFILIATE:",
            error
          );

          setError(
            error instanceof Error
              ? error.message
              : "Không tải được danh sách Affiliate"
          );
        }
      };

    load();
  }, [
    isLivestreamer,
    assignedAffiliate,
  ]);

  /* =====================================================
     LOAD REPORT
  ===================================================== */

  const loadReport =
    async () => {

      try {

        setLoading(true);
        setError("");

        const token =
          localStorage.getItem(
            "nx_token"
          );

        if (!token) {
          throw new Error(
            "Phiên đăng nhập không hợp lệ"
          );
        }

        if (
          isLivestreamer &&
          !assignedAffiliate
        ) {
          throw new Error(
            "Tài khoản chưa được quản trị viên gắn với Affiliate."
          );
        }

        const effectiveAffiliate =
          isLivestreamer
            ? assignedAffiliate
            : selectedAffiliate;

        const query =
          new URLSearchParams({
            month:
              selectedMonth,

            affiliate:
              effectiveAffiliate,

            status:
              selectedStatus,

            _ts:
              Date.now()
                .toString(),
          });

        const response =
          await fetch(
            `${API_URL}/affiliate-commissions/dashboard?${query.toString()}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,

                Accept:
                  "application/json",
              },

              cache:
                "no-store",
            }
          );

        const raw =
          await response.text();

        let result;

        try {

          result =
            JSON.parse(
              raw
            );

        } catch {

          console.error(
            "REPORT RAW:",
            raw
          );

          throw new Error(
            "API báo cáo không trả JSON"
          );
        }

        if (
          !response.ok ||
          result.success ===
            false
        ) {

          throw new Error(
            result.message ||
            "Không tải được báo cáo"
          );
        }

        const data =
          result.data || {};

        const reportSummary =
          data.summary ||
          {};

        setSummary({

          tong_don:
            numberValue(
              reportSummary
                .tong_don
            ),

          tong_gia_tri_hang:
            numberValue(
              reportSummary
                .tong_gia_tri_hang
            ),

          so_du_dau_ky:
            numberValue(
              reportSummary
                .so_du_dau_ky
            ),

          hoa_hong_phat_sinh:
            numberValue(
              reportSummary
                .hoa_hong_phat_sinh
            ),

          hoa_hong_thu_hoi:
            numberValue(
              reportSummary
                .hoa_hong_thu_hoi
            ),

          hoa_hong_thuc_nhan:
            numberValue(
              reportSummary
                .hoa_hong_thuc_nhan
            ),

          so_don_thanh_cong:
            numberValue(
              reportSummary
                .so_don_thanh_cong
            ),

          so_don_bom:
            numberValue(
              reportSummary
                .so_don_bom
            ),

          ty_le_bom:
            numberValue(
              reportSummary
                .ty_le_bom
            ),

          so_du_cuoi_ky:
            numberValue(
              reportSummary
                .so_du_cuoi_ky
            ),
        });

        setOrders(
          Array.isArray(
            data.orders
          )
            ? data.orders
            : []
        );

      } catch (error) {

        console.error(
          "LOAD REPORT:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Không tải được báo cáo"
        );

      } finally {

        setLoading(
          false
        );
      }
    };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {

    loadReport();

    // eslint-disable-next-line
  }, []);

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredOrders =
    useMemo(() => {

      const keyword =
        normalize(
          search
        );

      if (!keyword) {
        return orders;
      }

      return orders.filter(
        (item) => {

          const content =
            [
              item.ma_don,
              item.ma_affiliate,
              item.trang_thai,
            ]
              .join(" ")
              .toLowerCase();

          return content
            .includes(
              keyword
            );
        }
      );

    }, [
      orders,
      search,
    ]);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="affiliate-v4">

      {/* HEADER */}

      <div className="affiliate-v4-header">

        <div>

          <span>
            AFFILIATE COMMISSION
          </span>

          <h1>
            {isLivestreamer
              ? "Hoa hồng của tôi"
              : "Quản trị hoa hồng"}
          </h1>

          <p>
            {isLivestreamer
              ? "Theo dõi đơn hàng và hoa hồng Affiliate của tài khoản đang đăng nhập."
              : "Báo cáo và đối soát Affiliate từ Google Sheet"}
          </p>

        </div>
        {isAdmin && (
            <a
            className="affiliate-v4-connected"
            href="https://docs.google.com/spreadsheets/d/1RZ4lmGfPvLM09ilfgrXVDd7x9-jEvgbmhEjeIlBkX2Y/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            title="Mở Google Sheet quản trị hoa hồng"
            >
            ● Google Sheet đang kết nối
        </a>
        )}
        
      </div>

      {/* FILTER */}

      <div className="affiliate-v4-filter">

        <div>

          <label>
            Tháng báo cáo
          </label>

          <input
            type="month"
            value={
              selectedMonth
            }
            onChange={(e) =>
              setSelectedMonth(
                e.target.value
              )
            }
          />

        </div>

        <div>

          <label>
            Affiliate
          </label>

          {isLivestreamer ? (
            <select
              value={
                assignedAffiliate
              }
              disabled
            >
              {affiliateOptions.length >
              0 ? (
                affiliateOptions.map(
                  (
                    item,
                    index
                  ) => (
                    <option
                      key={`${item.ma_affiliate}-${index}`}
                      value={
                        item.ma_affiliate
                      }
                    >
                      {
                        item.ma_affiliate
                      }
                      {
                        item.ten_affiliate
                          ? ` - ${item.ten_affiliate}`
                          : ""
                      }
                    </option>
                  )
                )
              ) : (
                <option
                  value={
                    assignedAffiliate
                  }
                >
                  {assignedAffiliate ||
                    "-- Chưa được gắn Affiliate --"}
                </option>
              )}
            </select>
          ) : (
            <select
              value={
                selectedAffiliate
              }
              onChange={(e) =>
                setSelectedAffiliate(
                  e.target.value
                )
              }
            >
              <option value="ALL">
                Tất cả Affiliate
              </option>

              {affiliateOptions.map(
                (
                  item,
                  index
                ) => (
                  <option
                    key={`${item.ma_affiliate}-${index}`}
                    value={
                      item.ma_affiliate
                    }
                  >
                    {
                      item.ma_affiliate
                    }

                    {
                      item.ten_affiliate
                        ? ` - ${item.ten_affiliate}`
                        : ""
                    }
                  </option>
                )
              )}
            </select>
          )}

        </div>

        <div>

          <label>
            Trạng thái
          </label>

          <select
            value={
              selectedStatus
            }
            onChange={(e) =>
              setSelectedStatus(
                e.target.value
              )
            }
          >
            <option value="ALL">
              Tất cả
            </option>

            <option value="SUCCESS">
              Giao thành công
            </option>

            <option value="CANCELLED">
              Bom / Hủy
            </option>

          </select>

        </div>

        <button
          type="button"
          onClick={
            loadReport
          }
          disabled={
            loading
          }
        >
          {loading
            ? "Đang tải..."
            : "Xem báo cáo"}
        </button>

      </div>

      {/* ERROR */}

      {error && (

        <div className="affiliate-v4-error">
          {error}
        </div>

      )}

      {/* KPI */}

      <div className="affiliate-v4-kpi affiliate-v4-kpi-seven">

        <Kpi
          title="Số dư đầu kỳ"
          value={money(
            summary
              .so_du_dau_ky
          )}
        />

        <Kpi
          title="Hoa hồng phát sinh"
          value={money(
            summary
              .hoa_hong_phat_sinh
          )}
          type="orange"
        />

        <Kpi
          title="Hoa hồng thu hồi"
          value={money(
            summary
              .hoa_hong_thu_hoi
          )}
          type="red"
        />

        <Kpi
          title="Hoa hồng thực nhận"
          value={money(
            summary
              .hoa_hong_thuc_nhan
          )}
          type="brown"
        />

        <Kpi
          title="Đơn thành công"
          value={
            summary
              .so_don_thanh_cong
          }
          type="green"
        />

        <Kpi
          title="Hoàn / Bom"
          value={
            summary
              .so_don_bom
          }
          type="red"
          note={`${(
            numberValue(
              summary
                .ty_le_bom
            ) * 100
          ).toFixed(2)}%`}
        />

        <Kpi
          title="Số dư cuối kỳ"
          value={money(
            summary
              .so_du_cuoi_ky
          )}
          type={
            summary
              .so_du_cuoi_ky >= 0
              ? "final"
              : "negative"
          }
        />

      </div>

      {/* DETAIL */}

      <div className="affiliate-v4-orders">

        <div className="affiliate-v4-orders-head">

          <div>

            <h2>
              Chi tiết báo cáo
            </h2>

            <p>
              {
                filteredOrders.length
              }{" "}
              đơn
            </p>

          </div>

          <input
            type="text"
            placeholder={isLivestreamer ? "Tìm mã đơn..." : "Tìm mã đơn, Affiliate..."}
            value={
              search
            }
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        <div className="affiliate-v4-table-wrap">

          <table>

            <thead>

              <tr>

                <th>
                  Ngày bán
                </th>

                <th>
                  Mã đơn
                </th>

                <th>
                  Affiliate
                </th>

                <th>
                  Giá trị hàng
                </th>

                <th>
                  % HH
                </th>

                <th>
                  Tiền HH
                </th>

                <th>
                  Trạng thái
                </th>

                <th>
                  Ngày giao
                </th>

                <th>
                  Ngày hủy
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredOrders.length ===
              0 ? (

                <tr>

                  <td
                    colSpan="9"
                    className="affiliate-empty"
                  >
                    Không có đơn hàng
                    trong kỳ báo cáo này.
                  </td>

                </tr>

              ) : (

                filteredOrders.map(
                  (
                    item,
                    index
                  ) => (

                    <tr
                      key={`${item.ma_don}-${item.ma_affiliate}-${index}`}
                    >

                      <td>
                        {displayDate(
                          item.ngay_ban
                        )}
                      </td>

                      <td className="order-code">
                        {
                          item.ma_don
                        }
                      </td>

                      <td>
                        {
                          item.ma_affiliate
                        }
                      </td>

                      <td>
                        {money(
                          item.gia_tri_hang
                        )}
                      </td>

                      <td>
                        {(
                          numberValue(
                            item
                              .hoa_hong_ap_dung
                          ) *
                          100
                        ).toLocaleString(
                          "vi-VN"
                        )}
                        %
                      </td>

                      <td>
                        {money(
                          item
                            .tien_hoa_hong
                        )}
                      </td>

                      <td>

                        <span
                          className={
                            isCancelled(
                              item.trang_thai
                            )
                              ? "status cancelled"
                              : isSuccess(
                                  item.trang_thai
                                )
                              ? "status success"
                              : "status"
                          }
                        >
                          {
                            item.trang_thai
                          }
                        </span>

                      </td>

                      <td>
                        {displayDate(
                          item
                            .ngay_giao_thanh_cong
                        )}
                      </td>

                      <td>
                        {displayDate(
                          item.ngay_huy
                        )}
                      </td>

                    </tr>

                  )
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   KPI
========================================================= */

function Kpi({
  title,
  value,
  type = "",
  note = "",
}) {

  return (
    <div
      className={`affiliate-v4-kpi-card ${type}`}
    >

      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

      {note && (
        <small>
          {note}
        </small>
      )}

    </div>
  );
}