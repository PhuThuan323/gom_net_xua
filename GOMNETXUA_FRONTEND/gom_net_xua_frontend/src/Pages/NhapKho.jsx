import { useEffect, useMemo, useState } from "react";

import ImportHistory from "../Components/Import/ImportHistory";
import "../Components/Import/NhapKhoPage.css";
import ImportReceiptPrint from "../Components/Import/ImportReceiptPrint";
const API_URL = import.meta.env.VITE_API_URL;

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + " đ";

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60 * 1000)
    .toISOString()
    .split("T")[0];
};

function NhapKho() {
  const [importDate, setImportDate] = useState(getToday());
  const [supplierId, setSupplierId] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [note, setNote] = useState("");

  const [suppliers, setSuppliers] = useState([]);
  const [productGroups, setProductGroups] = useState([]);
  const [importItems, setImportItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [history, setHistory] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showPrint, setShowPrint] = useState(false);

  // SỬA / XÓA PHIẾU NHẬP
  const [editingReceiptId, setEditingReceiptId] = useState(null);
  const [editingReceiptCode, setEditingReceiptCode] = useState("");
  const [deletingReceiptId, setDeletingReceiptId] = useState(null);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoadingProducts(true);
    setError("");

    try {
      const [supplierResponse, productResponse, historyResponse] =
        await Promise.all([
          fetch(`${API_URL}/suppliers`),
          fetch(`${API_URL}/product-groups`),
          fetch(`${API_URL}/import-receipts`),
        ]);

      const supplierResult = await supplierResponse.json();
      const productResult = await productResponse.json();
      const historyResult = await historyResponse.json();

      if (!supplierResponse.ok || supplierResult.success === false) {
        throw new Error(
          supplierResult.message || "Không thể tải danh sách nhà cung cấp"
        );
      }

      if (!productResponse.ok || productResult.success === false) {
        throw new Error(
          productResult.message || "Không thể tải danh sách sản phẩm"
        );
      }

      if (!historyResponse.ok || historyResult.success === false) {
        throw new Error(
          historyResult.message || "Không thể tải lịch sử nhập hàng"
        );
      }

      setSuppliers(supplierResult.data || []);
      setProductGroups(productResult.data || []);
      setHistory(historyResult.data || []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu nhập kho:", err);
      setError(err.message || "Không thể tải dữ liệu");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Chuyển dữ liệu product-groups -> danh sách từng SKU/variant
  const allVariants = useMemo(() => {
    const result = [];

    productGroups.forEach((group) => {
      if (group.status && group.status !== "active") return;

      (group.products || []).forEach((product) => {
        if (product.status && product.status !== "active") return;

        (product.variants || []).forEach((variant) => {
          if (variant.status && variant.status !== "active") return;

          result.push({
            id: variant.id,
            variant_id: Number(variant.id),
            group_id: group.id,
            group_name: group.group_name,
            group_code: group.group_code,
            product_id: product.id,
            product_name: product.product_name,
            product_code: product.product_code,
            variant_code: variant.variant_code,
            sku: variant.variant_code,
            barcode: variant.barcode || variant.variant_code,
            size: variant.size || "",
            image_url:
              variant.image_url ||
              product.image_url ||
              group.image_url ||
              null,
            current_quantity: Number(variant.current_quantity || 0),
            purchase_price: Number(variant.purchase_price || 0),
            import_quantity: 0,
            note: "",
          });
        });
      });
    });

    return result;
  }, [productGroups]);

  // Khi API sản phẩm tải xong, tạo danh sách nhập với số lượng = 0.
  useEffect(() => {
    setImportItems((prev) => {
      const previousMap = new Map(
        prev.map((item) => [
          Number(item.variant_id),
          {
            import_quantity: Number(item.import_quantity || 0),
            purchase_price: Number(item.purchase_price || 0),
            note: item.note || "",
          },
        ])
      );

      return allVariants.map((item) => {
        const old = previousMap.get(item.variant_id);

        return {
          ...item,
          import_quantity: old?.import_quantity ?? 0,
          purchase_price: old?.purchase_price ?? item.purchase_price,
          note: old?.note ?? "",
        };
      });
    });
  }, [allVariants]);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return importItems;

    return importItems.filter((item) =>
      [
        item.group_name,
        item.group_code,
        item.product_name,
        item.product_code,
        item.variant_code,
        item.sku,
        item.barcode,
        item.size,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [importItems, searchTerm]);

  const groupedItems = useMemo(() => {
    const groups = new Map();

    filteredItems.forEach((item) => {
      const key = item.group_id;

      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          name: item.group_name,
          items: [],
        });
      }

      groups.get(key).items.push(item);
    });

    return Array.from(groups.values());
  }, [filteredItems]);

  const updateItem = (variantId, field, value) => {
    setImportItems((prev) =>
      prev.map((item) =>
        item.variant_id === Number(variantId)
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const handleQuantityChange = (variantId, value) => {
    const quantity = Math.max(0, Number(value) || 0);
    updateItem(variantId, "import_quantity", quantity);
  };

  const handlePurchasePriceChange = (variantId, value) => {
    const price = Math.max(0, Number(value) || 0);
    updateItem(variantId, "purchase_price", price);
  };

  // Quét/nhập SKU hoặc barcode rồi Enter:
  // nếu tìm đúng một variant -> tăng số lượng lên 1.
  const handleSearchKeyDown = (event) => {
    if (event.key !== "Enter") return;

    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return;

    const exactMatches = importItems.filter(
      (item) =>
        String(item.sku || "").toLowerCase() === keyword ||
        String(item.barcode || "").toLowerCase() === keyword ||
        String(item.variant_code || "").toLowerCase() === keyword
    );

    if (exactMatches.length === 1) {
      const item = exactMatches[0];

      updateItem(
        item.variant_id,
        "import_quantity",
        Number(item.import_quantity || 0) + 1
      );

      setSearchTerm("");
    }
  };

  const selectedItems = useMemo(
    () =>
      importItems.filter(
        (item) => Number(item.import_quantity || 0) > 0
      ),
    [importItems]
  );

  const totalQuantity = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) => sum + Number(item.import_quantity || 0),
        0
      ),
    [selectedItems]
  );

  const totalAmount = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) =>
          sum +
          Number(item.import_quantity || 0) *
            Number(item.purchase_price || 0),
        0
      ),
    [selectedItems]
  );

  const resetReceiptForm = () => {
    setImportDate(getToday());
    setSupplierId("");
    setReceivedBy("");
    setNote("");
    setSearchTerm("");

    setEditingReceiptId(null);
    setEditingReceiptCode("");

    setImportItems(
      allVariants.map((item) => ({
        ...item,
        import_quantity: 0,
        note: "",
      }))
    );
  };

  const handleEditReceipt = async (receiptId) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/import-receipts/${receiptId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể tải phiếu nhập để sửa"
        );
      }

      const receipt = result.data || {};

      setEditingReceiptId(Number(receipt.id));
      setEditingReceiptCode(receipt.receipt_code || "");

      const rawDate = receipt.import_date
        ? new Date(receipt.import_date)
        : new Date();

      if (Number.isNaN(rawDate.getTime())) {
        setImportDate(getToday());
      } else {
        const offset = rawDate.getTimezoneOffset();
        setImportDate(
          new Date(rawDate.getTime() - offset * 60 * 1000)
            .toISOString()
            .split("T")[0]
        );
      }

      setSupplierId(
        String(
          receipt.supplier_id ??
            receipt.supplier?.id ??
            ""
        )
      );

      setReceivedBy(receipt.received_by || "");
      setNote(receipt.note || "");

      const receiptItemMap = new Map(
        (receipt.items || []).map((item) => [
          Number(item.variant_id),
          item,
        ])
      );

      setImportItems(
        allVariants.map((item) => {
          const oldItem = receiptItemMap.get(
            Number(item.variant_id)
          );

          if (!oldItem) {
            return {
              ...item,
              import_quantity: 0,
              note: "",
            };
          }

          return {
            ...item,
            import_quantity: Number(oldItem.quantity || 0),
            purchase_price: Number(
              oldItem.purchase_price ?? item.purchase_price ?? 0
            ),
            note: oldItem.note || "",
          };
        })
      );

      setSearchTerm("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Lỗi tải phiếu để sửa:", err);
      alert(err.message || "Không thể tải phiếu nhập để sửa");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReceipt = async (receipt) => {
    if (!receipt?.id) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa phiếu nhập ${receipt.receipt_code || ""}?\n\n` +
        `Hệ thống phải hoàn lại tồn kho đã nhập từ phiếu này. ` +
        `Nếu số tồn hiện tại không đủ để hoàn, backend nên từ chối xóa.`
    );

    if (!confirmed) return;

    try {
      setDeletingReceiptId(Number(receipt.id));
      setError("");

      const response = await fetch(
        `${API_URL}/import-receipts/${receipt.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể xóa phiếu nhập kho"
        );
      }

      alert(result.message || "Đã xóa phiếu nhập kho");

      if (
        Number(editingReceiptId) === Number(receipt.id)
      ) {
        resetReceiptForm();
      }

      await loadInitialData();
    } catch (err) {
      console.error("Lỗi xóa phiếu nhập:", err);
      setError(err.message || "Không thể xóa phiếu nhập kho");
      alert(err.message || "Không thể xóa phiếu nhập kho");
    } finally {
      setDeletingReceiptId(null);
    }
  };

  const handleConfirm = async () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng nhập số lượng cho ít nhất một sản phẩm");
      return;
    }

    if (!supplierId) {
      alert("Vui lòng chọn nhà cung cấp");
      return;
    }

    const invalidItem = selectedItems.find(
      (item) =>
        Number(item.import_quantity || 0) <= 0 ||
        Number(item.purchase_price || 0) < 0
    );

    if (invalidItem) {
      alert(`Dữ liệu SKU ${invalidItem.sku} không hợp lệ`);
      return;
    }

    const confirmed = window.confirm(
      editingReceiptId
        ? `Bạn có chắc muốn cập nhật phiếu ${editingReceiptCode || ""} với ${totalQuantity} sản phẩm, tổng giá trị ${formatMoney(
            totalAmount
          )}?`
        : `Bạn có chắc muốn nhập ${totalQuantity} sản phẩm, tổng giá trị ${formatMoney(
            totalAmount
          )}?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError("");

      const itemsPayload = selectedItems.map((item) => ({
        variant_id: Number(item.variant_id),
        quantity: Number(item.import_quantity),
        purchase_price: Number(item.purchase_price),
        note: item.note || "",
      }));

      const isEditing = Boolean(editingReceiptId);

      const endpoint = isEditing
        ? `${API_URL}/import-receipts/${editingReceiptId}`
        : `${API_URL}/import-receipts`;

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplier_id: Number(supplierId),
          import_date: importDate,
          received_by: receivedBy.trim(),
          note: note.trim(),
          items: itemsPayload,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            (isEditing
              ? "Không thể cập nhật phiếu nhập kho"
              : "Không thể tạo phiếu nhập kho")
        );
      }

      alert(
        result.message ||
          (isEditing
            ? "Cập nhật phiếu nhập kho thành công!"
            : "Nhập kho thành công!")
      );

      resetReceiptForm();

      await loadInitialData();
    } catch (err) {
      console.error("Lỗi tạo phiếu nhập:", err);
      setError(err.message || "Có lỗi xảy ra khi tạo phiếu nhập");
      alert(err.message || "Có lỗi xảy ra khi tạo phiếu nhập");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = async (receiptId) => {
    try {
      const response = await fetch(
        `${API_URL}/import-receipts/${receiptId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Không thể tải phiếu nhập"
        );
      }

      setSelectedReceipt(result.data);
      setShowPrint(true);
    } catch (err) {
      console.error("Lỗi tải phiếu nhập:", err);
      alert(err.message || "Không thể tải phiếu nhập");
    }
  };

  return (
    <div className="nhap-kho-page">
      <div className="nhap-kho-header">
        <div>
          <h1 className="nhap-kho-title">Nhập kho</h1>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {editingReceiptId && (
        <section className="editing-receipt-banner">
          <div>
            <strong>
              Đang sửa phiếu: {editingReceiptCode || editingReceiptId}
            </strong>
            <span>
              Thay đổi thông tin hoặc số lượng bên dưới rồi bấm
              "Cập nhật phiếu nhập".
            </span>
          </div>

          <button
            type="button"
            className="cancel-edit-receipt-btn"
            onClick={resetReceiptForm}
            disabled={loading}
          >
            Hủy sửa
          </button>
        </section>
      )}

      {/* THÔNG TIN PHIẾU */}
      <section className="import-info-card">
        <div className="form-group">
          <label>Ngày nhập</label>
          <input
            type="date"
            value={importDate}
            onChange={(e) => setImportDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Nhà cung cấp</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="">-- Chọn nhà cung cấp --</option>

            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.supplier_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Người nhập</label>
          <input
            type="text"
            value={receivedBy}
            onChange={(e) => setReceivedBy(e.target.value)}
            placeholder="Tên nhân viên"
          />
        </div>

        <div className="form-group">
          <label>Ghi chú</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Số hóa đơn, lô hàng..."
          />
        </div>
      </section>

      {/* TÌM SẢN PHẨM */}
      <section className="product-search-card">
        <div className="product-search-title">
          <div>
            <h2>Thêm sản phẩm vào phiếu nhập</h2>
            <p>
              Tìm theo tên sản phẩm, mã sản phẩm, SKU, barcode hoặc size.
              Không tìm kiếm sẽ hiển thị tất cả sản phẩm.
            </p>
          </div>

          <span className="product-count">
            {filteredItems.length} SKU
          </span>
        </div>

        <div className="search-box">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Tìm sản phẩm / SKU / barcode rồi Enter..."
          />

          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchTerm("")}
              aria-label="Xóa tìm kiếm"
            >
              ×
            </button>
          )}
        </div>
      </section>

      {/* DANH SÁCH SẢN PHẨM */}
      <section className="product-list-card">
        {loadingProducts ? (
          <div className="loading-box">Đang tải danh sách sản phẩm...</div>
        ) : groupedItems.length === 0 ? (
          <div className="empty-product-box">
            Không tìm thấy sản phẩm phù hợp.
          </div>
        ) : (
          groupedItems.map((group) => (
            <div className="product-group" key={group.id}>
              <div className="product-group-header">
                <h3>{group.name}</h3>
              </div>

              <div className="product-table-wrapper">
                <table className="import-product-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Size</th>
                      <th>SKU / Barcode</th>
                      <th>Tồn hiện tại</th>
                      <th>SL nhập</th>
                      <th>Giá nhập</th>
                      <th>Thành tiền</th>
                    </tr>
                  </thead>

                  <tbody>
                    {group.items.map((item) => {
                      const quantity = Number(
                        item.import_quantity || 0
                      );
                      const price = Number(
                        item.purchase_price || 0
                      );

                      return (
                        <tr key={item.variant_id}>
                          <td>
                            <div className="product-cell">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.product_name}
                                  className="product-image"
                                />
                              ) : (
                                <div className="product-image product-image-empty">
                                  Không ảnh
                                </div>
                              )}

                              <div className="product-info">
                                <strong>{item.product_name}</strong>
                                <span>
                                  {item.product_code} · {item.variant_code}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>{item.size || "—"}</td>

                          <td>
                            <div className="sku-cell">
                              <strong>{item.sku}</strong>
                              {item.barcode &&
                                item.barcode !== item.sku && (
                                  <span>{item.barcode}</span>
                                )}
                            </div>
                          </td>

                          <td className="number-cell">
                            {item.current_quantity.toLocaleString("vi-VN")}
                          </td>

                          <td>
                            <input
                              className="quantity-input"
                              type="number"
                              min="0"
                              step="1"
                              value={item.import_quantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.variant_id,
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          <td>
                            <input
                              className="price-input"
                              type="number"
                              min="0"
                              step="1000"
                              value={item.purchase_price}
                              onChange={(e) =>
                                handlePurchasePriceChange(
                                  item.variant_id,
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          <td className="money-text">
                            {formatMoney(quantity * price)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </section>

      {/* TỔNG PHIẾU */}
      <section className="import-summary-card">
        <div className="summary-item">
          <span>Số SKU nhập</span>
          <strong>{selectedItems.length}</strong>
        </div>

        <div className="summary-item">
          <span>Tổng số lượng</span>
          <strong>{totalQuantity.toLocaleString("vi-VN")}</strong>
        </div>

        <div className="summary-item summary-total">
          <span>Tổng giá trị nhập</span>
          <strong>{formatMoney(totalAmount)}</strong>
        </div>

        <button
          type="button"
          className="confirm-import-btn"
          onClick={handleConfirm}
          disabled={loading || selectedItems.length === 0}
        >
          {loading
            ? editingReceiptId
              ? "Đang cập nhật..."
              : "Đang lưu..."
            : editingReceiptId
              ? "Cập nhật phiếu nhập"
              : "Lưu phiếu nhập kho"}
        </button>
      </section>

      {/* LỊCH SỬ */}
      <ImportHistory
        history={history}
        onPrint={handlePrintReceipt}
        onEdit={handleEditReceipt}
        onDelete={handleDeleteReceipt}
        deletingId={deletingReceiptId}
      />

      {/* IN PHIẾU */}
      {showPrint && (
  <ImportReceiptPrint
    receipt={selectedReceipt}
    onClose={() => {
      setShowPrint(false);
      setSelectedReceipt(null);
    }}
  />
)}
    </div>
  );
}

export default NhapKho;
