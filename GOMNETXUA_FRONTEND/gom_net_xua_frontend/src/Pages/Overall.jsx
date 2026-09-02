import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "../Components/reports.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

const money = (
  value
) =>
  new Intl.NumberFormat(
    "vi-VN"
  ).format(
    Number(
      value || 0
    )
  ) + " đ";

const number = (
  value
) =>
  new Intl.NumberFormat(
    "vi-VN"
  ).format(
    Number(
      value || 0
    )
  );

const today = () => {
  const now =
    new Date();

  const offset =
    now.getTimezoneOffset();

  return new Date(
    now.getTime() -
      offset *
        60 *
        1000
  )
    .toISOString()
    .slice(0, 10);
};

const currentMonth =
  () =>
    today().slice(
      0,
      7
    );

async function api(
  path
) {
  const response =
    await fetch(
      `${API_URL}${path}`
    );

  const raw =
    await response.text();

  let data;

  try {
    data =
      raw
        ? JSON.parse(
            raw
          )
        : {};
  } catch {
    throw new Error(
      "API không trả JSON"
    );
  }

  if (
    !response.ok ||
    data.success ===
      false
  ) {
    throw new Error(
      data.message ||
        "Không tải được dữ liệu"
    );
  }

  return data;
}

/* =========================================================
   DONUT
========================================================= */

function InventoryDonut({
  data = [],
}) {
  const total =
    data.reduce(
      (
        sum,
        row
      ) =>
        sum +
        Number(
          row.inventory_value ||
            0
        ),
      0
    );

  const radius =
    58;

  const circumference =
    2 *
    Math.PI *
    radius;

  let offset =
    0;

  return (
    <div className="report-donut-wrap">

      <svg
        viewBox="0 0 160 160"
        className="report-donut"
      >
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#eee5dd"
          strokeWidth="23"
        />

        {data.map(
          (
            row,
            index
          ) => {
            const value =
              Number(
                row.inventory_value ||
                  0
              );

            const percent =
              total
                ? value /
                  total
                : 0;

            const length =
              percent *
              circumference;

            const element = (
              <circle
                key={
                  row.product_id
                }
                cx="80"
                cy="80"
                r={
                  radius
                }
                fill="none"
                stroke={
                  `hsl(${(index * 47) % 360} 62% 55%)`
                }
                strokeWidth="23"
                strokeDasharray={`${length} ${
                  circumference -
                  length
                }`}
                strokeDashoffset={
                  -offset
                }
                transform="rotate(-90 80 80)"
              />
            );

            offset +=
              length;

            return element;
          }
        )}

        <text
          x="80"
          y="75"
          textAnchor="middle"
          className="donut-center-label"
        >
          Giá trị tồn
        </text>

        <text
          x="80"
          y="92"
          textAnchor="middle"
          className="donut-center-value"
        >
          {data.length}
        </text>
      </svg>

      <div className="report-donut-legend">

        {data
          .slice(
            0,
            8
          )
          .map(
            (
              row,
              index
            ) => (
              <div
                key={
                  row.product_id
                }
              >
                <i
                  style={{
                    background:
                      `hsl(${(index * 47) % 360} 62% 55%)`,
                  }}
                />

                <span>
                  {
                    row.product_name
                  }
                </span>

                <strong>
                  {money(
                    row.inventory_value
                  )}
                </strong>
              </div>
            )
          )}

      </div>

    </div>
  );
}

/* =========================================================
   TOP EXPORT BAR
========================================================= */

