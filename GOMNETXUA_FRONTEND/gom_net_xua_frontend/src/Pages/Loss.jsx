import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import LossForm from "../Components/Loss/lossForm";
import LossProductPicker from "../Components/Loss/lossProductPicker";
import LossHistory from "../Components/Loss/lossHistory";

import "../Components/Loss/loss.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

const LOSS_API =
  `${API_URL}/loss-stock`;

async function api(
  path,
  options = {}
) {
  const safePath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  const url =
    `${LOSS_API}${safePath}`;

  const response =
    await fetch(
      url,
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
        "Có lỗi xảy ra"
    );
  }

  return data;
}

const today = () => {
  const now =
    new Date();

  const offset =
    now.getTimezoneOffset();

  return new Date(
    now.getTime() -
      offset * 60000
  )
    .toISOString()
    .slice(0, 10);
};

export default function Loss() {
  const [
    groups,
    setGroups,
  ] = useState([]);

  const [
    selectedVariant,
    setSelectedVariant,
  ] = useState(null);

  const [
    transactionType,
    setTransactionType,
  ] = useState(
    "LOSS"
  );

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const [
    transactionDate,
    setTransactionDate,
  ] = useState(
    today()
  );

  const [
    performedBy,
    setPerformedBy,
  ] = useState("");

  const [
    reason,
    setReason,
  ] = useState(
    "Bể trong kho"
  );

  const [
    note,
    setNote,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  /* =======================================================
     LOAD
  ======================================================= */

  const loadProducts =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const result =
            await api(
              "/bootstrap"
            );

          setGroups(
            Array.isArray(
              result?.data
            )
              ? result.data
              : []
          );
        } catch (error) {
          alert(
            error?.message ||
              "Không tải được sản phẩm"
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /* =======================================================
     ALL VARIANTS
  ======================================================= */

  const variants =
    useMemo(() => {
      const result =
        [];

      for (
        const group of groups
      ) {
        for (
          const product of
          group.products ||
          []
        ) {
          for (
            const variant of
            product.variants ||
            []
          ) {
            result.push({
              ...variant,

              group_name:
                group.group_name,

              product_name:
                product.product_name,

              product_code:
                product.product_code,

              image_url:
                variant.image_url ||
                product.image_url,

              display_name:
                [
                  product.product_name,

                  variant.size,
                ]
                  .filter(
                    Boolean
                  )
                  .join(
                    " - "
                  ),
            });
          }
        }
      }

      return result;
    }, [groups]);

  /* =======================================================
     TYPE CHANGE
  ======================================================= */

  const changeType =
    (
      nextType
    ) => {
      setTransactionType(
        nextType
      );

      if (
        nextType ===
        "CUSTOMER_RETURN_RESALE"
      ) {
        setReason(
          "Khách trả còn bán được"
        );
      } else {
        setReason(
          "Bể trong kho"
        );
      }
    };

  /* =======================================================
     SAVE
  ======================================================= */

  const save =
    async () => {
      if (
        !selectedVariant
      ) {
        alert(
          "Vui lòng chọn sản phẩm"
        );

        return;
      }

      if (
        !performedBy.trim()
      ) {
        alert(
          "Vui lòng nhập người thực hiện"
        );

        return;
      }

      const qty =
        Number(
          quantity
        );

      if (
        !Number.isInteger(
          qty
        ) ||
        qty <= 0
      ) {
        alert(
          "Số lượng không hợp lệ"
        );

        return;
      }

      if (
        transactionType ===
          "LOSS" &&
        qty >
          Number(
            selectedVariant.current_quantity ||
              0
          )
      ) {
        alert(
          `Tồn kho hiện tại chỉ còn ${selectedVariant.current_quantity}`
        );

        return;
      }

      const message =
        transactionType ===
        "LOSS"
          ? `Xác nhận TRỪ ${qty} sản phẩm khỏi tồn kho?`
          : `Xác nhận CỘNG ${qty} sản phẩm khách trả vào kho?`;

      if (
        !window.confirm(
          message
        )
      ) {
        return;
      }

      try {
        setSaving(true);

        const result =
          await api(
            "/commit",
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  transaction_date:
                    transactionDate,

                  transaction_type:
                    transactionType,

                  variant_id:
                    Number(
                      selectedVariant.id
                    ),

                  quantity:
                    qty,

                  performed_by:
                    performedBy.trim(),

                  reason,

                  note:
                    note.trim(),
                }),
            }
          );

        alert(
          result?.message ||
            "Đã lưu"
        );

        setSelectedVariant(
          null
        );

        setQuantity(
          1
        );

        setNote("");

        setSearch("");

        setRefreshKey(
          (
            old
          ) =>
            old + 1
        );

        await loadProducts();
      } catch (error) {
        alert(
          error?.message ||
            "Không thể lưu"
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <main className="loss-page">

      <LossForm
        transactionType={
          transactionType
        }

        setTransactionType={
          changeType
        }

        transactionDate={
          transactionDate
        }

        setTransactionDate={
          setTransactionDate
        }

        performedBy={
          performedBy
        }

        setPerformedBy={
          setPerformedBy
        }

        reason={
          reason
        }

        setReason={
          setReason
        }

        quantity={
          quantity
        }

        setQuantity={
          setQuantity
        }

        note={
          note
        }

        setNote={
          setNote
        }

        selectedVariant={
          selectedVariant
        }

        onSave={
          save
        }

        saving={
          saving
        }
      />

      <LossProductPicker
        variants={
          variants
        }

        search={
          search
        }

        setSearch={
          setSearch
        }

        selectedVariant={
          selectedVariant
        }

        setSelectedVariant={
          setSelectedVariant
        }

        loading={
          loading
        }
      />

      <LossHistory
        api={
          api
        }

        refreshKey={
          refreshKey
        }
      />

    </main>
  );
}