-- Intentos fallidos por código de verificación (antes en memoria de cada instancia).
ALTER TABLE `email_verifications` ADD COLUMN `attempts` INTEGER NOT NULL DEFAULT 0;

-- Barrido de pedidos en línea vencidos (status = 'pending' y created_at antiguo).
CREATE INDEX `orders_status_created_at_idx` ON `orders`(`status`, `created_at`);
