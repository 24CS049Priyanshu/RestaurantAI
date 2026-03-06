-- ═══════════════════════════════════════════════════════════════
-- RESTAURANT MANAGEMENT SYSTEM - DATABASE SCHEMA
-- PostgreSQL Database
-- ═══════════════════════════════════════════════════════════════

-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS price_recommendations CASCADE;
DROP TABLE IF EXISTS combo_rules CASCADE;
DROP TABLE IF EXISTS ai_item_metrics CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS otp_verifications CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- 1. RESTAURANTS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    location VARCHAR(500) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE,
    description TEXT,
    cuisine_type VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════
-- 2. USERS TABLE (Admin & Restaurant Managers)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'restaurant_manager', 'staff')),
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════
-- 3. CUSTOMERS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════
-- 4. OTP VERIFICATIONS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE otp_verifications (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    attempts INTEGER DEFAULT 0 CHECK (attempts >= 0),
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster OTP lookups
CREATE INDEX idx_otp_phone_expires ON otp_verifications(phone, expires_at);

-- ═══════════════════════════════════════════════════════════════
-- 5. MENU CATEGORIES TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE menu_categories (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(restaurant_id, category_name)
);

-- ═══════════════════════════════════════════════════════════════
-- 6. MENU ITEMS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    food_cost DECIMAL(10, 2) CHECK (food_cost >= 0),
    availability BOOLEAN DEFAULT TRUE,
    prep_time_minutes INTEGER,
    rating DECIMAL(3, 1) DEFAULT 4.5,
    reviews_count INTEGER DEFAULT 0,
    image_url VARCHAR(500),
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_spicy BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster menu queries
CREATE INDEX idx_menu_items_restaurant_category ON menu_items(restaurant_id, category_id);
CREATE INDEX idx_menu_items_availability ON menu_items(availability);

-- ═══════════════════════════════════════════════════════════════
-- 7. ORDERS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE RESTRICT,
    order_status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'completed', 'cancelled')),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    tax DECIMAL(10, 2) DEFAULT 0 CHECK (tax >= 0),
    delivery_fee DECIMAL(10, 2) DEFAULT 40 CHECK (delivery_fee >= 0),
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
    delivery_address TEXT NOT NULL,
    delivery_type VARCHAR(20) DEFAULT 'home' CHECK (delivery_type IN ('home', 'pickup')),
    special_instructions TEXT,
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster order queries
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- 8. ORDER ITEMS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    item_price DECIMAL(10, 2) NOT NULL CHECK (item_price >= 0),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster order item queries
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item ON order_items(menu_item_id);

-- ═══════════════════════════════════════════════════════════════
-- 9. PAYMENTS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'upi', 'digital_wallet')),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    amount_paid DECIMAL(10, 2) NOT NULL CHECK (amount_paid >= 0),
    transaction_id VARCHAR(255),
    gateway_response TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for payment queries
CREATE INDEX idx_payments_status ON payments(payment_status);

