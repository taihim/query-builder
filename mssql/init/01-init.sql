-- Configure SQL Server to accept unencrypted connections
USE master;
GO

EXEC sys.sp_configure N'show advanced options', 1;
GO
RECONFIGURE;
GO
EXEC sys.sp_configure N'force encryption', 0;
GO
RECONFIGURE;
GO

-- Create a sample database
USE master;
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'SampleDB')
BEGIN
    CREATE DATABASE SampleDB;
END
GO

USE SampleDB;
GO

-- Create a sample customers table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Customers')
BEGIN
    CREATE TABLE Customers (
        CustomerID INT PRIMARY KEY IDENTITY(1,1),
        FirstName NVARCHAR(50) NOT NULL,
        LastName NVARCHAR(50) NOT NULL,
        Email NVARCHAR(100) NOT NULL,
        Phone NVARCHAR(20) NULL,
        Address NVARCHAR(MAX) NULL,
        City NVARCHAR(50) NULL,
        State NVARCHAR(50) NULL,
        ZipCode NVARCHAR(20) NULL,
        Country NVARCHAR(50) NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create a sample orders table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Orders')
BEGIN
    CREATE TABLE Orders (
        OrderID INT PRIMARY KEY IDENTITY(1,1),
        CustomerID INT NOT NULL,
        OrderDate DATETIME DEFAULT GETDATE(),
        ShippingAddress NVARCHAR(MAX) NULL,
        TotalAmount DECIMAL(18, 2) NOT NULL,
        Status NVARCHAR(20) DEFAULT 'Pending',
        CONSTRAINT FK_Orders_Customers FOREIGN KEY (CustomerID)
        REFERENCES Customers(CustomerID)
    );
END
GO

-- Insert sample data
IF NOT EXISTS (SELECT TOP 1 1 FROM Customers)
BEGIN
    INSERT INTO Customers (FirstName, LastName, Email, Phone, Address, City, State, ZipCode, Country)
    VALUES 
        ('John', 'Doe', 'john.doe@example.com', '555-123-4567', '123 Main St', 'New York', 'NY', '10001', 'USA'),
        ('Jane', 'Smith', 'jane.smith@example.com', '555-987-6543', '456 Oak Ave', 'Los Angeles', 'CA', '90001', 'USA'),
        ('Bob', 'Johnson', 'bob.johnson@example.com', '555-456-7890', '789 Pine Rd', 'Chicago', 'IL', '60601', 'USA'),
        ('Alice', 'Williams', 'alice.williams@example.com', '555-789-0123', '321 Elm St', 'Houston', 'TX', '77001', 'USA'),
        ('Charlie', 'Brown', 'charlie.brown@example.com', '555-234-5678', '654 Maple Dr', 'Phoenix', 'AZ', '85001', 'USA');
END
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM Orders)
BEGIN
    INSERT INTO Orders (CustomerID, OrderDate, ShippingAddress, TotalAmount, Status)
    VALUES 
        (1, DATEADD(day, -10, GETDATE()), '123 Main St, New York, NY, 10001', 150.75, 'Delivered'),
        (2, DATEADD(day, -7, GETDATE()), '456 Oak Ave, Los Angeles, CA, 90001', 89.99, 'Shipped'),
        (3, DATEADD(day, -5, GETDATE()), '789 Pine Rd, Chicago, IL, 60601', 299.50, 'Processing'),
        (4, DATEADD(day, -2, GETDATE()), '321 Elm St, Houston, TX, 77001', 49.99, 'Pending'),
        (1, DATEADD(day, -1, GETDATE()), '123 Main St, New York, NY, 10001', 75.25, 'Processing');
END
GO 