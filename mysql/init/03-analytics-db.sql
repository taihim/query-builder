-- Create a second database for testing
CREATE DATABASE IF NOT EXISTS analytics;

-- Use the analytics database for subsequent commands
USE analytics;

-- Create a customers table
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  signup_date DATE NOT NULL,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT TRUE
);

-- Create an orders table with relationship to customers
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Create a products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an order_items join table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Generate larger datasets for pagination testing

-- Generate 500 customers
DELIMITER //
CREATE PROCEDURE generate_customers()
BEGIN
  DECLARE i INT DEFAULT 0;
  DECLARE first_names VARCHAR(500) DEFAULT 'John,Jane,Alice,Bob,Carol,David,Emma,Frank,Grace,Henry,Ivy,Jack,Kate,Leo,Mia,Noah,Olivia,Peter,Quinn,Ryan,Sara,Tom,Uma,Victor,Wendy,Xavier,Yara,Zach';
  DECLARE last_names VARCHAR(500) DEFAULT 'Smith,Johnson,Williams,Brown,Jones,Miller,Davis,Garcia,Rodriguez,Wilson,Martinez,Anderson,Taylor,Thomas,Hernandez,Moore,Martin,Jackson,Thompson,White,Lopez,Lee,Gonzalez,Harris,Clark,Lewis,Robinson,Walker,Perez,Hall';
  DECLARE first_name_array TEXT;
  DECLARE last_name_array TEXT;
  DECLARE random_first TEXT;
  DECLARE random_last TEXT;
  DECLARE email_prefix TEXT;
  DECLARE email_domain TEXT;
  DECLARE domains VARCHAR(200) DEFAULT 'gmail.com,yahoo.com,outlook.com,hotmail.com,example.com,mail.com,protonmail.com,icloud.com';
  DECLARE domain_array TEXT;

  SET first_name_array = first_names;
  SET last_name_array = last_names;
  SET domain_array = domains;

  WHILE i < 500 DO
    -- Generate random names
    SET random_first = SUBSTRING_INDEX(SUBSTRING_INDEX(first_name_array, ',', FLOOR(1 + RAND() * (LENGTH(first_name_array) - LENGTH(REPLACE(first_name_array, ',', ''))))), ',', -1);
    SET random_last = SUBSTRING_INDEX(SUBSTRING_INDEX(last_name_array, ',', FLOOR(1 + RAND() * (LENGTH(last_name_array) - LENGTH(REPLACE(last_name_array, ',', ''))))), ',', -1);
    
    -- Generate email
    SET email_prefix = LOWER(CONCAT(random_first, '.', random_last, FLOOR(RAND() * 1000)));
    SET email_domain = SUBSTRING_INDEX(SUBSTRING_INDEX(domain_array, ',', FLOOR(1 + RAND() * (LENGTH(domain_array) - LENGTH(REPLACE(domain_array, ',', ''))))), ',', -1);
    
    -- Insert customer with random signup date between 2020-01-01 and 2023-12-31
    INSERT IGNORE INTO customers (first_name, last_name, email, signup_date, active) 
    VALUES (
      random_first, 
      random_last, 
      CONCAT(email_prefix, '@', email_domain),
      DATE_ADD('2020-01-01', INTERVAL FLOOR(RAND() * 1460) DAY),
      ROUND(RAND())
    );
    
    SET i = i + 1;
  END WHILE;
END //
DELIMITER ;

-- Call the procedure to generate customers
CALL generate_customers();
DROP PROCEDURE generate_customers;

-- Insert 100 sample products
DELIMITER //
CREATE PROCEDURE generate_products()
BEGIN
  DECLARE i INT DEFAULT 0;
  DECLARE product_name VARCHAR(100);
  DECLARE product_desc TEXT;
  DECLARE product_price DECIMAL(10, 2);
  DECLARE product_stock INT;
  DECLARE product_category VARCHAR(50);
  
  -- Define arrays of product names, adjectives, and categories
  DECLARE categories VARCHAR(500) DEFAULT 'Electronics,Kitchen,Sports,Furniture,Outdoor,Clothing,Books,Beauty,Toys,Home,Office,Automotive,Garden,Pet Supplies,Tools';
  DECLARE adjectives VARCHAR(500) DEFAULT 'Premium,Deluxe,Essential,Professional,Compact,Lightweight,Ergonomic,Advanced,Portable,Adjustable,Wireless,Universal,Smart,Eco-friendly,Heavy-duty,Multi-purpose,Comfortable,Waterproof,Handcrafted,Customizable';
  DECLARE product_types VARCHAR(1000) DEFAULT 'Laptop,Smartphone,Tablet,Headphones,Speaker,Camera,TV,Monitor,Keyboard,Mouse,Blender,Coffee Maker,Toaster,Microwave,Refrigerator,Running Shoes,Yoga Mat,Dumbbells,Treadmill,Exercise Bike,Chair,Desk,Sofa,Bed,Table,Backpack,Tent,Sleeping Bag,Hiking Boots,Fishing Rod,T-Shirt,Jeans,Shoes,Jacket,Dress,Novel,Cookbook,Biography,Dictionary,Magazine';

  WHILE i < 100 DO
    -- Generate random product details
    SET product_category = SUBSTRING_INDEX(SUBSTRING_INDEX(categories, ',', FLOOR(1 + RAND() * (LENGTH(categories) - LENGTH(REPLACE(categories, ',', ''))))), ',', -1);
    SET product_name = CONCAT(
      SUBSTRING_INDEX(SUBSTRING_INDEX(adjectives, ',', FLOOR(1 + RAND() * (LENGTH(adjectives) - LENGTH(REPLACE(adjectives, ',', ''))))), ',', -1),
      ' ',
      SUBSTRING_INDEX(SUBSTRING_INDEX(product_types, ',', FLOOR(1 + RAND() * (LENGTH(product_types) - LENGTH(REPLACE(product_types, ',', ''))))), ',', -1)
    );
    SET product_desc = CONCAT('High-quality ', product_name, ' perfect for everyday use. Features premium materials and excellent craftsmanship.');
    SET product_price = ROUND(10 + RAND() * 990, 2);
    SET product_stock = FLOOR(RAND() * 1000);
    
    INSERT INTO products (name, description, price, stock_quantity, category)
    VALUES (product_name, product_desc, product_price, product_stock, product_category);
    
    SET i = i + 1;
  END WHILE;
