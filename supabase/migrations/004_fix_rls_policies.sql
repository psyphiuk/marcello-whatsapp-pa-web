-- Fix RLS policies for customer registration and authentication

-- Drop existing restrictive policies on customers table
DROP POLICY IF EXISTS "Customers can view own data" ON customers;
DROP POLICY IF EXISTS "Customers can update own data" ON customers;

-- Allow public inserts for registration (with proper API protection)
CREATE POLICY "Public can insert for registration" ON customers
    FOR INSERT 
    WITH CHECK (true);

-- Allow customers to view their own data
CREATE POLICY "Users can view own customer data" ON customers
    FOR SELECT 
    USING (
        id = auth.uid()::uuid 
        OR email = auth.email()
    );

-- Allow customers to update their own data
CREATE POLICY "Users can update own customer data" ON customers
    FOR UPDATE 
    USING (
        id = auth.uid()::uuid 
        OR email = auth.email()
    );

-- Allow service role to bypass RLS (for API operations)
CREATE POLICY "Service role bypass" ON customers
    FOR ALL 
    USING (auth.role() = 'service_role');

-- Fix user_sessions policies
DROP POLICY IF EXISTS "Customers can manage own sessions" ON user_sessions;

CREATE POLICY "Service role can manage all sessions" ON user_sessions
    FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT 
    USING (customer_id = auth.uid()::uuid);

-- Fix other tables to allow service role bypass
-- Credentials table
DROP POLICY IF EXISTS "Customers can manage own credentials" ON credentials;

CREATE POLICY "Service role bypass" ON credentials
    FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage own credentials" ON credentials
    FOR ALL 
    USING (customer_id = auth.uid()::uuid);

-- Usage metrics table
DROP POLICY IF EXISTS "Customers can view own metrics" ON usage_metrics;

CREATE POLICY "Service role bypass" ON usage_metrics
    FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own metrics" ON usage_metrics
    FOR SELECT 
    USING (customer_id = auth.uid()::uuid);

-- WhatsApp tables
DROP POLICY IF EXISTS "Customers can manage own conversations" ON whatsapp_conversations;
DROP POLICY IF EXISTS "Customers can manage own messages" ON whatsapp_messages;

CREATE POLICY "Service role bypass" ON whatsapp_conversations
    FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage own conversations" ON whatsapp_conversations
    FOR ALL 
    USING (customer_id = auth.uid()::uuid);

CREATE POLICY "Service role bypass" ON whatsapp_messages
    FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage own messages" ON whatsapp_messages
    FOR ALL 
    USING (customer_id = auth.uid()::uuid);

-- Also fix the subscriptions table from 001_stripe_integration.sql
DROP POLICY IF EXISTS "Customers can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admin can manage all subscriptions" ON subscriptions;

CREATE POLICY "Service role bypass" ON subscriptions
    FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT 
    USING (customer_id = auth.uid()::uuid);

CREATE POLICY "Admin users can manage all subscriptions" ON subscriptions
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM customers 
            WHERE id = auth.uid()::uuid 
            AND settings->>'is_admin' = 'true'
        )
    );

-- Fix billing_events table
DROP POLICY IF EXISTS "Customers can view own billing events" ON billing_events;
DROP POLICY IF EXISTS "Admin can view all billing events" ON billing_events;

CREATE POLICY "Service role bypass" ON billing_events
    FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own billing events" ON billing_events
    FOR SELECT 
    USING (customer_id = auth.uid()::uuid);

CREATE POLICY "Admin users can view all billing events" ON billing_events
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM customers 
            WHERE id = auth.uid()::uuid 
            AND settings->>'is_admin' = 'true'
        )
    );