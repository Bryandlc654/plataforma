-- AlterTable
ALTER TABLE `reviews` ADD COLUMN `ip_address` VARCHAR(45) NULL,
ADD COLUMN `user_agent` VARCHAR(300) NULL;