END //
DELIMITER ;

-- Call procedure to generate products
CALL generate_products();
DROP PROCEDURE generate_products;

-- Generate 2000 orders with order items
DELIMITER //
CREATE PROCEDURE generate_orders()
BEGIN
  DECLARE i INT DEFAULT 0;
  DECLARE new_order_id INT;
  DECLARE customer_count INT;
  DECLARE product_count INT;
  DECLARE random_customer_id INT;
  DECLARE random_product_id INT;
  DECLARE random_quantity INT;
  DECLARE random_price DECIMAL(10, 2);
  DECLARE order_total DECIMAL(10, 2);
  DECLARE items_count INT;
  DECLARE j INT;
  DECLARE payment_methods VARCHAR(100) DEFAULT 'credit_card,paypal,bank_transfer,cash,check,cryptocurrency';
  DECLARE order_statuses VARCHAR(100) DEFAULT 'pending,processing,shipped,delivered,completed,cancelled,refunded';
  DECLARE random_payment VARCHAR(50);
  DECLARE random_status VARCHAR(20);
  
  SELECT COUNT(*) INTO customer_count FROM customers;
  SELECT COUNT(*) INTO product_count FROM products;
  
  WHILE i < 2000 DO
    -- Generate a random order
    SET random_customer_id = 1 + FLOOR(RAND() * customer_count);
    SET random_payment = SUBSTRING_INDEX(SUBSTRING_INDEX(payment_methods, ',', FLOOR(1 + RAND() * (LENGTH(payment_methods) - LENGTH(REPLACE(payment_methods, ',', ''))))), ',', -1);
    SET random_status = SUBSTRING_INDEX(SUBSTRING_INDEX(order_statuses, ',', FLOOR(1 + RAND() * (LENGTH(order_statuses) - LENGTH(REPLACE(order_statuses, ',', ''))))), ',', -1);
    
    -- Set a random date between 2021-01-01 and now
    SET order_total = 0;
    
    INSERT INTO orders (customer_id, order_date, total_amount, status, payment_method)
    VALUES (
      random_customer_id, 
      DATE_ADD('2021-01-01', INTERVAL FLOOR(RAND() * DATEDIFF(NOW(), '2021-01-01')) DAY),
      0, -- Will update this later
      random_status,
      random_payment
    );
    
    SET new_order_id = LAST_INSERT_ID();
    SET items_count = 1 + FLOOR(RAND() * 5); -- 1 to 5 items per order
    SET j = 0;
    
    -- Add order items
    WHILE j < items_count DO
      SET random_product_id = 1 + FLOOR(RAND() * product_count);
      SET random_quantity = 1 + FLOOR(RAND() * 5);
      
      -- Get the actual price from the products table
      SELECT price INTO random_price FROM products WHERE id = random_product_id;
      
      INSERT INTO order_items (order_id, product_id, quantity, price_per_unit)
      VALUES (new_order_id, random_product_id, random_quantity, random_price);
      
      -- Update order total
      SET order_total = order_total + (random_price * random_quantity);
      
      SET j = j + 1;
    END WHILE;
    
    -- Update order total
    UPDATE orders SET total_amount = order_total WHERE id = new_order_id;
    
    SET i = i + 1;
  END WHILE;
END //
DELIMITER ;

-- Call procedure to generate orders
CALL generate_orders();
DROP PROCEDURE generate_orders;

-- Create a user with access to this database
CREATE USER IF NOT EXISTS 'analytics_user'@'%' IDENTIFIED BY 'analytics123';
GRANT ALL PRIVILEGES ON analytics.* TO 'analytics_user'@'%';
FLUSH PRIVILEGES; 