-- ═══════════════════════════════════════════════════════════════
-- 10. AI ITEM METRICS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE ai_item_metrics (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER NOT NULL UNIQUE REFERENCES menu_items(id) ON DELETE CASCADE,
    total_orders INTEGER DEFAULT 0 CHECK (total_orders >= 0),
    margin DECIMAL(5, 2) CHECK (margin >= 0 AND margin <= 100),
    popularity_score DECIMAL(5, 3) DEFAULT 0.5 CHECK (popularity_score >= 0 AND popularity_score <= 1),
    classification VARCHAR(50) DEFAULT 'medium' CHECK (classification IN ('high_margin', 'medium_margin', 'low_margin', 'bestseller', 'slow_mover')),
    demand_trend VARCHAR(20) DEFAULT 'stable' CHECK (demand_trend IN ('increasing', 'stable', 'decreasing')),
    seasonal_factor DECIMAL(3, 2) DEFAULT 1.0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for analytics queries
CREATE INDEX idx_ai_metrics_classification ON ai_item_metrics(classification);
CREATE INDEX idx_ai_metrics_popularity ON ai_item_metrics(popularity_score DESC);

-- ═══════════════════════════════════════════════════════════════
-- 11. COMBO RULES TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE combo_rules (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    item_a_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    item_b_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    support DECIMAL(5, 3) DEFAULT 0 CHECK (support >= 0 AND support <= 1),
    confidence DECIMAL(5, 3) DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
    lift DECIMAL(5, 3) DEFAULT 1 CHECK (lift >= 0),
    combo_discount_percentage DECIMAL(5, 2) DEFAULT 10 CHECK (combo_discount_percentage >= 0 AND combo_discount_percentage <= 100),
    frequency_together INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(restaurant_id, item_a_id, item_b_id)
);

-- Index for combo queries
CREATE INDEX idx_combo_rules_restaurant ON combo_rules(restaurant_id);
CREATE INDEX idx_combo_rules_lift ON combo_rules(lift DESC);

-- ═══════════════════════════════════════════════════════════════
-- 12. PRICE RECOMMENDATIONS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE price_recommendations (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER NOT NULL UNIQUE REFERENCES menu_items(id) ON DELETE CASCADE,
    current_price DECIMAL(10, 2) NOT NULL CHECK (current_price >= 0),
    recommended_price DECIMAL(10, 2) NOT NULL CHECK (recommended_price >= 0),
    suggested_price DECIMAL(10, 2) NOT NULL CHECK (suggested_price >= 0),
    profit_change_percentage DECIMAL(5, 2),
    confidence_score DECIMAL(5, 3) DEFAULT 0.7 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    algorithm_used VARCHAR(100),
    recommendation_reason TEXT,
    is_applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for price queries
CREATE INDEX idx_price_recommendations_applied ON price_recommendations(is_applied);

-- ═══════════════════════════════════════════════════════════════
-- SAMPLE DATA INSERTION
-- ═══════════════════════════════════════════════════════════════

-- Sample restaurant
INSERT INTO restaurants (name, location, contact_number, email, description, cuisine_type)
VALUES ('Spice Garden', '123 Main Street, Downtown', '9876543210', 'info@spicegarden.com', 'Authentic Indian Cuisine', 'Indian');

-- Sample user (Restaurant Manager)
INSERT INTO users (name, email, password, phone, role, restaurant_id)
VALUES ('Rajesh Kumar', 'raj@spicegarden.com', '$2b$10$HASH_HERE', '9001234567', 'restaurant_manager', 1);

-- Sample admin user
INSERT INTO users (name, email, password, phone, role)
VALUES ('Admin User', 'admin@system.com', '$2b$10$HASH_HERE', '9000000000', 'admin');

-- Sample customer
INSERT INTO customers (name, phone, email, address, city, postal_code)
VALUES ('John Doe', '9876543210', 'john@email.com', '123 Customer St', 'Delhi', '110001');

-- Sample menu categories
INSERT INTO menu_categories (restaurant_id, category_name, description, display_order)
VALUES 
    (1, 'Curries', 'Delicious curry dishes', 1),
    (1, 'Breads', 'Traditional breads', 2),
    (1, 'Appetizers', 'Starters and appetizers', 3),
    (1, 'Desserts', 'Sweet desserts', 4),
    (1, 'Beverages', 'Drinks', 5);

-- Sample menu items
INSERT INTO menu_items (restaurant_id, category_id, item_name, description, icon, price, food_cost, is_vegetarian, rating, reviews_count)
VALUES
    (1, 1, 'Butter Chicken', 'Creamy tomato-based curry', '🍗', 280, 90, false, 4.8, 245),
    (1, 1, 'Paneer Butter Masala', 'Paneer in creamy sauce', '🧀', 260, 80, true, 4.7, 189),
    (1, 2, 'Naan', 'Traditional bread', '🍞', 80, 15, true, 4.5, 456),
    (1, 2, 'Garlic Naan', 'Garlic flavored bread', '🧄', 100, 20, true, 4.6, 321),
    (1, 3, 'Samosa', 'Crispy pastry with filling', '🥟', 60, 18, true, 4.3, 512),
    (1, 3, 'Paneer Tikka', 'Grilled paneer', '🧀', 220, 70, true, 4.6, 287),
    (1, 4, 'Gulab Jamun', 'Sweet fried dumplings', '🍡', 120, 30, true, 4.7, 234),
    (1, 5, 'Mango Lassi', 'Yogurt-based drink', '🥤', 90, 20, true, 4.4, 156);

-- Sample AI metrics
INSERT INTO ai_item_metrics (menu_item_id, total_orders, margin, popularity_score, classification, demand_trend)
VALUES
    (1, 450, 67.86, 0.95, 'bestseller', 'increasing'),
    (2, 380, 69.23, 0.92, 'bestseller', 'stable'),
    (3, 890, 81.25, 0.98, 'high_margin', 'stable'),
    (4, 750, 80.00, 0.96, 'high_margin', 'stable'),
    (5, 520, 70.00, 0.85, 'medium_margin', 'stable'),
    (6, 420, 68.18, 0.88, 'medium_margin', 'increasing'),
    (7, 280, 75.00, 0.72, 'medium_margin', 'decreasing'),
    (8, 210, 77.78, 0.65, 'low_margin', 'stable');

-- Sample combo rules
INSERT INTO combo_rules (restaurant_id, item_a_id, item_b_id, support, confidence, lift, combo_discount_percentage)
VALUES
    (1, 1, 3, 0.45, 0.78, 1.85, 15),
    (1, 2, 4, 0.42, 0.76, 1.82, 12),
    (1, 5, 3, 0.38, 0.72, 1.65, 10),
    (1, 6, 4, 0.35, 0.70, 1.58, 10);

-- Sample price recommendations
INSERT INTO price_recommendations (menu_item_id, current_price, recommended_price, suggested_price, profit_change_percentage, confidence_score, algorithm_used, recommendation_reason)
VALUES
    (1, 280, 310, 305, 8.5, 0.85, 'demand_elasticity', 'High demand, room for price increase'),
    (2, 260, 280, 275, 5.2, 0.80, 'competitive_analysis', 'Competitive pricing opportunity'),
    (3, 80, 100, 95, 15.0, 0.88, 'dynamic_pricing', 'Peak hour elasticity'),
    (7, 120, 110, 115, -2.5, 0.72, 'demand_elasticity', 'Slow mover, consider discount');

-- Create views for easier queries
CREATE VIEW order_summary AS
SELECT 
    o.id,
    o.customer_id,
    c.name as customer_name,
    c.phone as customer_phone,
    o.restaurant_id,
    r.name as restaurant_name,
    o.order_status,
    o.total_price,
    o.created_at,
    COUNT(oi.id) as item_count
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN restaurants r ON o.restaurant_id = r.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, c.id, r.id;

CREATE VIEW menu_performance AS
SELECT 
    mi.id,
    mi.item_name,
    mi.price,
    mi.food_cost,
    aim.total_orders,
    aim.margin,
    aim.popularity_score,
    aim.classification,
    COUNT(oi.id) as recent_orders,
    AVG(mi.rating) as avg_rating
FROM menu_items mi
LEFT JOIN ai_item_metrics aim ON mi.id = aim.menu_item_id
LEFT JOIN order_items oi ON mi.id = oi.menu_item_id 
    AND oi.created_at > NOW() - INTERVAL '30 days'
GROUP BY mi.id, aim.id;

-- ═══════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- ═══════════════════════════════════════════════════════════════
