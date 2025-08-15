-- Add MFA support to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS mfa_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_mfa_challenge TIMESTAMP;

-- Table for MFA verification attempts
CREATE TABLE IF NOT EXISTS mfa_verification_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    attempted_at TIMESTAMP DEFAULT NOW()
);

-- Session management table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    last_activity TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    mfa_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- IP whitelist for admin access
CREATE TABLE IF NOT EXISTS admin_ip_whitelist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address INET NOT NULL UNIQUE,
    description TEXT,
    added_by UUID REFERENCES customers(id),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- API keys for service integrations
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    permissions JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Security notifications settings
CREATE TABLE IF NOT EXISTS security_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
    notify_login BOOLEAN DEFAULT TRUE,
    notify_failed_login BOOLEAN DEFAULT TRUE,
    notify_new_device BOOLEAN DEFAULT TRUE,
    notify_password_change BOOLEAN DEFAULT TRUE,
    notify_mfa_change BOOLEAN DEFAULT TRUE,
    notification_email TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Device tracking for trusted devices
CREATE TABLE IF NOT EXISTS trusted_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    device_name TEXT,
    browser TEXT,
    os TEXT,
    last_seen TIMESTAMP DEFAULT NOW(),
    trusted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_mfa_attempts_customer ON mfa_verification_attempts(customer_id);
CREATE INDEX idx_mfa_attempts_time ON mfa_verification_attempts(attempted_at DESC);
CREATE INDEX idx_sessions_customer ON user_sessions(customer_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_api_keys_customer ON api_keys(customer_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_trusted_devices_customer ON trusted_devices(customer_id);
CREATE INDEX idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);

-- Row Level Security
ALTER TABLE mfa_verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own MFA attempts
CREATE POLICY "Users view own MFA attempts" ON mfa_verification_attempts
    FOR SELECT USING (customer_id = auth.uid()::uuid);

-- Users can manage their own sessions
CREATE POLICY "Users manage own sessions" ON user_sessions
    FOR ALL USING (customer_id = auth.uid()::uuid);

-- Only admins can manage IP whitelist
CREATE POLICY "Admin manage IP whitelist" ON admin_ip_whitelist
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM customers 
            WHERE id = auth.uid()::uuid 
            AND settings->>'is_admin' = 'true'
        )
    );

-- Users can manage their own API keys
CREATE POLICY "Users manage own API keys" ON api_keys
    FOR ALL USING (customer_id = auth.uid()::uuid);

-- Users can manage their own notification settings
CREATE POLICY "Users manage own notifications" ON security_notifications
    FOR ALL USING (customer_id = auth.uid()::uuid);

-- Users can manage their own trusted devices
CREATE POLICY "Users manage own devices" ON trusted_devices
    FOR ALL USING (customer_id = auth.uid()::uuid);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
    DELETE FROM trusted_devices WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to check session validity
CREATE OR REPLACE FUNCTION check_session_validity(p_session_token TEXT)
RETURNS TABLE(
    is_valid BOOLEAN,
    customer_id UUID,
    mfa_verified BOOLEAN,
    needs_refresh BOOLEAN
) AS $$
DECLARE
    v_session RECORD;
    v_timeout_minutes INTEGER := 30; -- Session timeout
    v_refresh_threshold INTEGER := 5; -- Refresh if less than 5 minutes left
BEGIN
    -- Get session
    SELECT * INTO v_session
    FROM user_sessions
    WHERE session_token = p_session_token
    AND expires_at > NOW();
    
    IF v_session IS NULL THEN
        RETURN QUERY SELECT FALSE::BOOLEAN, NULL::UUID, FALSE::BOOLEAN, FALSE::BOOLEAN;
        RETURN;
    END IF;
    
    -- Check if session is inactive for too long
    IF v_session.last_activity < NOW() - INTERVAL '30 minutes' THEN
        -- Session timed out due to inactivity
        DELETE FROM user_sessions WHERE id = v_session.id;
        RETURN QUERY SELECT FALSE::BOOLEAN, NULL::UUID, FALSE::BOOLEAN, FALSE::BOOLEAN;
        RETURN;
    END IF;
    
    -- Update last activity
    UPDATE user_sessions 
    SET last_activity = NOW()
    WHERE id = v_session.id;
    
    -- Check if needs refresh
    RETURN QUERY SELECT 
        TRUE::BOOLEAN as is_valid,
        v_session.customer_id,
        v_session.mfa_verified,
        (v_session.expires_at < NOW() + INTERVAL '5 minutes')::BOOLEAN as needs_refresh;
END;
$$ LANGUAGE plpgsql;