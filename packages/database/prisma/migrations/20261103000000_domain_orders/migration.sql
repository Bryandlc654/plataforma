-- CreateTable
CREATE TABLE `domain_orders` (
    `id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL,
    `site_id` VARCHAR(191) NULL,
    `domain` VARCHAR(191) NOT NULL,
    `hostinger_item_id` VARCHAR(191) NOT NULL,
    `years` INTEGER NOT NULL DEFAULT 1,
    `price_cents` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending_payment',
    `paypal_order_id` VARCHAR(191) NULL,
    `paypal_capture_id` VARCHAR(191) NULL,
    `hostinger_order_id` VARCHAR(191) NULL,
    `hostinger_subscription_id` VARCHAR(191) NULL,
    `dns_connected` BOOLEAN NOT NULL DEFAULT false,
    `error_message` TEXT NULL,
    `created_by_user_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `registered_at` DATETIME(3) NULL,

    INDEX `domain_orders_tenant_id_created_at_idx`(`tenant_id`, `created_at`),
    INDEX `domain_orders_domain_idx`(`domain`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
