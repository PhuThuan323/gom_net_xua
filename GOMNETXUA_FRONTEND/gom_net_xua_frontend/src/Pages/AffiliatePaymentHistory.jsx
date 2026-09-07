import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./AffiliatePaymentHistory.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

const getCurrentMonth = () => {
  const now =
    new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(
    2,
    "0"
  )}`;
};

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
    numberValue(
      value
    )
  ) + " đ";

const normalize = (
  value
) =>
  String(
    value || ""
  )
    .trim()
    .toUpperCase();

const parseDate = (
  value
) => {
  if (!value) {
    return null;
  }

  const text =
    String(
      value
    ).trim();

  /*
   * Apps Script đang trả:
   * yyyy-MM-dd HH:mm:ss
   */
  const date =
    new Date(
      text.replace(
        " ",
        "T"
      )
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
};

const formatDateTime = (
  value
) => {
  const date =
    parseDate(
      value
    );

  if (!date) {
    return "—";
  }

  return date.toLocaleString(
    "vi-VN",
    {
      hour12:
        false,
    }
  );
};

const monthOf = (
  value
) => {
  const date =
    parseDate(
      value
    );

  if (!date) {
    return "";
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(
    2,
    "0"
  )}`;
};

export default function AffiliatePaymentHistory({
  currentUser,
  affiliateOptions = [],
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
    setSelectedMonth,
  ] =
    useState(
      getCurrentMonth()
    );

  const [
    selectedAffiliate,
    setSelectedAffiliate,
  ] =
    useState(
      isLivestreamer
        ? assignedAffiliate
        : "ALL"
    );

  const [
    payments,
    setPayments,
  ] =
    useState([]);

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

  const loadPayments =
    async () => {
      try {
        setLoading(
          true
        );

        setError(
          ""
        );

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

        /*
         * Frontend cũng ép scope đúng role.
         *
         * LƯU Ý:
         * Backend vẫn PHẢI kiểm tra lại.
         * Không được chỉ dựa vào query frontend.
         */
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

            _ts:
              Date.now()
                .toString(),
          });

        const response =
          await fetch(
            `${API_URL}/affiliate-commissions/payments?${query.toString()}`,
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

        let result =
          {};

        try {
          result =
            raw
              ? JSON.parse(
                  raw
                )
              : {};
        } catch {
          console.error(
            "PAYMENT RAW:",
            raw
          );

          throw new Error(
            "API lịch sử thanh toán không trả JSON"
          );
        }

        if (
          !response.ok ||
          result.success ===
            false
        ) {
          throw new Error(
            result.message ||
              "Không tải được lịch sử thanh toán"
          );
        }

        setPayments(
          Array.isArray(
            result.data
          )
            ? result.data
            : []
        );
      } catch (
        error
      ) {
        console.error(
          "LOAD PAYMENTS:",
          error
        );

        setPayments(
          []
        );

        setError(
          error instanceof Error
            ? error.message
            : "Không tải được lịch sử thanh toán"
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  useEffect(() => {
    loadPayments();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Lọc thêm ở frontend để giao diện luôn đúng,
   * kể cả backend trả toàn bộ dữ liệu.
   *
   * Đây KHÔNG thay thế phân quyền backend.
   */
  const filteredPayments =
    useMemo(() => {
      const expectedAffiliate =
        isLivestreamer
          ? normalize(
              assignedAffiliate
            )
          : normalize(
              selectedAffiliate
            );

      return payments
        .filter(
          (item) => {
            if (
              selectedMonth
            ) {
              const itemMonth =
                monthOf(
                  item
                    .thoi_gian_thanh_toan ||
                    item
                      .ngay_lap_phieu
                );

              if (
                itemMonth !==
                selectedMonth
              ) {
                return false;
              }
            }

            if (
              expectedAffiliate &&
              expectedAffiliate !==
                "ALL" &&
              normalize(
                item
                  .ma_affiliate
              ) !==
                expectedAffiliate
            ) {
              return false;
            }

            return true;
          }
        )
        .sort(
          (
            a,
            b
          ) => {
            const aDate =
              parseDate(
                a
                  .thoi_gian_thanh_toan ||
                  a
                    .ngay_lap_phieu
              );

            const bDate =
              parseDate(
                b
                  .thoi_gian_thanh_toan ||
                  b
                    .ngay_lap_phieu
              );

            return (
              (bDate?.getTime() ||
                0) -
              (aDate?.getTime() ||
                0)
            );
          }
        );
    }, [
      payments,
      selectedMonth,
      selectedAffiliate,
      isLivestreamer,
      assignedAffiliate,
    ]);

  const totalPaid =
    useMemo(
      () =>
        filteredPayments.reduce(
          (
            sum,
            item
          ) =>
            sum +
            numberValue(
              item.so_tien
            ),
          0
        ),
      [
        filteredPayments,
      ]
    );

  const affiliateLabel =
    (
      code
    ) => {
      const found =
        affiliateOptions.find(
          (item) =>
            normalize(
              item
                .ma_affiliate
            ) ===
            normalize(
              code
            )
        );

      if (!found) {
        return code ||
          "—";
      }

      return [
        found.ma_affiliate,
        found.ten_affiliate,
      ]
        .filter(
          Boolean
        )
        .join(
          " - "
        );
    };

  return (
    <section className="affiliate-payment-history">
      <div className="affiliate-payment-history-head">
        <div>
          <span className="affiliate-payment-eyebrow">
            PAYMENT HISTORY
          </span>

          <h2>
            Lịch sử thanh toán hoa hồng
          </h2>

          <p>
            {isLivestreamer
              ? "Chỉ hiển thị các khoản thanh toán của Affiliate được gắn với tài khoản của bạn."
              : "Theo dõi toàn bộ lịch sử thanh toán hoa hồng lấy trực tiếp từ Google Sheet."}
          </p>
        </div>

        <div className="affiliate-payment-summary">
          <div>
            <span>
              Số giao dịch
            </span>

            <strong>
              {
                filteredPayments.length
              }
            </strong>
          </div>

          <div>
            <span>
              Tổng đã thanh toán
            </span>

            <strong>
              {money(
                totalPaid
              )}
            </strong>
          </div>
        </div>
      </div>

      <div className="affiliate-payment-filter">
        <div>
          <label>
            Tháng thanh toán
          </label>

          <input
            type="month"
            value={
              selectedMonth
            }
            onChange={(event) =>
              setSelectedMonth(
                event.target.value
              )
            }
          />
        </div>

        <div>
          <label>
            Affiliate
          </label>

          {isAdmin ? (
            <select
              value={
                selectedAffiliate
              }
              onChange={(event) =>
                setSelectedAffiliate(
                  event.target.value
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
          ) : (
            <select
              value={
                assignedAffiliate
              }
              disabled
            >
              <option
                value={
                  assignedAffiliate
                }
              >
                {affiliateLabel(
                  assignedAffiliate
                )}
              </option>
            </select>
          )}
        </div>

        <button
          type="button"
          onClick={
            loadPayments
          }
          disabled={
            loading
          }
        >
          {loading
            ? "Đang tải..."
            : "Xem lịch sử"}
        </button>
      </div>

      {error && (
        <div className="affiliate-payment-error">
          {error}
        </div>
      )}

      <div className="affiliate-payment-table-wrap">
        <table className="affiliate-payment-table">
          <thead>
            <tr>
              <th>
                Ngày lập phiếu
              </th>

              <th>
                Affiliate
              </th>

              <th>
                Số tiền
              </th>

              <th>
                Phương thức
              </th>

              <th>
                Mã giao dịch
              </th>

              <th>
                Người thực hiện
              </th>

              <th>
                Trạng thái
              </th>

              <th>
                Thời gian thanh toán
              </th>

              <th>
                Ghi chú
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="9"
                  className="affiliate-payment-empty"
                >
                  Đang tải lịch sử thanh toán...
                </td>
              </tr>
            ) : filteredPayments.length ===
              0 ? (
              <tr>
                <td
                  colSpan="9"
                  className="affiliate-payment-empty"
                >
                  Không có lịch sử thanh toán trong bộ lọc này.
                </td>
              </tr>
            ) : (
              filteredPayments.map(
                (
                  item,
                  index
                ) => (
                  <tr
                    key={`${item.ma_affiliate}-${item.thoi_gian_thanh_toan}-${index}`}
                  >
                    <td>
                      {formatDateTime(
                        item
                          .ngay_lap_phieu
                      )}
                    </td>

                    <td>
                      <strong>
                        {
                          item.ma_affiliate
                        }
                      </strong>
                    </td>

                    <td className="affiliate-payment-money">
                      {money(
                        item.so_tien
                      )}
                    </td>

                    <td>
                      {
                        item.phuong_thuc ||
                        "—"
                      }
                    </td>

                    <td>
                      {
                        item.ma_giao_dich ||
                        "—"
                      }
                    </td>

                    <td>
                      {
                        item.nguoi_thuc_hien ||
                        "—"
                      }
                    </td>

                    <td>
                      <span
                        className={`affiliate-payment-status ${
                          String(
                            item.trang_thai ||
                              ""
                          )
                            .toLowerCase()
                            .includes(
                              "đã thanh toán"
                            )
                            ? "paid"
                            : ""
                        }`}
                      >
                        {
                          item.trang_thai ||
                          "—"
                        }
                      </span>
                    </td>

                    <td>
                      {formatDateTime(
                        item
                          .thoi_gian_thanh_toan
                      )}
                    </td>

                    <td>
                      {
                        item.ghi_chu ||
                        "—"
                      }
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
