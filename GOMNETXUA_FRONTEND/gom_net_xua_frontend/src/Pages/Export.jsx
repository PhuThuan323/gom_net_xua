import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import ExportToolbar from "../Components/Export/exportToolbar";
import ExportFromInvoice from "../Components/Export/exportFromInvoice";
import ExportProductGroups from "../Components/Export/exportProductGroup";
import ExportSummary from "../Components/Export/exportSummary";
import ExportHistory from "../Components/Export/exportHistory";

import "../Components/Export/export.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

const EXPORT_API = `${API_URL}/export-stock`;

async function api(path, options = {}) {
  const safePath = path.startsWith("/")
    ? path
    : `/${path}`;

  const url = `${EXPORT_API}${safePath}`;

  const response = await fetch(url, {
    ...options,

    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const raw = await response.text();

  let data = {};

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    console.error("EXPORT API KHÔNG TRẢ JSON:", url, raw);

    throw new Error(
      `API không trả JSON: ${url}`
    );
  }

  if (
    !response.ok ||
    data?.success === false
  ) {
    throw new Error(
      data?.message ||
        `API lỗi ${response.status}`
    );
  }

  return data;
}

const today = () => {
  const now = new Date();

  const offset =
    now.getTimezoneOffset();

  return new Date(
    now.getTime() -
      offset * 60000
  )
    .toISOString()
    .slice(0, 10);
};

export default function Export({
  currentUser,
}) {
  const isAdmin =
    currentUser?.role === "ADMIN";
  const [groups, setGroups] =
    useState([]);

  const [quantityMap, setQuantityMap] =
    useState({});

  const [exportDate, setExportDate] =
    useState(today());

  const [exportedBy, setExportedBy] =
    useState("");

  const [channelNote, setChannelNote] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [scanCode, setScanCode] =
    useState("");

  const [scanStatus, setScanStatus] =
    useState({
      type: "idle",
      message: "Chưa quét.",
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [sourceInvoice, setSourceInvoice] =
    useState(null);

  const [historyRefresh, setHistoryRefresh] =
    useState(0);

  const scanInputRef =
    useRef(null);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadData =
    useCallback(async () => {
      try {
        setLoading(true);

        const result = await api(
          "/bootstrap"
        );

        setGroups(
          Array.isArray(result?.data)
            ? result.data
            : []
        );
      } catch (error) {
        console.error(error);

        alert(
          error?.message ||
            "Không tải được kho"
        );

        setGroups([]);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =========================================================
     QUAN TRỌNG:
     PHẢI KHAI BÁO allVariants + variantMap
     TRƯỚC CÁC CALLBACK DÙNG CHÚNG
  ========================================================= */

  const allVariants =
    useMemo(() => {
      const result = [];

      for (const group of groups) {
        for (
          const product of group.products || []
        ) {
          for (
            const variant of product.variants || []
          ) {
            result.push({
              ...variant,

              group_id: group.id,

              group_code:
                group.group_code,

              group_name:
                group.group_name,

              product_id:
                product.id,

              product_code:
                product.product_code,

              product_name:
                product.product_name,

              product_image:
                product.image_url,

              display_name:
                [
                  product.product_name,
                  variant.size,
                ]
                  .filter(Boolean)
                  .join(" - "),
            });
          }
        }
      }

      return result;
    }, [groups]);

  const variantMap =
    useMemo(() => {
      return new Map(
        allVariants.map(
          (variant) => [
            Number(variant.id),
            variant,
          ]
        )
      );
    }, [allVariants]);

  /* =========================================================
     SET QUANTITY
  ========================================================= */

  const setVariantQuantity =
    useCallback(
      (
        variantId,
        nextQuantity
      ) => {
        const id =
          Number(variantId);

        const variant =
          variantMap.get(id);

        if (!variant) {
          return;
        }

        let quantity =
          Number(nextQuantity);

        if (
          !Number.isFinite(quantity)
        ) {
          quantity = 0;
        }

        quantity =
          Math.floor(quantity);

        if (quantity < 0) {
          quantity = 0;
        }

        const stock =
          Number(
            variant.current_quantity ||
              0
          );

        if (quantity > stock) {
          quantity = stock;

          setScanStatus({
            type: "error",

            message:
              `${variant.display_name}: chỉ còn ${stock} sản phẩm.`,
          });
        }

        setQuantityMap(
          (old) => {
            const next = {
              ...old,
            };

            if (quantity <= 0) {
              delete next[id];
            } else {
              next[id] = quantity;
            }

            return next;
          }
        );
      },
      [variantMap]
    );

  /* =========================================================
     INCREMENT
  ========================================================= */

  const incrementVariant =
    useCallback(
      (
        variant,
        amount = 1
      ) => {
        if (!variant) return;

        const id =
          Number(variant.id);

        const stock =
          Number(
            variant.current_quantity ||
              0
          );

        setQuantityMap(
          (old) => {
            const current =
              Number(
                old[id] || 0
              );

            const next =
              current + amount;

            if (next > stock) {
              setScanStatus({
                type: "error",

                message:
                  `${variant.display_name || variant.variant_code}: không thể xuất ${next}. Tồn hiện tại ${stock}.`,
              });

              return old;
            }

            setScanStatus({
              type: "success",

              message:
                `${variant.display_name || variant.variant_code} +${amount} · Tổng ${next}`,
            });

            return {
              ...old,
              [id]: next,
            };
          }
        );
      },
      []
    );

  /* =========================================================
     SCAN
  ========================================================= */

  const handleScan =
    useCallback(
      async (rawCode) => {
        const code =
          String(
            rawCode || ""
          ).trim();

        if (!code) return;

        try {
          setScanStatus({
            type: "loading",
            message:
              "Đang kiểm tra...",
          });

          const result =
            await api(
              `/scan?code=${encodeURIComponent(
                code
              )}`
            );

          const variant =
            result?.data;

          if (!variant) {
            throw new Error(
              "Không tìm thấy sản phẩm"
            );
          }

          const localVariant =
            variantMap.get(
              Number(variant.id)
            ) || variant;

          incrementVariant(
            localVariant,
            1
          );
        } catch (error) {
          setScanStatus({
            type: "error",

            message:
              error?.message ||
              "Mã không hợp lệ",
          });
        } finally {
          setScanCode("");

          requestAnimationFrame(
            () => {
              scanInputRef.current?.focus();
            }
          );
        }
      },
      [
        variantMap,
        incrementVariant,
      ]
    );

  /* =========================================================
     CHỌN BÁO GIÁ
  ========================================================= */

  const selectInvoiceQuote =
    useCallback(
      (invoice) => {
        if (
          invoice.warehouse_status ===
          "processed"
        ) {
          alert(
            "Báo giá này đã được xuất kho"
          );

          return;
        }

        const next = {};

        for (
          const item of invoice.items || []
        ) {
          const variant =
            variantMap.get(
              Number(
                item.variant_id
              )
            );

          if (!variant) {
            alert(
              `Không tìm thấy sản phẩm ID ${item.variant_id} trong kho`
            );

            return;
          }

          const required =
            Number(
              item.quantity || 0
            );

          const stock =
            Number(
              variant.current_quantity ||
                0
            );

          if (required > stock) {
            alert(
              `${variant.display_name}: báo giá cần ${required}, nhưng kho chỉ còn ${stock}`
            );

            return;
          }

          next[
            Number(
              item.variant_id
            )
          ] = required;
        }

        setSourceInvoice(invoice);

        setQuantityMap(next);

        setChannelNote(
          [
            `Xuất theo báo giá ${invoice.invoice_code}`,
            invoice.channel,
          ]
            .filter(Boolean)
            .join(" - ")
        );

        setScanStatus({
          type: "success",

          message:
            `Đã nạp báo giá ${invoice.invoice_code}`,
        });
      },
      [variantMap]
    );

  const clearInvoiceQuote =
    useCallback(() => {
      setSourceInvoice(null);

      setQuantityMap({});

      setChannelNote("");

      setScanStatus({
        type: "idle",
        message:
          "Chưa quét.",
      });
    }, []);

  /* =========================================================
     SELECTED ITEMS
  ========================================================= */

  const selectedItems =
    useMemo(() => {
      return Object.entries(
        quantityMap
      )
        .map(
          ([
            variantId,
            quantity,
          ]) => {
            const variant =
              variantMap.get(
                Number(
                  variantId
                )
              );

            if (
              !variant ||
              Number(quantity) <= 0
            ) {
              return null;
            }

            const qty =
              Number(quantity);

            const unitCost =
              Number(
                variant.purchase_price ||
                  0
              );

            return {
              ...variant,

              quantity: qty,

              unit_cost:
                unitCost,

              total_cost:
                unitCost * qty,

              remaining_stock:
                Number(
                  variant.current_quantity ||
                    0
                ) - qty,
            };
          }
        )
        .filter(Boolean);
    }, [
      quantityMap,
      variantMap,
    ]);

  const totalQuantity =
    useMemo(
      () =>
        selectedItems.reduce(
          (sum, item) =>
            sum +
            Number(
              item.quantity
            ),
          0
        ),
      [selectedItems]
    );

  const totalCost =
    useMemo(
      () =>
        selectedItems.reduce(
          (sum, item) =>
            sum +
            Number(
              item.total_cost
            ),
          0
        ),
      [selectedItems]
    );

  /* =========================================================
     SAVE
  ========================================================= */

  const saveExport =
    async () => {
      if (!exportDate) {
        alert(
          "Vui lòng chọn ngày xuất kho"
        );

        return;
      }

      if (!exportedBy.trim()) {
        alert(
          "Vui lòng nhập người xuất kho"
        );

        return;
      }

      if (
        selectedItems.length ===
        0
      ) {
        alert(
          "Chưa có sản phẩm nào để xuất kho"
        );

        return;
      }

      const confirmMessage =
  isAdmin
    ? `Xác nhận xuất ${totalQuantity} sản phẩm?\n\nTổng giá vốn: ${new Intl.NumberFormat(
        "vi-VN"
      ).format(totalCost)} đ`
    : `Xác nhận xuất ${totalQuantity} sản phẩm?`;

const ok =
  window.confirm(
    confirmMessage
  );

      if (!ok) return;

      try {
        setSaving(true);

        const result =
          await api(
            "/commit",
            {
              method: "POST",

              body:
                JSON.stringify({
                  export_date:
                    exportDate,

                  exported_by:
                    exportedBy.trim(),

                  channel_note:
                    channelNote.trim(),

                  source_invoice_id:
                    sourceInvoice?.id ||
                    null,

                  items:
                    selectedItems.map(
                      (item) => ({
                        variant_id:
                          Number(
                            item.id
                          ),

                        quantity:
                          Number(
                            item.quantity
                          ),
                      })
                    ),
                }),
            }
          );

        alert(
          result?.message ||
            "Xuất kho thành công"
        );

        setQuantityMap({});

        setSearch("");

        setSourceInvoice(null);

        setHistoryRefresh(
          (old) => old + 1
        );

        setScanStatus({
          type: "success",

          message:
            `Đã lưu phiếu ${result?.data?.export_code || ""}`,
        });

        await loadData();

        requestAnimationFrame(
          () => {
            scanInputRef.current?.focus();
          }
        );
      } catch (error) {
        console.error(error);

        alert(
          error?.message ||
            "Không thể lưu xuất kho"
        );
      } finally {
        setSaving(false);
      }
    };

  const resetExport =
    () => {
      if (
        selectedItems.length >
          0 &&
        !window.confirm(
          "Xóa toàn bộ số lượng đang nhập?"
        )
      ) {
        return;
      }

      setQuantityMap({});

      setSourceInvoice(null);

      setScanStatus({
        type: "idle",
        message:
          "Chưa quét.",
      });

      setScanCode("");
    };

  return (
    <main className="export-page">

      <ExportToolbar
        exportDate={
          exportDate
        }

        setExportDate={
          setExportDate
        }

        exportedBy={
          exportedBy
        }

        setExportedBy={
          setExportedBy
        }

        channelNote={
          channelNote
        }

        setChannelNote={
          setChannelNote
        }

        search={
          search
        }

        setSearch={
          setSearch
        }

        scanCode={
          scanCode
        }

        setScanCode={
          setScanCode
        }

        scanStatus={
          scanStatus
        }

        onScan={
          handleScan
        }

        scanInputRef={
          scanInputRef
        }
      />

      

      <ExportProductGroups
        groups={
          groups
        }

        search={
          search
        }

        quantityMap={
          quantityMap
        }

        setVariantQuantity={
          setVariantQuantity
        }

        incrementVariant={
          incrementVariant
        }

        loading={
          loading
        }

        locked={
          Boolean(
            sourceInvoice
          )
        }
      />
      <ExportFromInvoice
        api={api}

        selectedInvoice={
          sourceInvoice
        }

        onSelect={
          selectInvoiceQuote
        }

        onClear={
          clearInvoiceQuote
        }

        refreshKey={
          historyRefresh
        }
      />
      <ExportHistory
        api={api}

        refreshKey={
          historyRefresh
        }
        isAdmin={
    isAdmin
  }
      />

      <ExportSummary
      isAdmin={
    currentUser
  }
        items={
          selectedItems
        }

        totalQuantity={
          totalQuantity
        }

        totalCost={
          totalCost
        }

        setVariantQuantity={
          setVariantQuantity
        }

        onSave={
          saveExport
        }

        onReset={
          resetExport
        }

        saving={
          saving
        }
      />

    </main>
  );
}