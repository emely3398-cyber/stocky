-- Database schema for Stockly Inventory Management
-- Only table structure is defined here. No sample/fictitious data is inserted.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost DECIMAL(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 8,
  icon VARCHAR(100) NOT NULL DEFAULT 'Package',
  tone VARCHAR(50) NOT NULL DEFAULT 'violet',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_category_stock ON products(category, stock);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Movements table
CREATE TABLE IF NOT EXISTS movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(10) CHECK (type IN ('in', 'out')) NOT NULL,
  quantity INTEGER NOT NULL,
  date TIMESTAMP NOT NULL,
  reason VARCHAR(255),
  supplier VARCHAR(255),
  reference VARCHAR(255),
  responsible VARCHAR(100),
  notes TEXT,
  previous_stock INTEGER NOT NULL,
  resulting_stock INTEGER NOT NULL,
  source VARCHAR(50) DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movements_product_id ON movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON movements(type);
CREATE INDEX IF NOT EXISTS idx_movements_date ON movements(date);
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON movements(created_at);
CREATE INDEX IF NOT EXISTS idx_movements_product_date ON movements(product_id, date);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL DEFAULT 'Stockly',
  business_type VARCHAR(100) NOT NULL DEFAULT 'Tecnología y electrónica',
  timezone VARCHAR(100) NOT NULL DEFAULT 'Ciudad de México',
  default_minimum VARCHAR(10) NOT NULL DEFAULT '8',
  show_out_of_stock BOOLEAN NOT NULL DEFAULT true,
  low_stock_alerts BOOLEAN NOT NULL DEFAULT true,
  weekly_summary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reporting views
CREATE OR REPLACE VIEW product_summary AS
SELECT
  p.id, p.sku, p.name, p.description, p.category,
  p.price, p.cost, p.stock, p.min_stock, p.icon, p.tone,
  p.created_at, p.updated_at, c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category = c.name;

CREATE OR REPLACE VIEW category_summary AS
SELECT
  c.id, c.name,
  COUNT(p.id) as product_count,
  COALESCE(SUM(p.stock), 0) as total_units,
  COALESCE(SUM(p.price * p.stock), 0) as total_value
FROM categories c
LEFT JOIN products p ON c.name = p.category
GROUP BY c.id, c.name;

CREATE OR REPLACE VIEW movement_summary AS
SELECT
  m.id, m.product_id, m.type, m.quantity, m.date, m.reason,
  m.supplier, m.reference, m.responsible, m.notes,
  m.previous_stock, m.resulting_stock, m.source, m.created_at,
  p.name as product_name, p.sku as product_sku
FROM movements m
JOIN products p ON m.product_id = p.id;
