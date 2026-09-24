-- CreateTable
CREATE TABLE `blog_articles` (
    `id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL,
    `site_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NULL,
    `content` LONGTEXT NOT NULL,
    `cover_image` VARCHAR(191) NULL,
    `author_name` VARCHAR(191) NULL,
    `tags` JSON NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `published_at` DATETIME(3) NULL,
    `seo_title` VARCHAR(191) NULL,
    `seo_desc` VARCHAR(191) NULL,
    `seo_image` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blog_articles_site_id_slug_key`(`site_id`, `slug`),
    INDEX `blog_articles_site_id_idx`(`site_id`),
    INDEX `blog_articles_site_id_is_published_published_at_idx`(`site_id`, `is_published`, `published_at`),
    INDEX `blog_articles_tenant_id_idx`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `blog_articles` ADD CONSTRAINT `blog_articles_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_articles` ADD CONSTRAINT `blog_articles_site_id_fkey` FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
