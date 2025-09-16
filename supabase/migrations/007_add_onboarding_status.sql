-- Add onboarding_completed column to track if user has completed setup
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Set onboarding_completed to true for users who have completed payment
UPDATE customers
SET onboarding_completed = TRUE
WHERE stripe_customer_id IS NOT NULL
  AND subscription_status = 'active';

-- Also update for users who have payment_completed flag
UPDATE customers
SET onboarding_completed = TRUE
WHERE settings->>'payment_completed' = 'true';