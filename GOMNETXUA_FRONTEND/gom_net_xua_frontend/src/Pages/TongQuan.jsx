import { useEffect, useState, useRef } from "react";

import ProductsGroupsList from "../Components/TongQuan/ProductsGroupsList";
import ProductsVariants from "../Components/TongQuan/ProductsVariants";

const API_URL = import.meta.env.VITE_API_URL;

function TongQuan({
  currentUser,
}) {
  const isAdmin =
    currentUser?.role === "ADMIN";
  // =====================================================
  // DATA
  // =====================================================

  const [groups, setGroups] = useState([]);
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);

  // =====================================================
  // FILTER
  // =====================================================

  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  // =====================================================
  // ADD MODAL
  // =====================================================

  const [showAddGroupModal, setShowAddGroupModal] =
    useState(false);

  const [showAddProductModal, setShowAddProductModal] =
    useState(false);

  const [showAddVariantModal, setShowAddVariantModal] =
    useState(false);

  // =====================================================
  // EDIT MODAL
  // =====================================================

  const [showEditGroupModal, setShowEditGroupModal] =
    useState(false);

  const [showEditProductModal, setShowEditProductModal] =
    useState(false);

  const [showEditVariantModal, setShowEditVariantModal] =
    useState(false);

  // =====================================================
  // EDIT ID
  // =====================================================

  const [editingGroupId, setEditingGroupId] =
    useState(null);

  const [editingProductId, setEditingProductId] =
    useState(null);

  const [editingVariantId, setEditingVariantId] =
    useState(null);

  // =====================================================
  // FORM GROUP
  // =====================================================
  const [selectedBarcodeVariant,setSelectedBarcodeVariant] = useState(null);
  const emptyGroupForm = {
    group_code: "",
    group_name: "",
    description: "",
    status: "active"
  };

  const [groupForm, setGroupForm] =
    useState(emptyGroupForm);

  // =====================================================
  // FORM PRODUCT
  // =====================================================

  const emptyProductForm = {
    group_id: "",
    product_code: "",
    product_name: "",
    description: "",
    status: "active"
  };

  const [productForm, setProductForm] =
    useState(emptyProductForm);

  // =====================================================
  // FORM VARIANT
  // =====================================================

  const emptyVariantForm = {
    product_id: "",
    size: "",
    purchase_price: "",
    selling_price: "",
    current_quantity: "",
    min_stock_quantity: "",
    status: "active"
  };

  const [variantForm, setVariantForm] =
    useState(emptyVariantForm);

  // =====================================================
  // HELPER API
  // =====================================================
  const handleShowBarcode =
  (variant) => {

    setSelectedBarcodeVariant(
      variant
    );

  };
  const parseResponse = async (response) => {
    const contentType =
      response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await response.json();
    }

    const text = await response.text();

    console.error(
      "API không trả JSON:",
      text
    );

    throw new Error(
      `API trả về dữ liệu không phải JSON (${response.status})`
    );
  };

  // =====================================================
  // LOAD DATA
  // =====================================================

  const loadData = async () => {
    try {
      const url =
        `${API_URL}/product-groups`;

      console.log(
        "Đang gọi API:",
        url
      );

      const response =
        await fetch(url);

      const result =
        await parseResponse(response);

      console.log(
        "GET /product-groups:",
        result
      );

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
          "Không thể lấy dữ liệu nhóm sản phẩm!"
        );
      }

      const groupsData =
        Array.isArray(result.data)
          ? result.data
          : [];

      // =================================================
      // GROUPS
      // =================================================

      setGroups(groupsData);

      // =================================================
      // PRODUCTS
      // =================================================

      const allProducts =
        groupsData.flatMap(
          (group) =>
            (group.products || [])
              .map((product) => ({
                ...product,

                group: {
                  id: group.id,
                  group_name:
                    group.group_name,
                  group_code:
                    group.group_code
                }
              }))
        );

      setProducts(allProducts);

      // =================================================
      // VARIANTS
      // =================================================

      const allVariants =
        groupsData.flatMap(
          (group) =>
            (group.products || [])
              .flatMap(
                (product) =>
                  (product.variants || [])
                    .map((variant) => ({
                      ...variant,

                      product: {
                        ...product,

                        group: {
                          id: group.id,
                          group_name:
                            group.group_name,
                          group_code:
                            group.group_code
                        }
                      }
                    }))
              )
        );

      setVariants(allVariants);

      console.log(
        "GROUPS:",
        groupsData
      );

      console.log(
        "PRODUCTS:",
        allProducts
      );

      console.log(
        "VARIANTS:",
        allVariants
      );

    } catch (error) {

      console.error(
        "Lỗi khi lấy dữ liệu:",
        error
      );

      setGroups([]);
      setProducts([]);
      setVariants([]);
    }
  };

  // =====================================================
  // LOAD FIRST
  // =====================================================

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // SELECT GROUP
  // =====================================================

  const handleSelectGroup = (group) => {
    const currentId =
      Number(selectedGroup);

    const newId =
      Number(group.id);

    if (currentId === newId) {
      setSelectedGroup("");
      setSelectedProduct("");
      return;
    }

    setSelectedGroup(group.id);
    setSelectedProduct("");
  };

  // =====================================================
  // FILTER PRODUCTS BY GROUP
  // =====================================================

  const groupProducts =
    selectedGroup
      ? products.filter(
          (product) =>
            Number(
              product.group_id
            ) ===
            Number(selectedGroup)
        )
      : products;

  // =====================================================
  // FILTER VARIANTS
  // =====================================================

  const filteredVariants =
    variants.filter(
      (variant) => {

        const groupMatch =
          !selectedGroup ||
          Number(
            variant.product?.group_id
          ) ===
          Number(selectedGroup);

        const productMatch =
          !selectedProduct ||
          Number(
            variant.product_id
          ) ===
          Number(selectedProduct);

        const statusMatch =
          !selectedStatus ||
          variant.status ===
            selectedStatus;

        const keyword =
          searchKeyword
            .toLowerCase()
            .trim();

        const searchMatch =
          !keyword ||

          variant.variant_code
            ?.toLowerCase()
            .includes(keyword) ||

          variant.size
            ?.toLowerCase()
            .includes(keyword) ||

          variant.barcode
            ?.toLowerCase()
            .includes(keyword) ||

          variant.product
            ?.product_name
            ?.toLowerCase()
            .includes(keyword) ||

          variant.product
            ?.product_code
            ?.toLowerCase()
            .includes(keyword) ||

          variant.product
            ?.group
            ?.group_name
            ?.toLowerCase()
            .includes(keyword);

        return (
          groupMatch &&
          productMatch &&
          statusMatch &&
          searchMatch
        );
      }
    );

  // =====================================================
  // FILTER PRODUCTS SEARCH
  // =====================================================

  const filteredProducts =
    groupProducts.filter(
      (product) => {

        if (
          !searchKeyword.trim()
        ) {
          return true;
        }

        const keyword =
          searchKeyword
            .toLowerCase()
            .trim();

        const productMatch =
          product.product_name
            ?.toLowerCase()
            .includes(keyword) ||

          product.product_code
            ?.toLowerCase()
            .includes(keyword);

        const productVariants =
          variants.filter(
            (variant) =>
              Number(
                variant.product_id
              ) ===
              Number(product.id)
          );

        const variantMatch =
          productVariants.some(
            (variant) =>
              variant.variant_code
                ?.toLowerCase()
                .includes(keyword) ||

              variant.size
                ?.toLowerCase()
                .includes(keyword) ||

              variant.barcode
                ?.toLowerCase()
                .includes(keyword)
          );

        return (
          productMatch ||
          variantMatch
        );
      }
    );

  // =====================================================
  // ADD GROUP
  // =====================================================

  const handleAddGroup =
    async (e) => {

      e.preventDefault();

      if (
        !groupForm.group_code.trim()
      ) {
        alert(
          "Vui lòng nhập mã nhóm!"
        );
        return;
      }

      if (
        !groupForm.group_name.trim()
      ) {
        alert(
          "Vui lòng nhập tên nhóm!"
        );
        return;
      }

      try {

        const response =
          await fetch(
            `${API_URL}/product-groups`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                group_code:
                  groupForm.group_code.trim(),

                group_name:
                  groupForm.group_name.trim(),

                description:
                  groupForm.description.trim(),

                status:
                  groupForm.status
              })
            }
          );

        const result =
          await parseResponse(
            response
          );

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
            "Không thể thêm nhóm!"
          );
        }

        alert(
          "Thêm nhóm sản phẩm thành công!"
        );

        setShowAddGroupModal(false);
        setGroupForm(
          emptyGroupForm
        );

        await loadData();

      } catch (error) {

        console.error(
          "Lỗi thêm nhóm:",
          error
        );

        alert(
          error.message
        );
      }
    };

  // =====================================================
  // EDIT GROUP
  // =====================================================

  const handleEditGroup =
    (group) => {

      setEditingGroupId(
        group.id
      );

      setGroupForm({
        group_code:
          group.group_code || "",

        group_name:
          group.group_name || "",

        description:
          group.description || "",

        status:
          group.status ||
          "active"
      });

      setShowEditGroupModal(true);
    };

  // =====================================================
  // UPDATE GROUP
  // =====================================================

  const handleUpdateGroup =
    async (e) => {

      e.preventDefault();

      if (!editingGroupId) {
        return;
      }

      try {

        const response =
          await fetch(
            `${API_URL}/product-groups/${editingGroupId}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                group_code:
                  groupForm.group_code.trim(),

                group_name:
                  groupForm.group_name.trim(),

                description:
                  groupForm.description.trim(),

                status:
                  groupForm.status
              })
            }
          );

        const result =
          await parseResponse(
            response
          );

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
            "Không thể cập nhật nhóm!"
          );
        }

        alert(
          "Cập nhật nhóm thành công!"
        );

        setShowEditGroupModal(false);
        setEditingGroupId(null);
        setGroupForm(
          emptyGroupForm
        );

        await loadData();

      } catch (error) {

        console.error(
          "Lỗi sửa nhóm:",
          error
        );

        alert(
          error.message
        );
      }
    };

  // =====================================================
  // DELETE GROUP
  // =====================================================

  const handleDeleteGroup =
    async (groupId) => {

      const group =
        groups.find(
          (item) =>
            Number(item.id) ===
            Number(groupId)
        );

      const confirmed =
        window.confirm(
          `Bạn có chắc muốn xóa nhóm "${group?.group_name || ""}" không?`
        );

      if (!confirmed) {
        return;
      }

      try {

        const response =
          await fetch(
            `${API_URL}/product-groups/${groupId}`,
            {
              method: "DELETE"
            }
          );

        const result =
          await parseResponse(
            response
          );

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
            "Không thể xóa nhóm!"
          );
        }

        alert(
          "Xóa nhóm sản phẩm thành công!"
        );

        if (
          Number(selectedGroup) ===
          Number(groupId)
        ) {
          setSelectedGroup("");
          setSelectedProduct("");
        }

        await loadData();

      } catch (error) {

        console.error(
          "Lỗi xóa nhóm:",
          error
        );

        alert(
          error.message
        );
      }
    };

  // =====================================================
  // OPEN ADD PRODUCT
  // =====================================================

  const openAddProductModal =
    () => {

      setProductForm({
        ...emptyProductForm,

        group_id:
          selectedGroup || ""
      });

      setShowAddProductModal(
        true
      );
    };

  // =====================================================
  // ADD PRODUCT
  // =====================================================

  const handleAddProduct =
    async (e) => {

      e.preventDefault();

      if (
        !productForm.group_id
      ) {
        alert(
          "Vui lòng chọn nhóm sản phẩm!"
        );
        return;
      }

      if (
        !productForm.product_code.trim()
      ) {
        alert(
          "Vui lòng nhập mã sản phẩm!"
        );
        return;
      }

      if (
        !productForm.product_name.trim()
      ) {
        alert(
          "Vui lòng nhập tên sản phẩm!"
        );
        return;
      }

      try {

        const payload = {
          group_id:
            Number(
              productForm.group_id
            ),

          product_code:
            productForm.product_code.trim(),

          product_name:
            productForm.product_name.trim(),

          description:
            productForm.description.trim(),

          status:
            productForm.status
        };

        console.log(
          "POST /products:",
          payload
        );

        const response =
          await fetch(
            `${API_URL}/products`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(
                  payload
                )
            }
          );

        const result =
          await parseResponse(
            response
          );

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
            "Không thể thêm sản phẩm!"
          );
        }

        alert(
          "Thêm sản phẩm thành công!"
        );

        setShowAddProductModal(
          false
        );

        setProductForm(
          emptyProductForm
        );

        await loadData();

      } catch (error) {

        console.error(
          "Lỗi thêm sản phẩm:",
          error
        );

        alert(
          error.message
        );
      }
    };

  // =====================================================
  // EDIT PRODUCT
  // =====================================================

  const handleEditProduct =
    (product) => {

      setEditingProductId(
        product.id
      );

      setProductForm({
        group_id:
          product.group_id || "",

        product_code:
          product.product_code || "",

        product_name:
          product.product_name || "",

        description:
          product.description || "",

        status:
          product.status ||
          "active"
      });

      setShowEditProductModal(
        true
      );
    };

  // =====================================================
  // UPDATE PRODUCT
  // =====================================================

  const handleUpdateProduct =
    async (e) => {

      e.preventDefault();

      if (!editingProductId) {
        return;
      }

      try {

        const payload = {
          group_id:
            Number(
              productForm.group_id
            ),

          product_code:
            productForm.product_code.trim(),

          product_name:
            productForm.product_name.trim(),

          description:
            productForm.description.trim(),

          status:
            productForm.status
        };

        const response =
          await fetch(
            `${API_URL}/products/${editingProductId}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(
                  payload
                )
            }
          );

        const result =
          await parseResponse(
            response
          );

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
            "Không thể cập nhật sản phẩm!"
          );
        }

        alert(
          "Cập nhật sản phẩm thành công!"
        );

        setShowEditProductModal(
          false
        );

        setEditingProductId(null);

        setProductForm(
          emptyProductForm
        );

        await loadData();

      } catch (error) {

        console.error(
          "Lỗi sửa sản phẩm:",
          error
        );

        alert(
          error.message
        );
      }
    };

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  const handleDeleteProduct =
    async (productId) => {

      const product =
        products.find(
          (item) =>
            Number(item.id) ===
            Number(productId)
        );

      const confirmed =
        window.confirm(
          `Bạn có chắc muốn xóa sản phẩm "${product?.product_name || ""}" không?`
        );

      if (!confirmed) {
        return;
      }

      try {

        const response =
          await fetch(
            `${API_URL}/products/${productId}`,
            {
              method: "DELETE"
            }
          );

        const result =
          await parseResponse(
            response
          );

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
            "Không thể xóa sản phẩm!"
          );
        }

        alert(
          "Xóa sản phẩm thành công!"
        );

        if (
          Number(selectedProduct) ===
          Number(productId)
        ) {
          setSelectedProduct("");
        }

        await loadData();

      } catch (error) {

        console.error(
          "Lỗi xóa sản phẩm:",
          error
        );

        alert(
          error.message
        );
      }
    };

  // =====================================================
  // TẠO SKU TỰ ĐỘNG
  // =====================================================

  const generateVariantSku =
    (productId, size) => {

      if (
        !productId ||
        !size?.trim()
      ) {
        return "";
      }

      const product =
        products.find(
          (item) =>
            Number(item.id) ===
            Number(productId)
        );

      if (!product) {
        return "";
      }

      const productSku =
        product.product_code
          ?.trim();

      const cleanSize =
        size
          .trim()
          .replace(/\s+/g, "");

      if (
        !productSku ||
        !cleanSize
      ) {
        return "";
      }

      return `${productSku}-${cleanSize}`;
    };

  // =====================================================
  // OPEN ADD VARIANT
  // =====================================================

  const openAddVariantModal =
    () => {

      setVariantForm({
        ...emptyVariantForm,

        product_id:
          selectedProduct || ""
      });

      setShowAddVariantModal(
        true
      );
    };

  // =====================================================
  // ADD VARIANT
  // =====================================================

  const handleAddVariant =
    async (e) => {

      e.preventDefault();

      if (
        !variantForm.product_id
      ) {
        alert(
          "Vui lòng chọn sản phẩm!"
        );
        return;
      }

      if (
        !variantForm.size.trim()
      ) {
        alert(
          "Vui lòng nhập size!"
        );
        return;
      }

      const autoSku =
        generateVariantSku(
          variantForm.product_id,
          variantForm.size
        );

      if (!autoSku) {
        alert(
          "Không thể tự sinh SKU. Vui lòng kiểm tra sản phẩm và size!"
        );
        return;
      }

      // Barcode = SKU
      const autoBarcode =
        autoSku;

      try {

        const payload = {
          product_id:
            Number(
              variantForm.product_id
            ),

          variant_code:
            autoSku,

          size:
            variantForm.size
              .trim(),

          barcode:
            autoBarcode,

          purchase_price:
            Number(
              variantForm.purchase_price ||
              0
            ),

          selling_price:
            Number(
              variantForm.selling_price ||
              0
            ),

          current_quantity:
            Number(
              variantForm.current_quantity ||
              0
            ),

          min_stock_quantity:
            Number(
              variantForm.min_stock_quantity ||
              0
            ),

          status:
            variantForm.status
        };

        console.log(
          "POST /variants:",
          payload
        );

        const response =
          await fetch(
            `${API_URL}/variants`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(
                  payload
                )
            }
          );

        const result =
          await parseResponse(
            response
          );

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
            "Không thể thêm biến thể!"
          );
        }

        alert(
          `Thêm biến thể thành công!\nSKU: ${autoSku}\nBarcode: ${autoBarcode}`
        );

        setShowAddVariantModal(
          false
        );

        setVariantForm(
          emptyVariantForm
        );

        await loadData();

      } catch (error) {

        console.error(
          "Lỗi thêm variant:",
          error
        );

        alert(
          error.message
        );
      }
    };

  // =====================================================
  // EDIT VARIANT
  // =====================================================

  const handleEditVariant =
    (variant) => {

      setEditingVariantId(
        variant.id
      );

      setVariantForm({
        product_id:
          variant.product_id || "",

        size:
          variant.size || "",

        purchase_price:
          variant.purchase_price ?? "",

        selling_price:
          variant.selling_price ?? "",

        current_quantity:
          variant.current_quantity ?? "",

        min_stock_quantity:
          variant.min_stock_quantity ?? "",

        status:
          variant.status ||
          "active"
      });

      setShowEditVariantModal(
        true
      );
    };

  // =====================================================
  // UPDATE VARIANT
  // =====================================================

  const handleUpdateVariant =
    async (e) => {

      e.preventDefault();

      if (!editingVariantId) {
        return;
      }

      if (
        !variantForm.product_id
      ) {
        alert(
          "Vui lòng chọn sản phẩm!"
        );
        return;
      }

      if (
        !variantForm.size.trim()
      ) {
        alert(
          "Vui lòng nhập size!"
        );
        return;
      }

      const autoSku =
        generateVariantSku(
          variantForm.product_id,
          variantForm.size
        );

      if (!autoSku) {
        alert(
          "Không thể tự sinh SKU!"
        );
        return;
      }

      const autoBarcode =
        autoSku;

      try {

        const payload = {
          product_id:
            Number(
              variantForm.product_id
            ),

          variant_code:
            autoSku,

          size:
            variantForm.size
              .trim(),

          barcode:
            autoBarcode,

          purchase_price:
            Number(
              variantForm.purchase_price ||
              0
            ),

          selling_price:
            Number(
              variantForm.selling_price ||
              0
            ),

          current_quantity:
            Number(
              variantForm.current_quantity ||
              0
            ),

          min_stock_quantity:
            Number(
              variantForm.min_stock_quantity ||
              0
            ),

          status:
            variantForm.status
        };

        console.log(
          "PUT /variants:",
          payload
        );

        const response =
          await fetch(
            `${API_URL}/variants/${editingVariantId}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(
                  payload
                )
            }
          );

        const result =
          await parseResponse(
            response
          );

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
            "Không thể cập nhật biến thể!"
          );
        }

        alert(
          `Cập nhật biến thể thành công!\nSKU: ${autoSku}\nBarcode: ${autoBarcode}`
        );

        setShowEditVariantModal(
          false
        );

        setEditingVariantId(
          null
        );

        setVariantForm(
          emptyVariantForm
        );

        await loadData();

      } catch (error) {

        console.error(
          "Lỗi sửa variant:",
          error
        );

        alert(
          error.message
        );
      }
    };

  // =====================================================
  // DELETE VARIANT
  // =====================================================

  const handleDeleteVariant =
    async (variantId) => {

      const variant =
        variants.find(
          (item) =>
            Number(item.id) ===
            Number(variantId)
        );

      const confirmed =
        window.confirm(
          `Bạn có chắc muốn xóa biến thể "${variant?.variant_code || ""}" không?`
        );

      if (!confirmed) {
        return;
      }

      try {

        const response =
          await fetch(
            `${API_URL}/variants/${variantId}`,
            {
              method: "DELETE"
            }
          );

        const result =
          await parseResponse(
            response
          );

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
            "Không thể xóa biến thể!"
          );
        }

        alert(
          "Xóa biến thể thành công!"
        );

        await loadData();

      } catch (error) {

        console.error(
          "Lỗi xóa variant:",
          error
        );

        alert(
          error.message
        );
      }
    };

  // =====================================================
  // CLOSE MODALS
  // =====================================================

  const closeAllModals = () => {

    setShowAddGroupModal(false);
    setShowAddProductModal(false);
    setShowAddVariantModal(false);

    setShowEditGroupModal(false);
    setShowEditProductModal(false);
    setShowEditVariantModal(false);

  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="product-page">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="page-header">

        <div>

          <h1>
            Nhóm sản phẩm – sản phẩm – biến thể
          </h1>

          <p>
            Cấu trúc 3 cấp:
            Nhóm sản phẩm →
            Sản phẩm gốc →
            Biến thể/size
          </p>

        </div>

        {isAdmin && (
        <div className="header-actions">

          <button
            type="button"
            onClick={() => {

              setGroupForm(
                emptyGroupForm
              );

              setShowAddGroupModal(
                true
              );

            }}
          >
            + Nhóm sản phẩm
          </button>


          <button
            type="button"
            onClick={
              openAddProductModal
            }
          >
            + Sản phẩm gốc
          </button>


          <button
            type="button"
            className="primary-button"
            onClick={
              openAddVariantModal
            }
          >
            + Biến thể / size
          </button>
        
        </div>
      )}
      </div>


      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <div className="main-product-layout">

        <ProductsGroupsList

          groups={groups}

          selectedGroup={
            selectedGroup
          }

          onSelectGroup={
            handleSelectGroup
          }

          onRefresh={
            loadData
          }

           isAdmin={isAdmin} 
           onEditGroup={ isAdmin ? handleEditGroup : undefined}
           onDeleteGroup={ isAdmin ? handleDeleteGroup : undefined }

        />


        <ProductsVariants

          variants={
            filteredVariants
          }

          products={
            filteredProducts
          }

          groups={
            groups
          }

          selectedGroup={
            selectedGroup
          }

          selectedProduct={
            selectedProduct
          }

          selectedStatus={
            selectedStatus
          }

          searchKeyword={
            searchKeyword
          }

           isAdmin={ isAdmin } 
           onChangeGroup={(value) => { setSelectedGroup(value);
          setSelectedProduct("");
        }}


          onChangeProduct={
            setSelectedProduct
          }

          onChangeStatus={
            setSelectedStatus
          }

          onSearch={
            setSearchKeyword
          }

           onEditProduct={
    isAdmin
      ? handleEditProduct
      : undefined
  }

  onDeleteProduct={
    isAdmin
      ? handleDeleteProduct
      : undefined
  }

  onEditVariant={
    isAdmin
      ? handleEditVariant
      : undefined
  }

  onDeleteVariant={
    isAdmin
      ? handleDeleteVariant
      : undefined
  }
          onShowBarcode={
            handleShowBarcode
          }
        />

      </div>


      {/* ================================================= */}
      {/* ADD GROUP */}
      {/* ================================================= */}

      {showAddGroupModal && (

        <div
          className="modal-overlay"
          onClick={
            closeAllModals
          }
        >

          <div
            className="group-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <ModalHeader
              title="Thêm nhóm sản phẩm"
              onClose={
                closeAllModals
              }
            />

            <form
              onSubmit={
                handleAddGroup
              }
            >

              <GroupForm
                form={
                  groupForm
                }
                setForm={
                  setGroupForm
                }
              />

              <ModalActions
                cancel={
                  closeAllModals
                }
                submit="Thêm nhóm"
              />

            </form>

          </div>

        </div>

      )}


      {/* ================================================= */}
      {/* EDIT GROUP */}
      {/* ================================================= */}

      {showEditGroupModal && (

        <div
          className="modal-overlay"
          onClick={
            closeAllModals
          }
        >

          <div
            className="group-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <ModalHeader
              title="Sửa nhóm sản phẩm"
              onClose={
                closeAllModals
              }
            />

            <form
              onSubmit={
                handleUpdateGroup
              }
            >

              <GroupForm
                form={
                  groupForm
                }
                setForm={
                  setGroupForm
                }
              />

              <ModalActions
                cancel={
                  closeAllModals
                }
                submit="Lưu thay đổi"
              />

            </form>

          </div>

        </div>

      )}


      {/* ================================================= */}
      {/* ADD PRODUCT */}
      {/* ================================================= */}

      {showAddProductModal && (

        <div
          className="modal-overlay"
          onClick={
            closeAllModals
          }
        >

          <div
            className="group-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <ModalHeader
              title="Thêm sản phẩm gốc"
              onClose={
                closeAllModals
              }
            />

            <form
              onSubmit={
                handleAddProduct
              }
            >

              <ProductForm
                form={
                  productForm
                }

                setForm={
                  setProductForm
                }

                groups={
                  groups
                }

              />

              <ModalActions
                cancel={
                  closeAllModals
                }
                submit="Thêm sản phẩm"
              />

            </form>

          </div>

        </div>

      )}


      {/* ================================================= */}
      {/* EDIT PRODUCT */}
      {/* ================================================= */}

      {showEditProductModal && (

        <div
          className="modal-overlay"
          onClick={
            closeAllModals
          }
        >

          <div
            className="group-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <ModalHeader
              title="Sửa sản phẩm gốc"
              onClose={
                closeAllModals
              }
            />

            <form
              onSubmit={
                handleUpdateProduct
              }
            >

              <ProductForm
                form={
                  productForm
                }

                setForm={
                  setProductForm
                }

                groups={
                  groups
                }

              />

              <ModalActions
                cancel={
                  closeAllModals
                }
                submit="Lưu thay đổi"
              />

            </form>

          </div>

        </div>

      )}


      {/* ================================================= */}
      {/* ADD VARIANT */}
      {/* ================================================= */}

      {showAddVariantModal && (

        <div
          className="modal-overlay"
          onClick={
            closeAllModals
          }
        >

          <div
            className="group-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <ModalHeader
              title="Thêm biến thể / size"
              onClose={
                closeAllModals
              }
            />

            <form
              onSubmit={
                handleAddVariant
              }
            >

              <VariantForm
                form={
                  variantForm
                }

                setForm={
                  setVariantForm
                }

                products={
                  products
                }

                showGeneratedInfo={
                  true
                }

              />

              <ModalActions
                cancel={
                  closeAllModals
                }
                submit="Thêm biến thể"
              />

            </form>

          </div>

        </div>

      )}


      {/* ================================================= */}
      {/* EDIT VARIANT */}
      {/* ================================================= */}

      {showEditVariantModal && (

        <div
          className="modal-overlay"
          onClick={
            closeAllModals
          }
        >

          <div
            className="group-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <ModalHeader
              title="Sửa biến thể / size"
              onClose={
                closeAllModals
              }
            />

            <form
              onSubmit={
                handleUpdateVariant
              }
            >

              <VariantForm
                form={
                  variantForm
                }

                setForm={
                  setVariantForm
                }

                products={
                  products
                }

                showGeneratedInfo={
                  true
                }

              />

              <ModalActions
                cancel={
                  closeAllModals
                }
                submit="Lưu thay đổi"
              />

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


// =====================================================
// MODAL HEADER
// =====================================================

function ModalHeader({
  title,
  onClose
}) {
  return (
    <div className="modal-header">

      <h2>
        {title}
      </h2>

      <button
        type="button"
        className="modal-close"
        onClick={onClose}
      >
        ×
      </button>

    </div>
  );
}


// =====================================================
// MODAL ACTIONS
// =====================================================

function ModalActions({
  cancel,
  submit
}) {
  return (
    <div className="modal-actions">

      <button
        type="button"
        className="cancel-button"
        onClick={cancel}
      >
        Hủy
      </button>

      <button
        type="submit"
        className="primary-button"
      >
        {submit}
      </button>

    </div>
  );
}


// =====================================================
// GROUP FORM
// =====================================================

function GroupForm({
  form,
  setForm
}) {
  return (
    <>

      <div className="form-group">

        <label>
          Mã nhóm sản phẩm
        </label>

        <input
          type="text"
          placeholder="Ví dụ: ND"
          value={
            form.group_code
          }

          onChange={(e) =>
            setForm((prev) => ({
              ...prev,

              group_code:
                e.target.value
                  .toUpperCase()
            }))
          }

          required
        />

      </div>


      <div className="form-group">

        <label>
          Tên nhóm sản phẩm
        </label>

        <input
          type="text"
          placeholder="Ví dụ: Nồi đất"
          value={
            form.group_name
          }

          onChange={(e) =>
            setForm((prev) => ({
              ...prev,

              group_name:
                e.target.value
            }))
          }

          required
        />

      </div>


      <div className="form-group">

        <label>
          Mô tả
        </label>

        <textarea
          rows="4"
          placeholder="Nhập mô tả..."
          value={
            form.description
          }

          onChange={(e) =>
            setForm((prev) => ({
              ...prev,

              description:
                e.target.value
            }))
          }
        />

      </div>


      <div className="form-group">

        <label>
          Trạng thái
        </label>

        <select
          value={
            form.status
          }

          onChange={(e) =>
            setForm((prev) => ({
              ...prev,

              status:
                e.target.value
            }))
          }
        >

          <option value="active">
            Hoạt động
          </option>

          <option value="inactive">
            Ngừng hoạt động
          </option>

        </select>

      </div>

    </>
  );
}


// =====================================================
// PRODUCT FORM
// =====================================================

function ProductForm({
  form,
  setForm,
  groups
}) {
  return (
    <>

      <div className="form-group">

        <label>
          Nhóm sản phẩm
        </label>

        <select
          value={
            form.group_id
          }

          onChange={(e) =>
            setForm((prev) => ({
              ...prev,

              group_id:
                e.target.value
            }))
          }

          required
        >

          <option value="">
            -- Chọn nhóm sản phẩm --
          </option>

          {groups.map(
            (group) => (

              <option
                key={
                  group.id
                }
                value={
                  group.id
                }
              >
                {
                  group.group_name
                }
              </option>

            )
          )}

        </select>

      </div>


      <div className="form-group">

        <label>
          Mã sản phẩm
        </label>

        <input
          type="text"
          placeholder="Ví dụ: NDSONQUAIBO"
          value={
            form.product_code
          }

          onChange={(e) =>
            setForm((prev) => ({
              ...prev,

              product_code:
                e.target.value
            }))
          }

          required
        />

      </div>


      <div className="form-group">

        <label>
          Tên sản phẩm
        </label>

        <input
          type="text"
          placeholder="Ví dụ: Nồi đất son quai bo"
          value={
            form.product_name
          }

          onChange={(e) =>
            setForm((prev) => ({
              ...prev,

              product_name:
                e.target.value
            }))
          }

          required
        />

      </div>


      <div className="form-group">

        <label>
          Mô tả
        </label>

        <textarea
          rows="4"
          placeholder="Nhập mô tả sản phẩm..."
          value={
            form.description
          }

          onChange={(e) =>
            setForm((prev) => ({
              ...prev,

              description:
                e.target.value
            }))
          }
        />

      </div>


      <div className="form-group">

        <label>
          Trạng thái
        </label>

        <select
          value={
            form.status
          }

          onChange={(e) =>
            setForm((prev) => ({
              ...prev,

              status:
                e.target.value
            }))
          }
        >

          <option value="active">
            Hoạt động
          </option>

          <option value="inactive">
            Ngừng hoạt động
          </option>

        </select>

      </div>

    </>
  );
}


// =====================================================
// VARIANT FORM
// =====================================================

function VariantForm({
  form,
  setForm,
  products,
  showGeneratedInfo
}) {

  const selectedProduct =
    products.find(
      (product) =>
        Number(product.id) ===
        Number(form.product_id)
    );

  const productSku =
    selectedProduct
      ?.product_code
      ?.trim() || "";

  const cleanSize =
    form.size
      ?.trim()
      .replace(/\s+/g, "") || "";

  const generatedSku =
    productSku &&
    cleanSize
      ? `${productSku}-${cleanSize}`
      : "";

  return (
    <>

      {/* ========================================== */}
      {/* PRODUCT */}
      {/* ========================================== */}

      <div className="form-group">

        <label>
          Sản phẩm gốc
        </label>

        <select
          value={
            form.product_id
          }

          onChange={(e) =>
            setForm((prev) => ({
              ...prev,

              product_id:
                e.target.value
            }))
          }

          required
        >

          <option value="">
            -- Chọn sản phẩm --
          </option>

          {products.map(
            (product) => (

              <option
                key={
                  product.id
                }

                value={
                  product.id
                }
              >
                {
                  product.product_name
                }
                {" "}
                (
                {
                  product.product_code
                }
                )
              </option>

            )
          )}

        </select>

      </div>


      {/* ========================================== */}
      {/* SIZE */}
      {/* ========================================== */}

      <div className="form-group">

        <label>
          Size
        </label>

        <input
          type="text"
          placeholder="Ví dụ: 15"
          value={
            form.size
          }

          onChange={(e) =>
            setForm((prev) => ({
              ...prev,

              size:
                e.target.value
            }))
          }

          required
        />

      </div>


      {/* ========================================== */}
      {/* GENERATED SKU */}
      {/* ========================================== */}

      {showGeneratedInfo && (

        <div className="generated-code-box">

          <div>

            <span>
              SKU:
            </span>

            <strong>
               
              {generatedSku ||
                "Chưa có"}
            </strong>

          </div>
        </div>

      )}


      {/* ========================================== */}
      {/* PURCHASE PRICE */}
      {/* ========================================== */}

      <div className="form-row-2">

        <div className="form-group">

          <label>
            Giá nhập
          </label>

          <input
            type="number"
            min="0"
            value={
              form.purchase_price
            }

            onChange={(e) =>
              setForm((prev) => ({
                ...prev,

                purchase_price:
                  e.target.value
              }))
            }

            required
          />

        </div>


        {/* SELLING PRICE */}

        <div className="form-group">

          <label>
            Giá bán
          </label>

          <input
            type="number"
            min="0"
            value={
              form.selling_price
            }

            onChange={(e) =>
              setForm((prev) => ({
                ...prev,

                selling_price:
                  e.target.value
              }))
            }

            required
          />

        </div>

      </div>


      {/* ========================================== */}
      {/* STOCK */}
      {/* ========================================== */}

      <div className="form-row-2">

        <div className="form-group">

          <label>
            Tồn kho
          </label>

          <input
            type="number"
            min="0"
            value={
              form.current_quantity
            }

            onChange={(e) =>
              setForm((prev) => ({
                ...prev,

                current_quantity:
                  e.target.value
              }))
            }
          />

        </div>


        <div className="form-group">

          <label>
            Tồn tối thiểu
          </label>

          <input
            type="number"
            min="0"
            value={
              form.min_stock_quantity
            }

            onChange={(e) =>
              setForm((prev) => ({
                ...prev,

                min_stock_quantity:
                  e.target.value
              }))
            }
          />

        </div>

      </div>


      {/* ========================================== */}
      {/* STATUS */}
      {/* ========================================== */}

      <div className="form-group">

        <label>
          Trạng thái
        </label>

        <select
          value={
            form.status
          }

          onChange={(e) =>
            setForm((prev) => ({
              ...prev,

              status:
                e.target.value
            }))
          }
        >

          <option value="active">
            Hoạt động
          </option>

          <option value="inactive">
            Ngừng hoạt động
          </option>

        </select>

      </div>

    </>
  );
}

export default TongQuan;