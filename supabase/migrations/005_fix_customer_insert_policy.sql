-- Fix customer registration by allowing inserts
-- This migration specifically fixes the "new row violates row-level security policy" error

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow public registration" ON customers;
DROP POLICY IF EXISTS "Service role full access" ON customers;
DROP POLICY IF EXISTS "Users can select by email" ON customers;
DROP POLICY IF EXISTS "Users can update own record" ON customers;

-- Add INSERT policy for customers table to allow registration
CREATE POLICY "Allow public registration" ON customers
    FOR INSERT 
    WITH CHECK (true);

-- Ensure service role can bypass all RLS
CREATE POLICY "Service role full access" ON customers
    FOR ALL 
    USING (auth.role() = 'service_role');

-- If email-based selection is needed
CREATE POLICY "Users can select by email" ON customers
    FOR SELECT 
    USING (
        id = auth.uid()::uuid 
        OR email = auth.email()
        OR auth.role() = 'service_role'
    );

-- Ensure users can update their own records
CREATE POLICY "Users can update own record" ON customers
    FOR UPDATE 
    USING (
        id = auth.uid()::uuid 
        OR email = auth.email()
        OR auth.role() = 'service_role'
    );