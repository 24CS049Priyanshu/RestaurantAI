-- =============================================================================
-- AI-POWERED RESTAURANT MANAGEMENT & REVENUE INTELLIGENCE SYSTEM
-- Production-Ready Relational Database Schema
-- Version: 1.0.0
-- Created: 2026-03-05
-- Compatible: PostgreSQL 14+
-- =============================================================================

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search on menu items

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE order_status_enum AS ENUM (
    'pending', 'confirmed', 'preparing', 'ready', 'served',
    'completed', 'cancelled', 'refunded'
);

CREATE TYPE order_type_enum AS ENUM (
    'dine_in', 'takeaway', 'delivery', 'drive_thru', 'voice_order'
);

CREATE TYPE payment_status_enum AS ENUM (
    'pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'
);

CREATE TYPE payment_method_enum AS ENUM (
    'cash', 'credit_card', 'debit_card', 'upi', 'wallet', 'online', 'complimentary'
);

CREATE TYPE item_classification_enum AS ENUM (
    'star',        -- High popularity, high margin
    'plow_horse',  -- High popularity, low margin
    'puzzle',      -- Low popularity, high margin
    'dog',         -- Low popularity, low margin
    'hidden_star'  -- Underperforming potential star
);

CREATE TYPE recommendation_type_enum AS ENUM (
    'upsell', 'cross_sell', 'combo', 'substitute', 'seasonal'
);

CREATE TYPE voice_order_status_enum AS ENUM (
    'received', 'processing', 'parsed', 'confirmed', 'failed', 'cancelled'
);

CREATE TYPE modifier_type_enum AS ENUM (
    'add_on', 'variant', 'cooking_preference', 'portion_size', 'allergen_removal'
);

-- =============================================================================
-- TABLE 1: restaurants
-- Core restaurant entity; all other tables are scoped to a restaurant.
-- =============================================================================

