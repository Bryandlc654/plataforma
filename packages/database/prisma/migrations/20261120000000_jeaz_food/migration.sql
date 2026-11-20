-- Jeaz Food: producto contratado por empresa y por plan ("shop" o "food").
ALTER TABLE `tenants` ADD COLUMN `product` VARCHAR(191) NOT NULL DEFAULT 'shop';
ALTER TABLE `plans` ADD COLUMN `product` VARCHAR(191) NOT NULL DEFAULT 'shop';

-- Pedidos de restaurante: origen, número correlativo, tipo de entrega y costo de envío.
ALTER TABLE `orders`
    ADD COLUMN `source` VARCHAR(191) NOT NULL DEFAULT 'shop',
    ADD COLUMN `order_number` INTEGER NULL,
    ADD COLUMN `fulfillment` VARCHAR(191) NULL,
    ADD COLUMN `delivery_address` TEXT NULL,
    ADD COLUMN `delivery_fee` DECIMAL(65, 30) NOT NULL DEFAULT 0;

-- Opciones elegidas (extras, salsas...) y notas por plato.
ALTER TABLE `order_items`
    ADD COLUMN `options` JSON NULL,
    ADD COLUMN `notes` VARCHAR(191) NULL;

CREATE INDEX `orders_tenant_id_source_created_at_idx` ON `orders`(`tenant_id`, `source`, `created_at`);
