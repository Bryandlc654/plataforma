-- AlterTable
ALTER TABLE `roles` ADD COLUMN `tenant_id` VARCHAR(191) NULL;

-- DropIndex
DROP INDEX `roles_name_key` ON `roles`;

-- CreateIndex
CREATE INDEX `roles_tenant_id_idx` ON `roles`(`tenant_id`);
CREATE UNIQUE INDEX `roles_name_tenant_id_key` ON `roles`(`name`, `tenant_id`);

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;