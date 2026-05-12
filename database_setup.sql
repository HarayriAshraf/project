-- =============================================================================
-- SupplyChain Pro - SQL Server Database Setup Script
-- Run this in Microsoft SQL Server Management Studio (SSMS)
-- Steps:
--   1. Connect to your SQL Server instance
--   2. Open this file (File > Open > File...)
--   3. Press F5 or click Execute
-- =============================================================================

USE master;
GO

-- Create the database if it does not exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'SupplyChainPro')
BEGIN
    CREATE DATABASE SupplyChainPro;
    PRINT 'Database SupplyChainPro created.';
END
ELSE
    PRINT 'Database SupplyChainPro already exists.';
GO

USE SupplyChainPro;
GO

-- =============================================================================
-- USERS
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id          NVARCHAR(100) PRIMARY KEY,
        email       NVARCHAR(255) NOT NULL UNIQUE,
        name        NVARCHAR(255) NOT NULL,
        roleId      NVARCHAR(100),
        role        NVARCHAR(100),
        subsidiary  NVARCHAR(255),
        createdAt   DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Table users created.';
END
GO

-- =============================================================================
-- CLIENTS
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'clients')
BEGIN
    CREATE TABLE clients (
        id             NVARCHAR(100) PRIMARY KEY,
        name           NVARCHAR(255) NOT NULL,
        country        NVARCHAR(100),
        salesRepName   NVARCHAR(255),
        salesRepEmail  NVARCHAR(255),
        subsidiary     NVARCHAR(255),
        section        NVARCHAR(100),
        createdAt      DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Table clients created.';
END
GO

-- =============================================================================
-- PRODUCTS
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'products')
BEGIN
    CREATE TABLE products (
        id             NVARCHAR(100) PRIMARY KEY,
        name           NVARCHAR(255) NOT NULL,
        category       NVARCHAR(255),
        hasBOM         BIT DEFAULT 0,
        leadTimeWeeks  INT DEFAULT 1,
        createdAt      DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Table products created.';
END
GO

-- =============================================================================
-- PRODUCT BOM (Bill of Materials)
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'product_bom')
BEGIN
    CREATE TABLE product_bom (
        id           INT IDENTITY(1,1) PRIMARY KEY,
        productId    NVARCHAR(100) NOT NULL REFERENCES products(id),
        componentId  NVARCHAR(100) NOT NULL REFERENCES products(id),
        qty          DECIMAL(18,4) NOT NULL
    );
    PRINT 'Table product_bom created.';
END
GO

-- =============================================================================
-- SUPPLIERS
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'suppliers')
BEGIN
    CREATE TABLE suppliers (
        id         NVARCHAR(100) PRIMARY KEY,
        name       NVARCHAR(255) NOT NULL,
        country    NVARCHAR(100),
        createdAt  DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Table suppliers created.';
END
GO

-- =============================================================================
-- FORECAST RECORDS
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'forecast_records')
BEGIN
    CREATE TABLE forecast_records (
        id                NVARCHAR(100) PRIMARY KEY,
        section           NVARCHAR(100),
        client            NVARCHAR(255),
        country           NVARCHAR(100),
        product           NVARCHAR(255),
        category          NVARCHAR(255),
        month             INT,
        year              INT,
        version           NVARCHAR(100),
        qty               DECIMAL(18,4),
        sales             DECIMAL(18,2),
        gp                DECIMAL(18,2),
        salesPerson       NVARCHAR(255),
        salesPersonEmail  NVARCHAR(255),
        status            NVARCHAR(50)  DEFAULT 'Draft',
        workflowStatus    NVARCHAR(50)  DEFAULT 'Draft',
        subsidiary        NVARCHAR(255),
        invoicingMonth    INT,
        invoicingYear     INT,
        createdAt         DATETIME2 DEFAULT GETDATE(),
        updatedAt         DATETIME2 DEFAULT GETDATE()
    );
    CREATE INDEX IX_forecast_client    ON forecast_records(client);
    CREATE INDEX IX_forecast_version   ON forecast_records(version);
    CREATE INDEX IX_forecast_year      ON forecast_records(year);
    PRINT 'Table forecast_records created.';
END
GO

