-- Create table for storing data source credentials
CREATE TABLE IF NOT EXISTS data_sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  host VARCHAR(255) NOT NULL,
  port INT NOT NULL,
  database_name VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add an initial data source pointing to our main database
INSERT INTO data_sources (name, type, host, port, database_name, username, password)
VALUES ('Sample Database', 'mysql', 'mysql', 3306, 'querytool', 'admin', 'admin123'); 