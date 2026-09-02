-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EMPLOYEE');

-- CreateTable
CREATE TABLE "product_groups" (
    "id" SERIAL NOT NULL,
    "group_code" VARCHAR(50) NOT NULL,
    "group_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "product_code" VARCHAR(100) NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "variant_code" VARCHAR(100) NOT NULL,
    "size" VARCHAR(100),
    "barcode" VARCHAR(100),
    "purchase_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "selling_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "current_quantity" INTEGER NOT NULL DEFAULT 0,
    "min_stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" SERIAL NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "transaction_type" VARCHAR(50) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quantity_before" INTEGER NOT NULL,
    "quantity_after" INTEGER NOT NULL,
    "unit_price" DECIMAL(15,2),
    "total_value" DECIMAL(15,2),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL,
    "supplier_code" VARCHAR(100) NOT NULL,
    "supplier_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "address" TEXT,
    "tax_code" VARCHAR(100),
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_debts" (
    "id" SERIAL NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "transaction_type" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balance_after" DECIMAL(15,2) NOT NULL,
    "reference_type" VARCHAR(50),
    "reference_id" INTEGER,
    "reference_code" VARCHAR(100),
    "note" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_receipts" (
    "id" SERIAL NOT NULL,
    "receipt_code" VARCHAR(100) NOT NULL,
    "supplier_id" INTEGER,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "debt_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "received_by" VARCHAR(255),
    "note" TEXT,
    "import_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_items" (
    "id" SERIAL NOT NULL,
    "import_receipt_id" INTEGER NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purchase_price" DECIMAL(15,2) NOT NULL,
    "total_price" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "customer_code" VARCHAR(100) NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "address" TEXT,
    "shipping_address" TEXT,
    "tax_code" VARCHAR(100),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "invoice_code" VARCHAR(100) NOT NULL,
    "brand_id" INTEGER,
    "customer_id" INTEGER,
    "invoice_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" VARCHAR(100),
    "order_code" VARCHAR(100),
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "shipping_fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deposit_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payment_method" VARCHAR(100),
    "shipping_address" TEXT,
    "warehouse_status" TEXT NOT NULL DEFAULT 'not_processed',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "total_price" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" SERIAL NOT NULL,
    "receipt_code" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "statement_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fee_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "period_code" VARCHAR(100),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "expense_code" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "recipient" VARCHAR(255),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_brands" (
    "id" SERIAL NOT NULL,
    "brand_code" VARCHAR(50) NOT NULL,
    "brand_name" VARCHAR(255) NOT NULL,
    "tax_code" VARCHAR(100),
    "phone" VARCHAR(50),
    "address" TEXT,
    "email" VARCHAR(255),
    "bank_name" VARCHAR(255),
    "bank_account" VARCHAR(100),
    "bank_holder" VARCHAR(255),
    "logo_text" VARCHAR(20),
    "status" TEXT NOT NULL DEFAULT 'active',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "full_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "position" VARCHAR(150),
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "google_sub" VARCHAR(255),
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_groups_group_code_key" ON "product_groups"("group_code");

-- CreateIndex
CREATE UNIQUE INDEX "products_product_code_key" ON "products"("product_code");

-- CreateIndex
CREATE INDEX "products_group_id_idx" ON "products"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_variant_code_key" ON "product_variants"("variant_code");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_barcode_key" ON "product_variants"("barcode");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "inventory_transactions_variant_id_idx" ON "inventory_transactions"("variant_id");

-- CreateIndex
CREATE INDEX "inventory_transactions_transaction_type_idx" ON "inventory_transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "inventory_transactions_created_at_idx" ON "inventory_transactions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_supplier_code_key" ON "suppliers"("supplier_code");

-- CreateIndex
CREATE INDEX "supplier_debts_supplier_id_idx" ON "supplier_debts"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_debts_transaction_date_idx" ON "supplier_debts"("transaction_date");

-- CreateIndex
CREATE INDEX "supplier_debts_supplier_id_transaction_date_idx" ON "supplier_debts"("supplier_id", "transaction_date");

-- CreateIndex
CREATE UNIQUE INDEX "import_receipts_receipt_code_key" ON "import_receipts"("receipt_code");

-- CreateIndex
CREATE INDEX "import_receipts_supplier_id_idx" ON "import_receipts"("supplier_id");

-- CreateIndex
CREATE INDEX "import_receipts_import_date_idx" ON "import_receipts"("import_date");

-- CreateIndex
CREATE INDEX "import_items_import_receipt_id_idx" ON "import_items"("import_receipt_id");

-- CreateIndex
CREATE INDEX "import_items_variant_id_idx" ON "import_items"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_customer_code_key" ON "customers"("customer_code");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_code_key" ON "invoices"("invoice_code");

-- CreateIndex
CREATE INDEX "invoices_brand_id_idx" ON "invoices"("brand_id");

-- CreateIndex
CREATE INDEX "invoices_customer_id_idx" ON "invoices"("customer_id");

-- CreateIndex
CREATE INDEX "invoices_invoice_date_idx" ON "invoices"("invoice_date");

-- CreateIndex
CREATE INDEX "invoices_created_at_idx" ON "invoices"("created_at");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_items_variant_id_idx" ON "invoice_items"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_receipt_code_key" ON "receipts"("receipt_code");

-- CreateIndex
CREATE INDEX "receipts_category_idx" ON "receipts"("category");

-- CreateIndex
CREATE INDEX "receipts_created_at_idx" ON "receipts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_expense_code_key" ON "expenses"("expense_code");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expenses_created_at_idx" ON "expenses"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_brands_brand_code_key" ON "invoice_brands"("brand_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_sub_key" ON "users"("google_sub");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "product_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_debts" ADD CONSTRAINT "supplier_debts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_receipts" ADD CONSTRAINT "import_receipts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_items" ADD CONSTRAINT "import_items_import_receipt_id_fkey" FOREIGN KEY ("import_receipt_id") REFERENCES "import_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_items" ADD CONSTRAINT "import_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "invoice_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
