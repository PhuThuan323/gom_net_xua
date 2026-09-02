-- AlterTable
ALTER TABLE `customers` ADD COLUMN `note` TEXT NULL,
    ADD COLUMN `shipping_address` TEXT NULL,
    ADD COLUMN `tax_code` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `brand_id` INTEGER NULL,
    ADD COLUMN `channel` VARCHAR(100) NULL,
    ADD COLUMN `deposit_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `invoice_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `order_code` VARCHAR(100) NULL,
    ADD COLUMN `payment_method` VARCHAR(100) NULL,
    ADD COLUMN `shipping_address` TEXT NULL,
    ADD COLUMN `shipping_fee` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `warehouse_status` VARCHAR(191) NOT NULL DEFAULT 'not_processed';

-- CreateTable
CREATE TABLE `invoice_brands` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brand_code` VARCHAR(50) NOT NULL,
    `brand_name` VARCHAR(255) NOT NULL,
    `tax_code` VARCHAR(100) NULL,
    `phone` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `email` VARCHAR(255) NULL,
    `bank_name` VARCHAR(255) NULL,
    `bank_account` VARCHAR(100) NULL,
    `bank_holder` VARCHAR(255) NULL,
    `logo_text` VARCHAR(20) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invoice_brands_brand_code_key`(`brand_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `invoices_brand_id_idx` ON `invoices`(`brand_id`);

-- CreateIndex
CREATE INDEX `invoices_invoice_date_idx` ON `invoices`(`invoice_date`);

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `invoice_brands`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