function ExportBars({
  data = [],
}) {
  const max =
    Math.max(
      1,
      ...data.map(
        (
          row
        ) =>
          Number(
            row.quantity ||
              0
          )
      )
    );

  return (
    <div className="report-bar-list">

      {data.map(
        (
          row
        ) => (
          <div
            key={
              row.variant_id
            }
            className="report-bar-row"
          >

            <div className="report-bar-name">
              {
                row.product_name
              }
              {row.size
                ? ` · ${row.size}`
                : ""}
            </div>

            <div className="report-bar-track">

              <div
                className="report-bar-value"
                style={{
                  width:
                    `${Math.max(
                      3,
                      Number(
                        row.quantity ||
                          0
                      ) /
                        max *
                        100
                    )}%`,
                }}
              />

            </div>

            <strong>
              {
                row.quantity
              }
            </strong>

          </div>
        )
      )}

      {!data.length && (
        <div className="report-empty">
          Chưa có dữ liệu xuất kho.
        </div>
      )}

    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function TongQuan() {
  const [
    period,
    setPeriod,
  ] = useState(
    "month"
  );

  const [
    value,
    setValue,
  ] = useState(
    currentMonth()
  );

  const [
    data,
    setData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const load =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          const result =
            await api(
              `/reports/overview?period=${encodeURIComponent(
                period
              )}&value=${encodeURIComponent(
                value
              )}`
            );

          setData(
            result.data
          );
        } catch (
          error
        ) {
          console.error(
            error
          );

          alert(
            error.message
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        period,
        value,
      ]
    );

  useEffect(() => {
    load();
  }, [load]);

  const inventory =
    data?.inventory ||
    {};

  const finance =
    data?.finance ||
    {};

  const profit =
    Number(
      finance.profit ||
        0
    );

  const displayDate =
    useMemo(
      () =>
        new Date().toLocaleDateString(
          "vi-VN",
          {
            weekday:
              "long",

            day:
              "2-digit",

            month:
              "2-digit",

            year:
              "numeric",
          }
        ),
      []
    );

  return (
    <main className="report-page">

      {/* HEADER */}

      <section className="report-header-card">

        <div>
          <div className="report-eyebrow">
            BÁO CÁO ĐIỀU HÀNH
          </div>

          <h1>
            Tổng quan hoạt động kho
          </h1>

          <p>
            {displayDate}
          </p>
        </div>

        <div className="report-header-actions">

          <select
            value={
              period
            }
            onChange={(e) => {
              const next =
                e.target.value;

              setPeriod(
                next
              );

              if (
                next ===
                "month"
              ) {
                setValue(
                  currentMonth()
                );
              }

              if (
                next ===
                  "day" ||
                next ===
                  "week"
              ) {
                setValue(
                  today()
                );
              }

              if (
                next ===
                "year"
              ) {
                setValue(
                  String(
                    new Date().getFullYear()
                  )
                );
              }
            }}
          >
            <option value="day">
              Hôm nay
            </option>

            <option value="week">
              Tuần này
            </option>

            <option value="month">
              Tháng này
            </option>

            <option value="year">
              Năm nay
            </option>
          </select>

          <button
            type="button"
            className="report-btn light"
            onClick={() =>
              window.print()
            }
          >
            In báo cáo tổng quan
          </button>

          <button
            type="button"
            className="report-btn primary"
            onClick={
              load
            }
          >
            {loading
              ? "Đang tải..."
              : "Làm mới dữ liệu"}
          </button>

        </div>

      </section>

      {/* TOP CARDS */}

      <section className="report-kpi-grid">

        <article className="report-kpi-card">

          <div className="report-kpi-icon">
            📦
          </div>

          <div>
            <span>
              Giá trị tồn kho
            </span>

            <strong>
              {money(
                inventory.inventory_value
              )}
            </strong>

            <small>
              {number(
                inventory.root_products
              )}{" "}
              sản phẩm gốc ·{" "}
              {number(
                inventory.variants
              )}{" "}
              biến thể
            </small>
          </div>

        </article>

        <article className="report-kpi-card">

          <div className="report-kpi-icon">
            🏺
          </div>

          <div>
            <span>
              Tổng số lượng tồn
            </span>

            <strong>
              {number(
                inventory.inventory_quantity
              )}
            </strong>

            <small>
              {number(
                inventory.variants
              )}{" "}
              biến thể đang sử dụng
            </small>
          </div>

        </article>

        <article className="report-kpi-card warning">

          <div className="report-kpi-icon">
            ⚠
          </div>

          <div>
            <span>
              Cần nhập hàng
            </span>

            <strong>
              {number(
                inventory.need_restock
              )}
            </strong>

            <small>
              Hết hàng hoặc dưới định mức
            </small>
          </div>

        </article>

        <article className="report-kpi-card debt">

          <div className="report-kpi-icon">
            ₫
          </div>

          <div>
            <span>
              Công nợ nhà cung cấp
            </span>

            <strong>
              {money(
                inventory.supplier_debt
              )}
            </strong>

            <small>
              Số dư còn phải trả
            </small>
          </div>

        </article>

      </section>

      {/* FINANCE STRIP */}

      <section className="report-finance-strip">

        <div>
          <span>
            Tiền thực nhận trong kỳ
          </span>

          <strong>
            {money(
              finance.actual_receipt
            )}
          </strong>
        </div>

        <div>
          <span>
            Giá vốn hàng xuất
          </span>

          <strong>
            {money(
              finance.export_cost
            )}
          </strong>
        </div>

        <div>
          <span>
            Chi phí vận hành
          </span>

          <strong>
            {money(
              finance.operating_expense
            )}
          </strong>
        </div>

        <div>
          <span>
            Bể vỡ / thất thoát
          </span>

          <strong>
            {money(
              finance.loss_value
            )}
          </strong>
        </div>

        <div className="finance-profit">
          <span>
            Lãi/lỗ quản trị
          </span>

          <strong
            className={
              profit >= 0
                ? "positive"
                : "negative"
            }
          >
            {money(
              profit
            )}
          </strong>
        </div>

      </section>

      {/* CHARTS */}

      <section className="report-chart-grid">

        <article className="report-panel">

          <div className="report-eyebrow">
            CƠ CẤU TỒN KHO
          </div>

          <h2>
            Giá trị tồn theo sản phẩm gốc
          </h2>

          <InventoryDonut
            data={
              data?.inventory_by_product ||
              []
            }
          />

        </article>

        <article className="report-panel">

          <div className="report-eyebrow">
            TỐC ĐỘ XUẤT
          </div>

          <h2>
            Top biến thể xuất nhiều
          </h2>

          <ExportBars
            data={
              data?.top_exports ||
              []
            }
          />

        </article>

      </section>

      {/* LISTS */}

      <section className="report-list-grid">

        <article className="report-panel">

          <div className="report-panel-heading">

            <div>
              <div className="report-eyebrow">
                CẢNH BÁO
              </div>

              <h2>
                Sản phẩm cần xử lý
              </h2>
            </div>

            <b className="report-count">
              {number(
                inventory.need_restock
              )}
            </b>

          </div>

          <div className="report-alert-list">

            {(data?.alerts ||
              []).map(
              (
                item
              ) => (
                <div
                  key={
                    item.variant_id
                  }
                  className="report-alert-row"
                >

                  <div>

                    <strong>
                      {
                        item.product_name
                      }
                    </strong>

                    <span>
                      {item.size ||
                        "Không size"}{" "}
                      ·{" "}
                      {
                        item.sku
                      }
                    </span>

                  </div>

                  <b>
                    {item.current_quantity <=
                    0
                      ? "Hết hàng"
                      : `Còn ${item.current_quantity}`}
                  </b>

                </div>
              )
            )}

          </div>

        </article>

        <article className="report-panel">

          <div className="report-eyebrow">
            NHẬT KÝ
          </div>

          <h2>
            Giao dịch gần đây
          </h2>

          <div className="report-activity-list">

            {(data?.recent_transactions ||
              []).map(
              (
                item
              ) => (
                <div
                  key={
                    item.id
                  }
                  className="report-activity-row"
                >

                  <span>
                    {item.type ===
                    "EXPORT"
                      ? "Xuất kho"
                      : item.type ===
                          "IMPORT"
                        ? "Nhập kho"
                        : item.type ===
                            "LOSS"
                          ? "Thất thoát"
                          : item.type}
                    {" · "}
                    {
                      item.product_name
                    }
                    {item.size
                      ? ` ${item.size}`
                      : ""}
                  </span>

                  <b
                    className={
                      item.delta <
                      0
                        ? "negative"
                        : "positive"
                    }
                  >
                    {item.delta >
                    0
                      ? "+"
                      : ""}
                    {
                      item.delta
                    }
                  </b>

                </div>
              )
            )}

          </div>

        </article>

      </section>

      {/* BOTTOM KPI */}

      <section className="report-bottom-grid">

        <article className="report-bottom-card">

          <span>
            Tồn kho an toàn
          </span>

          <strong>
            {number(
              inventory.safe_stock_percent
            )}
            %
          </strong>

          <div className="report-progress">
            <i
              style={{
                width:
                  `${inventory.safe_stock_percent || 0}%`,
              }}
            />
          </div>

          <small>
            Tỷ lệ biến thể còn trên mức tối thiểu
          </small>

        </article>

        <article className="report-bottom-card">

          <span>
            Giá trị tồn lâu
          </span>

          <strong>
            {money(
              inventory.long_stock_value
            )}
          </strong>

          <small>
            {number(
              inventory.long_stock_variants
            )}{" "}
            biến thể không xuất trong hơn 60 ngày
          </small>

        </article>

        <article className="report-bottom-card">

          <span>
            Số phiếu trong kỳ
          </span>

          <strong>
            {number(
              inventory.receipt_count
            )}
          </strong>

          <small>
            {number(
              inventory.import_receipt_count
            )}{" "}
            phiếu nhập ·{" "}
            {number(
              inventory.export_receipt_count
            )}{" "}
            phiếu xuất
          </small>

        </article>

      </section>

    </main>
  );
}