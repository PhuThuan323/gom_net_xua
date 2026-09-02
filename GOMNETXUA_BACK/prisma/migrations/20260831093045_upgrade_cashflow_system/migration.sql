-- AlterTable
ALTER TABLE `expenses` ADD COLUMN `recipient` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `receipts` ADD COLUMN `fee_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `period_code` VARCHAR(100) NULL,
    ADD COLUMN `statement_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `expenses_category_idx` ON `expenses`(`category`);

-- CreateIndex
CREATE INDEX `receipts_category_idx` ON `receipts`(`category`);
