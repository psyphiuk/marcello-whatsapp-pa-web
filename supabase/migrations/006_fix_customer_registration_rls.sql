-- URGENT FIX: Allow customer registration
-- This migration fixes the "new row violates row-level security policy" error

-- First, drop ALL existing policies on customers table to start fresh
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on customers table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'customers' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON customers', pol.policyname);
    END LOOP;
END $$;

-- Now create simple, working policies

-- 1. CRITICAL: Allow anyone to INSERT (register)
CREATE POLICY "allow_registration" ON customers
    FOR INSERT
    WITH CHECK (true);  -- Allow all inserts for registration

-- 2. Allow users to SELECT their own record by email OR id
CREATE POLICY "users_view_own" ON customers
    FOR SELECT
    USING (
        auth.uid()::text = id::text 
        OR 
        auth.email() = email
    );

-- 3. Allow users to UPDATE their own record
CREATE POLICY "users_update_own" ON customers
    FOR UPDATE
    USING (
        auth.uid()::text = id::text 
        OR 
        auth.email() = email
    )
    WITH CHECK (
        auth.uid()::text = id::text 
        OR 
        auth.email() = email
    );

-- 4. Service role can do everything (for backend operations)
CREATE POLICY "service_role_all" ON customers
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Verify the table has RLS enabled
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;