-- =============================================================================
-- AUDIT LOGS
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_logs')
BEGIN
    CREATE TABLE audit_logs (
        id              NVARCHAR(100) PRIMARY KEY,
        timestamp       NVARCHAR(50),
        userEmail       NVARCHAR(255),
        recordId        NVARCHAR(100),
        product         NVARCHAR(255),
        actionType      NVARCHAR(50),
        reasonCode      NVARCHAR(255),
        details         NVARCHAR(MAX),
        client          NVARCHAR(255),
        subsidiary      NVARCHAR(255),
        section         NVARCHAR(100),
        salesRep        NVARCHAR(255),
        month           INT,
        year            INT,
        previousMonth   INT,
        previousYear    INT,
        previousQty     DECIMAL(18,4),
        newQty          DECIMAL(18,4),
        previousSales   DECIMAL(18,2),
        newSales        DECIMAL(18,2),
        previousGP      DECIMAL(18,2),
        newGP           DECIMAL(18,2),
        createdAt       DATETIME2 DEFAULT GETDATE()
    );
    CREATE INDEX IX_audit_user      ON audit_logs(userEmail);
    CREATE INDEX IX_audit_client    ON audit_logs(client);
    CREATE INDEX IX_audit_timestamp ON audit_logs(timestamp);
    PRINT 'Table audit_logs created.';
END
GO

-- =============================================================================
-- PURCHASE ORDERS
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'purchase_orders')
BEGIN
    CREATE TABLE purchase_orders (
        id                     NVARCHAR(100) PRIMARY KEY,
        supplierId             NVARCHAR(100),
        productId              NVARCHAR(100),
        quantity               DECIMAL(18,4),
        orderDate              DATE,
        leadTimeWeeks          INT,
        expectedDeliveryDate   DATE,
        actualDeliveryDate     DATE,
        status                 NVARCHAR(50) DEFAULT 'Pending',
        createdAt              DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Table purchase_orders created.';
END
GO

-- =============================================================================
-- CRM ACTIVITIES
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'crm_activities')
BEGIN
    CREATE TABLE crm_activities (
        id                   NVARCHAR(100) PRIMARY KEY,
        clientId             NVARCHAR(100),
        clientName           NVARCHAR(255),
        contactPerson        NVARCHAR(255),
        contactInfo          NVARCHAR(255),
        contactPersonEmail   NVARCHAR(255),
        contactPersonPhone   NVARCHAR(100),
        salesRepName         NVARCHAR(255),
        salesRepEmail        NVARCHAR(255),
        subsidiary           NVARCHAR(255),
        clientSector         NVARCHAR(255),
        country              NVARCHAR(100),
        date                 DATE,
        timestamp            NVARCHAR(100),
        stage                NVARCHAR(100),
        purpose              NVARCHAR(100),
        notes                NVARCHAR(MAX),
        leadSource           NVARCHAR(255),
        potentialValue       DECIMAL(18,2),
        material             NVARCHAR(255),
        clientPrice          DECIMAL(18,4),
        supplierPrice        DECIMAL(18,4),
        clientPaymentTerm    NVARCHAR(255),
        supplierPaymentTerm  NVARCHAR(255),
        supplierName         NVARCHAR(255),
        createdAt            DATETIME2 DEFAULT GETDATE()
    );
    CREATE INDEX IX_crm_salesrep ON crm_activities(salesRepEmail);
    CREATE INDEX IX_crm_stage    ON crm_activities(stage);
    PRINT 'Table crm_activities created.';
END
GO

