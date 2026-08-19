-- Initialize Databases for SmartCart Microservices
CREATE DATABASE IF NOT EXISTS `auth_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `user_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `product_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `order_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `inventory_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `payment_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `notification_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant privileges
GRANT ALL PRIVILEGES ON `auth_db`.* TO 'smartcart_user'@'%';
GRANT ALL PRIVILEGES ON `user_db`.* TO 'smartcart_user'@'%';
GRANT ALL PRIVILEGES ON `product_db`.* TO 'smartcart_user'@'%';
GRANT ALL PRIVILEGES ON `order_db`.* TO 'smartcart_user'@'%';
GRANT ALL PRIVILEGES ON `inventory_db`.* TO 'smartcart_user'@'%';
GRANT ALL PRIVILEGES ON `payment_db`.* TO 'smartcart_user'@'%';
GRANT ALL PRIVILEGES ON `notification_db`.* TO 'smartcart_user'@'%';

FLUSH PRIVILEGES;
