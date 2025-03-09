-- Create e-commerce database
CREATE DATABASE IF NOT EXISTS ecommerce;
USE ecommerce;

-- Create Products table
CREATE TABLE IF NOT EXISTS products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create Customers table
CREATE TABLE IF NOT EXISTS customers (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_purchase_date DATE
);

-- Create Orders table
CREATE TABLE IF NOT EXISTS orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(12, 2) NOT NULL,
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  shipping_address TEXT,
  payment_method VARCHAR(50),
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Create Order_Items table
CREATE TABLE IF NOT EXISTS order_items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Insert sample data for Products
INSERT INTO products (name, description, price, stock_quantity, category) VALUES
  ('Smartphone X', 'Latest generation smartphone with high-resolution camera', 899.99, 50, 'Electronics'),
  ('Laptop Pro', '15-inch laptop with SSD and 16GB RAM', 1299.99, 30, 'Electronics'),
  ('Coffee Maker', 'Automatic coffee maker with timer', 79.99, 100, 'Kitchen'),
  ('Running Shoes', 'Lightweight running shoes with cushioned soles', 129.99, 200, 'Footwear'),
  ('Wireless Headphones', 'Noise-cancelling wireless headphones', 199.99, 75, 'Electronics'),
  ('Blender', 'High-speed blender for smoothies and soups', 69.99, 45, 'Kitchen'),
  ('Desk Lamp', 'LED desk lamp with adjustable brightness', 34.99, 150, 'Home'),
  ('Backpack', 'Water-resistant backpack with laptop compartment', 59.99, 120, 'Accessories'),
  ('Smart Watch', 'Fitness tracker and smartwatch with heart rate monitor', 249.99, 60, 'Electronics'),
  ('Yoga Mat', 'Non-slip yoga mat with carrying strap', 29.99, 80, 'Fitness');

-- Insert sample data for Customers
INSERT INTO customers (first_name, last_name, email, phone, address, last_purchase_date) VALUES
  ('John', 'Doe', 'john.doe@example.com', '555-123-4567', '123 Main St, Anytown, USA', '2023-05-15'),
  ('Jane', 'Smith', 'jane.smith@example.com', '555-987-6543', '456 Oak Ave, Somewhere, USA', '2023-06-02'),
  ('Michael', 'Johnson', 'michael.j@example.com', '555-222-3333', '789 Pine Rd, Nowhere, USA', '2023-04-30'),
  ('Emily', 'Brown', 'emily.b@example.com', '555-444-5555', '321 Cedar St, Elsewhere, USA', '2023-06-10'),
  ('David', 'Wilson', 'david.w@example.com', '555-666-7777', '654 Maple Dr, Anywhere, USA', '2023-05-22');

-- Insert sample data for Orders
INSERT INTO orders (customer_id, total_amount, status, shipping_address, payment_method) VALUES
  (1, 899.99, 'delivered', '123 Main St, Anytown, USA', 'Credit Card'),
  (2, 159.98, 'shipped', '456 Oak Ave, Somewhere, USA', 'PayPal'),
  (3, 1299.99, 'processing', '789 Pine Rd, Nowhere, USA', 'Credit Card'),
  (4, 94.98, 'pending', '321 Cedar St, Elsewhere, USA', 'Debit Card'),
  (1, 249.99, 'processing', '123 Main St, Anytown, USA', 'Credit Card'),
  (5, 69.99, 'shipped', '654 Maple Dr, Anywhere, USA', 'PayPal'),
  (2, 229.98, 'delivered', '456 Oak Ave, Somewhere, USA', 'Credit Card');

-- Insert sample data for Order_Items
INSERT INTO order_items (order_id, product_id, quantity, price_per_unit) VALUES
  (1, 1, 1, 899.99),
  (2, 3, 1, 79.99),
  (2, 7, 1, 79.99),
  (3, 2, 1, 1299.99),
  (4, 8, 1, 59.99),
  (4, 7, 1, 34.99),
  (5, 9, 1, 249.99),
  (6, 6, 1, 69.99),
  (7, 5, 1, 199.99),
  (7, 10, 1, 29.99);

-- Create a view for order summaries
CREATE VIEW order_summary AS
SELECT 
  o.order_id,
  CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
  o.order_date,
  o.total_amount,
  o.status,
  COUNT(oi.item_id) AS item_count
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id;

-- Add an index for better performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status); 