-- =============================================================================
-- CRM UPDATES (activity history entries)
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'crm_updates')
BEGIN
    CREATE TABLE crm_updates (
        id                   NVARCHAR(100) PRIMARY KEY,
        activityId           NVARCHAR(100) NOT NULL REFERENCES crm_activities(id),
        date                 DATE,
        stage                NVARCHAR(100),
        purpose              NVARCHAR(100),
        notes                NVARCHAR(MAX),
        material             NVARCHAR(255),
        clientPrice          DECIMAL(18,4),
        supplierPrice        DECIMAL(18,4),
        clientPaymentTerm    NVARCHAR(255),
        supplierPaymentTerm  NVARCHAR(255),
        supplierName         NVARCHAR(255),
        createdAt            DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Table crm_updates created.';
END
GO

-- =============================================================================
-- ACTION ITEMS
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'action_items')
BEGIN
    CREATE TABLE action_items (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        title           NVARCHAR(500) NOT NULL,
        description     NVARCHAR(MAX),
        company         NVARCHAR(255),
        status          NVARCHAR(50) DEFAULT 'Open',
        date_opened     DATE,
        due_date        DATE,
        meeting_topic   NVARCHAR(255),
        assignee_email  NVARCHAR(255),
        assignee_name   NVARCHAR(255),
        subsidiary      NVARCHAR(255),
        notes           NVARCHAR(MAX),
        createdAt       DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Table action_items created.';
END
GO

-- =============================================================================
-- ACTION ITEM UPDATES (progress history)
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'action_item_updates')
BEGIN
    CREATE TABLE action_item_updates (
        id              NVARCHAR(100) PRIMARY KEY,
        action_item_id  INT NOT NULL REFERENCES action_items(id),
        date            DATE,
        status          NVARCHAR(50),
        notes           NVARCHAR(MAX),
        timestamp       NVARCHAR(100),
        createdAt       DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Table action_item_updates created.';
END
GO

-- =============================================================================
-- SEED DEFAULT USERS
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM users WHERE id = 'user-1')
BEGIN
    INSERT INTO users (id, email, name, roleId, role, subsidiary) VALUES
        ('user-1', 'admin@company.com',   'Admin User',    'role-admin',   'Admin',        NULL),
        ('user-2', 'sales@company.com',   'Sales Rep',     'role-sales',   'Sales',        'Group A'),
        ('user-3', 'manager@company.com', 'Sales Manager', 'role-manager', 'Manager',      'Group A'),
        ('user-4', 'board@company.com',   'Board Member',  'role-board',   'Board',        NULL),
        ('user-5', 'analyst@company.com', 'Data Analyst',  'role-analyst', 'Data Analyst', NULL);
    PRINT 'Default users seeded.';
END
GO

-- =============================================================================
-- SEED SAMPLE CLIENTS
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM clients WHERE id = 'client-1')
BEGIN
    INSERT INTO clients (id, name, country, salesRepName, salesRepEmail, subsidiary, section) VALUES
        ('client-1', 'Alpha Corp',       'USA',     'John Doe',   'sales@company.com',   'Group A', 'Trade'),
        ('client-2', 'Beta Industries',  'UK',      'John Doe',   'sales@company.com',   'Group A', 'Broker'),
        ('client-3', 'Gamma Logistics',  'UAE',     'Jane Smith', 'jane.smith@company.com', 'Group B', 'Trade'),
        ('client-4', 'Delta Foods',      'Germany', 'Jane Smith', 'jane.smith@company.com', 'Group B', 'Trade'),
        ('client-5', 'Epsilon Trading',  'France',  'Bob Johnson','bob.johnson@company.com','Global',  'Broker');
    PRINT 'Sample clients seeded.';
END
GO

-- =============================================================================
-- SEED SAMPLE PRODUCTS
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM products WHERE id = 'prod-1')
BEGIN
    INSERT INTO products (id, name, category, hasBOM, leadTimeWeeks) VALUES
        ('prod-1', 'Steel Coils',        'Raw Materials', 0, 4),
        ('prod-2', 'Aluminum Sheets',    'Raw Materials', 0, 3),
        ('prod-3', 'Copper Wire',        'Raw Materials', 0, 5),
        ('prod-4', 'Plastic Resins',     'Chemicals',     0, 2),
        ('prod-5', 'Chemical Compounds', 'Chemicals',     0, 6);
    PRINT 'Sample products seeded.';
END
GO

-- =============================================================================
-- SEED SAMPLE SUPPLIERS
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM suppliers WHERE id = 'sup-1')
BEGIN
    INSERT INTO suppliers (id, name, country) VALUES
        ('sup-1', 'MetalWorks Ltd',       'Germany'),
        ('sup-2', 'Pacific Steel Co',     'Japan'),
        ('sup-3', 'Euro Chemicals GmbH',  'Germany'),
        ('sup-4', 'Gulf Polymers',        'UAE'),
        ('sup-5', 'Alpine Metals AG',     'Switzerland');
    PRINT 'Sample suppliers seeded.';
END
GO

PRINT '=== SupplyChainPro database setup complete! ===';
GO
