-- Security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path TEXT,
    status_code INTEGER,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    details JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Failed login attempts tracking
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    attempt_time TIMESTAMP DEFAULT NOW(),
    error_type VARCHAR(50)
);

-- Indexes for performance
CREATE INDEX idx_security_audit_user ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_action ON security_audit_log(action);
CREATE INDEX idx_security_audit_created ON security_audit_log(created_at DESC);
CREATE INDEX idx_security_audit_ip ON security_audit_log(ip_address);

CREATE INDEX idx_admin_audit_user ON admin_audit_log(user_id);
CREATE INDEX idx_admin_audit_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_timestamp ON admin_audit_log(timestamp DESC);

CREATE INDEX idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX idx_failed_login_ip ON failed_login_attempts(ip_address);
CREATE INDEX idx_failed_login_time ON failed_login_attempts(attempt_time DESC);

-- Row Level Security
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Policies
-- Only admins can view security audit logs
CREATE POLICY "Admin can view security audit logs" ON security_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customers 
            WHERE id = auth.uid()::uuid 
            AND settings->>'is_admin' = 'true'
        )
    );

-- Only admins can view admin audit logs
CREATE POLICY "Admin can view admin audit logs" ON admin_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customers 
            WHERE id = auth.uid()::uuid 
            AND settings->>'is_admin' = 'true'
        )
    );

-- Only admins can view failed login attempts
CREATE POLICY "Admin can view failed login attempts" ON failed_login_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customers 
            WHERE id = auth.uid()::uuid 
            AND settings->>'is_admin' = 'true'
        )
    );

-- Function to clean up old audit logs (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM security_audit_log WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM admin_audit_log WHERE timestamp < NOW() - INTERVAL '90 days';
    DELETE FROM failed_login_attempts WHERE attempt_time < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old logs (requires pg_cron extension)
-- This should be set up in Supabase dashboard or run manually periodically
-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * *', 'SELECT cleanup_old_audit_logs();');