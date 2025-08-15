-- System configuration table for pricing and other settings
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default pricing configuration
INSERT INTO system_config (key, value) VALUES 
('pricing', '{"setupFee": 500, "basicMonthly": 100, "proMonthly": 200, "currency": "eur"}')
ON CONFLICT (key) DO NOTHING;

-- Discount codes table
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    percent_off INTEGER NOT NULL CHECK (percent_off >= 0 AND percent_off <= 100),
    skip_setup_fee BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    uses_count INTEGER DEFAULT 0,
    max_uses INTEGER,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP
);

-- Subscriptions table (already exists but adding if not)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    plan VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Billing events table
CREATE TABLE IF NOT EXISTS billing_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    stripe_event_id TEXT UNIQUE,
    event_type VARCHAR(50),
    amount_cents INTEGER,
    currency VARCHAR(3) DEFAULT 'EUR',
    customer_stripe_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add Stripe fields to customers table if they don't exist
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_customer ON billing_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_stripe_id ON billing_events(stripe_event_id);

-- Row Level Security
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Policies for admin access only
CREATE POLICY "Admin can manage system config" ON system_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM customers 
            WHERE id = auth.uid()::uuid 
            AND settings->>'is_admin' = 'true'
        )
    );

CREATE POLICY "Admin can manage discount codes" ON discount_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM customers 
            WHERE id = auth.uid()::uuid 
            AND settings->>'is_admin' = 'true'
        )
    );

CREATE POLICY "Customers can view own subscriptions" ON subscriptions
    FOR SELECT USING (customer_id = auth.uid()::uuid);

CREATE POLICY "Admin can manage all subscriptions" ON subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM customers 
            WHERE id = auth.uid()::uuid 
            AND settings->>'is_admin' = 'true'
        )
    );

CREATE POLICY "Customers can view own billing events" ON billing_events
    FOR SELECT USING (customer_id = auth.uid()::uuid);

CREATE POLICY "Admin can view all billing events" ON billing_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM customers 
            WHERE id = auth.uid()::uuid 
            AND settings->>'is_admin' = 'true'
        )
    );