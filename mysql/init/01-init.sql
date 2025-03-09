USE querytool;

-- Create data_sources table
CREATE TABLE data_sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('mysql', 'postgres', 'sqlite') NOT NULL,
  host VARCHAR(255) NOT NULL,
  port INT NOT NULL,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  database_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create sample tables for the application

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Products table
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL
);

-- Order_items table
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- Categories table
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  parent_id INT
);

-- Add some sample data
INSERT INTO users (username, email) VALUES 
('johndoe', 'john@example.com'),
('janedoe', 'jane@example.com'),
('samsmith', 'sam@example.com');

INSERT INTO categories (name) VALUES 
('Electronics'),
('Clothing'),
('Books'),
('Home & Kitchen');

INSERT INTO products (name, price, category_id, description) VALUES 
('Smartphone', 699.99, 1, 'Latest model smartphone with advanced features'),
('Laptop', 1299.99, 1, 'High performance laptop for professionals'),
('T-shirt', 19.99, 2, 'Cotton t-shirt, available in multiple colors'),
('Jeans', 49.99, 2, 'Classic fit denim jeans'),
('Novel', 14.99, 3, 'Bestselling fiction novel');

INSERT INTO orders (user_id, status, total_amount) VALUES 
(1, 'completed', 749.98),
(2, 'processing', 1299.99),
(3, 'completed', 34.98);

INSERT INTO order_items (order_id, product_id, quantity, price) VALUES 
(1, 1, 1, 699.99),
(1, 3, 2, 19.99),
(2, 2, 1, 1299.99),
(3, 5, 2, 14.99);

-- Grant privileges to admin user
GRANT ALL PRIVILEGES ON querytool.* TO 'admin'@'%';
FLUSH PRIVILEGES; 