CREATE TABLE restaurants (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(200)    NOT NULL,
    slug                VARCHAR(200)    NOT NULL UNIQUE,   -- URL-safe identifier
    phone               VARCHAR(20),
    email               VARCHAR(150)    UNIQUE,
    address_line1       VARCHAR(255),
    address_line2       VARCHAR(255),
    city                VARCHAR(100),
    state               VARCHAR(100),
    country             VARCHAR(100)    NOT NULL DEFAULT 'India',
    postal_code         VARCHAR(20),
    latitude            NUMERIC(10, 7),
    longitude           NUMERIC(10, 7),
    currency_code       CHAR(3)         NOT NULL DEFAULT 'INR',
    timezone            VARCHAR(60)     NOT NULL DEFAULT 'Asia/Kolkata',
    tax_rate            NUMERIC(5, 4)   NOT NULL DEFAULT 0.05,  -- e.g. 0.18 = 18% GST
    service_charge_rate NUMERIC(5, 4)   NOT NULL DEFAULT 0.00,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    ai_features_enabled BOOLEAN         NOT NULL DEFAULT TRUE,
    voice_ordering_enabled BOOLEAN      NOT NULL DEFAULT FALSE,
    subscription_tier   VARCHAR(50)     NOT NULL DEFAULT 'basic',  -- basic, pro, enterprise
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_restaurants_slug         ON restaurants(slug);
CREATE INDEX idx_restaurants_city_country ON restaurants(city, country);
CREATE INDEX idx_restaurants_is_active    ON restaurants(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_restaurants_location     ON restaurants USING GIST (
    ll_to_earth(latitude, longitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;


-- =============================================================================
-- TABLE 2: menu_categories
-- Hierarchical menu categorization (supports parent-child nesting).
-- =============================================================================

CREATE TABLE menu_categories (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id   UUID            NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    parent_id       UUID            REFERENCES menu_categories(id) ON DELETE SET NULL,
    category_name   VARCHAR(150)    NOT NULL,
    description     TEXT,
    display_order   SMALLINT        NOT NULL DEFAULT 0,
    image_url       TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    available_from  TIME,           -- Breakfast category: 06:00
    available_until TIME,           -- Breakfast category: 11:00
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    UNIQUE (restaurant_id, category_name)
);

CREATE INDEX idx_menu_cat_restaurant    ON menu_categories(restaurant_id);
CREATE INDEX idx_menu_cat_parent        ON menu_categories(parent_id);
CREATE INDEX idx_menu_cat_active        ON menu_categories(restaurant_id, is_active)
    WHERE is_active = TRUE;
CREATE INDEX idx_menu_cat_display_order ON menu_categories(restaurant_id, display_order);


-- =============================================================================
-- TABLE 3: menu_items
-- Core menu item catalog with cost and pricing fields for margin analysis.
-- =============================================================================

CREATE TABLE menu_items (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID            NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id         UUID            NOT NULL REFERENCES menu_categories(id),
    item_name           VARCHAR(200)    NOT NULL,
    item_code           VARCHAR(50),    -- Internal SKU / POS code
    description         TEXT,
    selling_price       NUMERIC(10, 2)  NOT NULL CHECK (selling_price >= 0),
    food_cost           NUMERIC(10, 2)  NOT NULL CHECK (food_cost >= 0),
    -- Computed: profit_margin = (selling_price - food_cost) / selling_price
    preparation_time_min SMALLINT       NOT NULL DEFAULT 10, -- minutes
    calories            SMALLINT,
    is_vegetarian       BOOLEAN         NOT NULL DEFAULT FALSE,
    is_vegan            BOOLEAN         NOT NULL DEFAULT FALSE,
    is_gluten_free      BOOLEAN         NOT NULL DEFAULT FALSE,
    spice_level         SMALLINT        CHECK (spice_level BETWEEN 0 AND 5),
    image_url           TEXT,
    is_available        BOOLEAN         NOT NULL DEFAULT TRUE,
    is_featured         BOOLEAN         NOT NULL DEFAULT FALSE,
    display_order       SMALLINT        NOT NULL DEFAULT 0,
    tags                TEXT[],         -- ['bestseller', 'new', 'seasonal']
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    UNIQUE (restaurant_id, item_code)
);

CREATE INDEX idx_menu_items_restaurant      ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category        ON menu_items(category_id);
CREATE INDEX idx_menu_items_available       ON menu_items(restaurant_id, is_available)
    WHERE is_available = TRUE;
CREATE INDEX idx_menu_items_featured        ON menu_items(restaurant_id, is_featured)
    WHERE is_featured = TRUE;
CREATE INDEX idx_menu_items_price           ON menu_items(restaurant_id, selling_price);
CREATE INDEX idx_menu_items_margin          ON menu_items(restaurant_id, selling_price, food_cost);
CREATE INDEX idx_menu_items_name_trgm       ON menu_items USING GIN (item_name gin_trgm_ops);
CREATE INDEX idx_menu_items_tags            ON menu_items USING GIN (tags);


-- =============================================================================
-- TABLE 4: item_modifiers
-- Add-ons, variants, and customization options for menu items.
-- =============================================================================

CREATE TABLE item_modifiers (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id    UUID            NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    restaurant_id   UUID            NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    modifier_name   VARCHAR(150)    NOT NULL,
    modifier_type   modifier_type_enum NOT NULL DEFAULT 'add_on',
    additional_price NUMERIC(8, 2)  NOT NULL DEFAULT 0.00 CHECK (additional_price >= 0),
    additional_cost NUMERIC(8, 2)   NOT NULL DEFAULT 0.00 CHECK (additional_cost >= 0),
    is_required     BOOLEAN         NOT NULL DEFAULT FALSE, -- e.g. must choose size
    max_selections  SMALLINT        NOT NULL DEFAULT 1,
    is_available    BOOLEAN         NOT NULL DEFAULT TRUE,
    display_order   SMALLINT        NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_item_modifiers_menu_item    ON item_modifiers(menu_item_id);
CREATE INDEX idx_item_modifiers_restaurant   ON item_modifiers(restaurant_id);
CREATE INDEX idx_item_modifiers_available    ON item_modifiers(menu_item_id, is_available)
    WHERE is_available = TRUE;


-- =============================================================================
-- TABLE 5: customers
-- Customer identity with profile data for personalization.
-- =============================================================================

CREATE TABLE customers (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID            NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    full_name           VARCHAR(200),
    phone               VARCHAR(20),
    email               VARCHAR(150),
    date_of_birth       DATE,
    gender              CHAR(1)         CHECK (gender IN ('M', 'F', 'O')),
    loyalty_points      INT             NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
    total_spent         NUMERIC(12, 2)  NOT NULL DEFAULT 0.00,
    total_orders        INT             NOT NULL DEFAULT 0,
    preferred_order_type order_type_enum,
    dietary_preferences TEXT[],         -- ['vegetarian', 'gluten_free']
    ai_profile_data     JSONB,          -- Embedding / vector data for personalization
    last_order_at       TIMESTAMPTZ,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    UNIQUE (restaurant_id, phone),
    UNIQUE (restaurant_id, email)
);

CREATE INDEX idx_customers_restaurant   ON customers(restaurant_id);
CREATE INDEX idx_customers_phone        ON customers(phone);
CREATE INDEX idx_customers_email        ON customers(email);
CREATE INDEX idx_customers_loyalty      ON customers(restaurant_id, loyalty_points DESC);
CREATE INDEX idx_customers_last_order   ON customers(restaurant_id, last_order_at DESC);
CREATE INDEX idx_customers_ai_profile   ON customers USING GIN (ai_profile_data);


-- =============================================================================
-- TABLE 6: orders
-- Master order record; links restaurant, customer, and all transactions.
-- =============================================================================

CREATE TABLE orders (
    id                  UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID                NOT NULL REFERENCES restaurants(id),
    customer_id         UUID                REFERENCES customers(id) ON DELETE SET NULL,
    order_number        VARCHAR(30)         NOT NULL,  -- Human-readable: ORD-20260305-0042
    order_type          order_type_enum     NOT NULL,
    table_number        VARCHAR(20),        -- Dine-in table reference
    waiter_id           UUID,               -- FK to staff table (if implemented)
    total_amount        NUMERIC(12, 2)      NOT NULL CHECK (total_amount >= 0),
    discount_amount     NUMERIC(10, 2)      NOT NULL DEFAULT 0.00,
    tax_amount          NUMERIC(10, 2)      NOT NULL DEFAULT 0.00,
    service_charge      NUMERIC(10, 2)      NOT NULL DEFAULT 0.00,
    net_amount          NUMERIC(12, 2)      NOT NULL GENERATED ALWAYS AS
                            (total_amount - discount_amount + tax_amount + service_charge) STORED,
    order_status        order_status_enum   NOT NULL DEFAULT 'pending',
    special_instructions TEXT,
    estimated_ready_at  TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    source_channel      VARCHAR(50)         DEFAULT 'pos',  -- pos, app, web, voice, kiosk
    voice_order_id      UUID,               -- FK to voice_orders (set after creation)
    ai_suggested        BOOLEAN             NOT NULL DEFAULT FALSE,  -- Was order AI-assisted?
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    UNIQUE (restaurant_id, order_number)
);

CREATE INDEX idx_orders_restaurant      ON orders(restaurant_id);
CREATE INDEX idx_orders_customer        ON orders(customer_id);
CREATE INDEX idx_orders_status          ON orders(restaurant_id, order_status);
CREATE INDEX idx_orders_type            ON orders(restaurant_id, order_type);
CREATE INDEX idx_orders_created_at      ON orders(restaurant_id, created_at DESC);
CREATE INDEX idx_orders_completed_at    ON orders(restaurant_id, completed_at DESC)
    WHERE completed_at IS NOT NULL;
CREATE INDEX idx_orders_daily           ON orders(restaurant_id, DATE(created_at));
CREATE INDEX idx_orders_voice           ON orders(voice_order_id)
    WHERE voice_order_id IS NOT NULL;


-- =============================================================================
-- TABLE 7: order_items
-- Line-item detail for each order; captures price at time of sale.
-- =============================================================================

CREATE TABLE order_items (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id    UUID            NOT NULL REFERENCES menu_items(id),
    item_name       VARCHAR(200)    NOT NULL,  -- Snapshot: item name at time of order
    quantity        SMALLINT        NOT NULL   CHECK (quantity > 0),
    item_price      NUMERIC(10, 2)  NOT NULL   CHECK (item_price >= 0),  -- Unit selling price at order time
    item_cost       NUMERIC(10, 2)  NOT NULL   CHECK (item_cost >= 0),   -- Unit food cost at order time
    modifier_ids    UUID[],                    -- Applied modifier IDs
    modifier_notes  TEXT,                      -- Free-text customization
    line_total      NUMERIC(12, 2)  NOT NULL GENERATED ALWAYS AS
                        (quantity * item_price) STORED,
    line_cost       NUMERIC(12, 2)  NOT NULL GENERATED ALWAYS AS
                        (quantity * item_cost) STORED,
    is_complimentary BOOLEAN        NOT NULL DEFAULT FALSE,
    ai_recommended  BOOLEAN         NOT NULL DEFAULT FALSE, -- Was this item AI-upsold?
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order      ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item  ON order_items(menu_item_id);
CREATE INDEX idx_order_items_ai_rec     ON order_items(menu_item_id) WHERE ai_recommended = TRUE;


-- =============================================================================
-- TABLE 8: transactions
-- Financial transaction records linked to orders; supports split payments.
-- =============================================================================

CREATE TABLE transactions (
    id                  UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID                    NOT NULL REFERENCES restaurants(id),
    order_id            UUID                    NOT NULL REFERENCES orders(id),
    transaction_ref     VARCHAR(100)            UNIQUE,     -- Gateway transaction ID
    payment_method      payment_method_enum     NOT NULL,
    payment_status      payment_status_enum     NOT NULL DEFAULT 'pending',
    amount              NUMERIC(12, 2)          NOT NULL CHECK (amount > 0),
    currency_code       CHAR(3)                 NOT NULL DEFAULT 'INR',
    gateway_name        VARCHAR(50),            -- razorpay, stripe, paytm, etc.
    gateway_response    JSONB,                  -- Full raw gateway payload
    refund_amount       NUMERIC(10, 2)          DEFAULT 0.00,
    refund_reason       TEXT,
    processed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_restaurant    ON transactions(restaurant_id);
CREATE INDEX idx_transactions_order         ON transactions(order_id);
CREATE INDEX idx_transactions_ref           ON transactions(transaction_ref);
CREATE INDEX idx_transactions_status        ON transactions(restaurant_id, payment_status);
CREATE INDEX idx_transactions_method        ON transactions(restaurant_id, payment_method);
CREATE INDEX idx_transactions_processed_at  ON transactions(restaurant_id, processed_at DESC);
CREATE INDEX idx_transactions_gateway       ON transactions USING GIN (gateway_response);


-- =============================================================================
-- TABLE 9: ai_item_metrics
-- AI-computed metrics per menu item; refreshed on a scheduled basis.
-- =============================================================================

CREATE TABLE ai_item_metrics (
    id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id                 UUID            NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    restaurant_id           UUID            NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    analysis_period_start   DATE            NOT NULL,
    analysis_period_end     DATE            NOT NULL,
    -- Volume metrics
    total_quantity_sold     INT             NOT NULL DEFAULT 0,
    total_revenue           NUMERIC(14, 2)  NOT NULL DEFAULT 0.00,
    total_cost              NUMERIC(14, 2)  NOT NULL DEFAULT 0.00,
    -- AI-computed scores
    contribution_margin     NUMERIC(12, 2)  NOT NULL DEFAULT 0.00,  -- Revenue - Cost over period
    contribution_margin_pct NUMERIC(5, 4)   NOT NULL DEFAULT 0.00,  -- Margin as % of revenue
    popularity_score        NUMERIC(5, 4)   NOT NULL DEFAULT 0.00,  -- 0.0 - 1.0 normalised
    velocity_score          NUMERIC(5, 4)   NOT NULL DEFAULT 0.00,  -- Orders/day rate
    reorder_rate            NUMERIC(5, 4)   NOT NULL DEFAULT 0.00,  -- % customers reorder
    -- Classification
    item_classification     item_classification_enum NOT NULL DEFAULT 'dog',
    risk_flag               BOOLEAN         NOT NULL DEFAULT FALSE,  -- Margin erosion risk
    hidden_star_flag        BOOLEAN         NOT NULL DEFAULT FALSE,  -- Underpriced high-margin item
    -- Trend data
    trend_direction         VARCHAR(10)     CHECK (trend_direction IN ('rising', 'stable', 'falling')),
    weekly_trend_pct        NUMERIC(7, 4),  -- % change vs prior week
    -- Metadata
    model_version           VARCHAR(50),    -- AI model version that generated this
    confidence_score        NUMERIC(4, 3),  -- 0.000 - 1.000
    computed_at             TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    UNIQUE (item_id, analysis_period_start, analysis_period_end)
);

CREATE INDEX idx_ai_metrics_item            ON ai_item_metrics(item_id);
CREATE INDEX idx_ai_metrics_restaurant      ON ai_item_metrics(restaurant_id);
CREATE INDEX idx_ai_metrics_period          ON ai_item_metrics(restaurant_id, analysis_period_end DESC);
CREATE INDEX idx_ai_metrics_classification  ON ai_item_metrics(restaurant_id, item_classification);
CREATE INDEX idx_ai_metrics_risk            ON ai_item_metrics(restaurant_id, risk_flag) WHERE risk_flag = TRUE;
CREATE INDEX idx_ai_metrics_hidden_star     ON ai_item_metrics(restaurant_id, hidden_star_flag) WHERE hidden_star_flag = TRUE;
CREATE INDEX idx_ai_metrics_popularity      ON ai_item_metrics(restaurant_id, popularity_score DESC);
CREATE INDEX idx_ai_metrics_margin          ON ai_item_metrics(restaurant_id, contribution_margin DESC);


-- =============================================================================
-- TABLE 10: combo_rules
-- AI-generated or manually created combo bundle rules.
-- =============================================================================

CREATE TABLE combo_rules (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID            NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    combo_name          VARCHAR(200)    NOT NULL,
    description         TEXT,
    trigger_item_ids    UUID[]          NOT NULL,   -- Items that trigger this combo offer
    bundled_item_ids    UUID[]          NOT NULL,   -- Items included in the bundle
    combo_price         NUMERIC(10, 2),             -- NULL = no special price (just suggest)
    discount_pct        NUMERIC(5, 2)   DEFAULT 0.00, -- e.g. 15.00 = 15% off if bought together
    min_order_value     NUMERIC(10, 2)  DEFAULT 0.00,
    is_ai_generated     BOOLEAN         NOT NULL DEFAULT FALSE,
    confidence_score    NUMERIC(4, 3),              -- AI confidence in this pairing
    lift_score          NUMERIC(6, 4),              -- Historical revenue lift %
    support_count       INT             DEFAULT 0,  -- Times this combo was purchased together
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    valid_from          DATE,
    valid_until         DATE,
    day_of_week         SMALLINT[],                 -- {1,2,3,4,5} = Mon-Fri only
    time_from           TIME,
    time_until          TIME,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_combo_rules_restaurant     ON combo_rules(restaurant_id);
CREATE INDEX idx_combo_rules_active         ON combo_rules(restaurant_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_combo_rules_trigger        ON combo_rules USING GIN (trigger_item_ids);
CREATE INDEX idx_combo_rules_bundled        ON combo_rules USING GIN (bundled_item_ids);
CREATE INDEX idx_combo_rules_validity       ON combo_rules(restaurant_id, valid_from, valid_until);


-- =============================================================================
-- TABLE 11: upsell_recommendations
-- Real-time AI upsell suggestions attached to a specific order session.
-- =============================================================================

CREATE TABLE upsell_recommendations (
    id                      UUID                        PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id           UUID                        NOT NULL REFERENCES restaurants(id),
    order_id                UUID                        REFERENCES orders(id) ON DELETE SET NULL,
    customer_id             UUID                        REFERENCES customers(id) ON DELETE SET NULL,
    trigger_item_id         UUID                        NOT NULL REFERENCES menu_items(id),
    recommended_item_id     UUID                        NOT NULL REFERENCES menu_items(id),
    recommendation_type     recommendation_type_enum    NOT NULL DEFAULT 'upsell',
    combo_rule_id           UUID                        REFERENCES combo_rules(id),
    confidence_score        NUMERIC(4, 3)               NOT NULL DEFAULT 0.000,
    display_message         TEXT,                       -- "Customers who ordered X also loved Y"
    was_shown               BOOLEAN                     NOT NULL DEFAULT FALSE,
    was_accepted            BOOLEAN,                    -- NULL = not yet actioned
    additional_revenue      NUMERIC(10, 2),             -- Revenue earned if accepted
    model_version           VARCHAR(50),
    created_at              TIMESTAMPTZ                 NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_upsell_restaurant      ON upsell_recommendations(restaurant_id);
CREATE INDEX idx_upsell_order           ON upsell_recommendations(order_id);
CREATE INDEX idx_upsell_customer        ON upsell_recommendations(customer_id);
CREATE INDEX idx_upsell_trigger_item    ON upsell_recommendations(trigger_item_id);
CREATE INDEX idx_upsell_rec_item        ON upsell_recommendations(recommended_item_id);
CREATE INDEX idx_upsell_accepted        ON upsell_recommendations(restaurant_id, was_accepted)
    WHERE was_accepted = TRUE;
CREATE INDEX idx_upsell_created_at      ON upsell_recommendations(restaurant_id, created_at DESC);


-- =============================================================================
-- TABLE 12: price_recommendations
-- AI-generated dynamic pricing suggestions with expected impact projections.
-- =============================================================================

CREATE TABLE price_recommendations (
    id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id           UUID            NOT NULL REFERENCES restaurants(id),
    item_id                 UUID            NOT NULL REFERENCES menu_items(id),
    current_price           NUMERIC(10, 2)  NOT NULL,
    recommended_price       NUMERIC(10, 2)  NOT NULL,
    price_change_pct        NUMERIC(7, 4)   NOT NULL GENERATED ALWAYS AS (
        ((recommended_price - current_price) / NULLIF(current_price, 0)) * 100
    ) STORED,
    current_margin_pct      NUMERIC(5, 4),
    projected_margin_pct    NUMERIC(5, 4),
    reasoning               TEXT            NOT NULL,  -- Human-readable AI rationale
    supporting_data         JSONB,          -- Competitor prices, elasticity data, etc.
    expected_revenue_impact NUMERIC(12, 2), -- Projected Δ revenue over 30 days
    confidence_score        NUMERIC(4, 3),
    status                  VARCHAR(20)     NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'applied', 'rejected', 'expired')),
    applied_at              TIMESTAMPTZ,
    reviewed_by             UUID,           -- Staff/admin user who approved/rejected
    review_notes            TEXT,
    expires_at              TIMESTAMPTZ,
    model_version           VARCHAR(50),
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_rec_restaurant   ON price_recommendations(restaurant_id);
CREATE INDEX idx_price_rec_item         ON price_recommendations(item_id);
CREATE INDEX idx_price_rec_status       ON price_recommendations(restaurant_id, status);
CREATE INDEX idx_price_rec_pending      ON price_recommendations(restaurant_id, created_at DESC)
    WHERE status = 'pending';
CREATE INDEX idx_price_rec_applied      ON price_recommendations(restaurant_id, applied_at DESC)
    WHERE status = 'applied';
CREATE INDEX idx_price_rec_supporting   ON price_recommendations USING GIN (supporting_data);


-- =============================================================================
-- TABLE 13: voice_orders
-- Raw and parsed data from voice-based ordering sessions.
-- =============================================================================

CREATE TABLE voice_orders (
    id                  UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID                    NOT NULL REFERENCES restaurants(id),
    customer_id         UUID                    REFERENCES customers(id) ON DELETE SET NULL,
    session_id          VARCHAR(200)            NOT NULL UNIQUE,  -- STT session identifier
    order_id            UUID                    REFERENCES orders(id) ON DELETE SET NULL,
    -- Audio & transcription
    audio_file_url      TEXT,                   -- S3/GCS path to the raw audio recording
    raw_transcript      TEXT,                   -- Full raw speech-to-text output
    cleaned_transcript  TEXT,                   -- Normalised, punctuated transcript
    -- NLP parsing
    detected_language   VARCHAR(10)             DEFAULT 'en',
    detected_items      JSONB,                  -- [{item: "Paneer Tikka", qty: 2, mods: ["no onion"]}]
    detected_intents    TEXT[],                 -- ['add_item', 'remove_item', 'confirm_order']
    entities_extracted  JSONB,                  -- NER results: quantities, modifiers, etc.
    -- Quality signals
    confidence_score    NUMERIC(4, 3),          -- NLP confidence 0.000 - 1.000
    ambiguity_flags     TEXT[],                 -- Items that needed clarification
    clarification_turns SMALLINT    DEFAULT 0,  -- Number of back-and-forth turns
    -- Processing metadata
    stt_provider        VARCHAR(50),            -- 'google', 'aws', 'azure', 'whisper'
    nlp_model_version   VARCHAR(50),
    processing_time_ms  INT,                    -- End-to-end latency in milliseconds
    status              voice_order_status_enum NOT NULL DEFAULT 'received',
    failure_reason      TEXT,
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_voice_orders_restaurant    ON voice_orders(restaurant_id);
CREATE INDEX idx_voice_orders_customer      ON voice_orders(customer_id);
CREATE INDEX idx_voice_orders_order         ON voice_orders(order_id);
CREATE INDEX idx_voice_orders_session       ON voice_orders(session_id);
CREATE INDEX idx_voice_orders_status        ON voice_orders(restaurant_id, status);
CREATE INDEX idx_voice_orders_created_at    ON voice_orders(restaurant_id, created_at DESC);
CREATE INDEX idx_voice_orders_items         ON voice_orders USING GIN (detected_items);
CREATE INDEX idx_voice_orders_intents       ON voice_orders USING GIN (detected_intents);


-- =============================================================================
-- DEFERRED FOREIGN KEY: orders.voice_order_id -> voice_orders.id
-- Added after both tables are created to resolve circular dependency.
-- =============================================================================

ALTER TABLE orders
    ADD CONSTRAINT fk_orders_voice_order
    FOREIGN KEY (voice_order_id)
    REFERENCES voice_orders(id)
    ON DELETE SET NULL;

CREATE INDEX idx_orders_voice_order_id ON orders(voice_order_id) WHERE voice_order_id IS NOT NULL;


-- =============================================================================
-- TRIGGERS: Auto-update `updated_at` timestamps
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'restaurants', 'menu_categories', 'menu_items', 'item_modifiers',
        'customers', 'orders', 'transactions', 'ai_item_metrics',
        'combo_rules', 'upsell_recommendations', 'price_recommendations', 'voice_orders'
    ] LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%s_set_updated_at
             BEFORE UPDATE ON %s
             FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();',
            tbl, tbl
        );
    END LOOP;
END;
$$;


-- =============================================================================
-- VIEWS: Commonly used analytical queries pre-built as views
-- =============================================================================

-- Current menu with live margin data
CREATE OR REPLACE VIEW v_menu_with_margins AS
SELECT
    mi.id,
    mi.restaurant_id,
    mi.item_name,
    mi.item_code,
    mc.category_name,
    mi.selling_price,
    mi.food_cost,
    ROUND((mi.selling_price - mi.food_cost), 2)                              AS gross_profit,
    ROUND((mi.selling_price - mi.food_cost) / NULLIF(mi.selling_price, 0), 4) AS margin_pct,
    mi.is_available,
    mi.is_featured
FROM menu_items mi
JOIN menu_categories mc ON mc.id = mi.category_id
WHERE mi.is_available = TRUE;


-- Latest AI classification per item
CREATE OR REPLACE VIEW v_latest_ai_metrics AS
SELECT DISTINCT ON (aim.item_id)
    aim.item_id,
    aim.restaurant_id,
    mi.item_name,
    aim.popularity_score,
    aim.contribution_margin,
    aim.contribution_margin_pct,
    aim.item_classification,
    aim.risk_flag,
    aim.hidden_star_flag,
    aim.trend_direction,
    aim.computed_at
FROM ai_item_metrics aim
JOIN menu_items mi ON mi.id = aim.item_id
ORDER BY aim.item_id, aim.analysis_period_end DESC;


-- Daily revenue summary per restaurant
CREATE OR REPLACE VIEW v_daily_revenue AS
SELECT
    o.restaurant_id,
    DATE(o.created_at)          AS order_date,
    COUNT(*)                    AS total_orders,
    SUM(o.net_amount)           AS gross_revenue,
    SUM(o.discount_amount)      AS total_discounts,
    SUM(o.tax_amount)           AS total_tax,
    SUM(oi.line_cost)           AS total_food_cost,
    SUM(o.net_amount - oi.line_cost) AS gross_profit,
    AVG(o.net_amount)           AS avg_order_value
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.order_status = 'completed'
GROUP BY o.restaurant_id, DATE(o.created_at);

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
