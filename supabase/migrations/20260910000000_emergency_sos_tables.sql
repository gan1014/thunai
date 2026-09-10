-- =====================================================================
-- THUNAI ASSISTIVE SAFETY SYSTEM: EMERGENCY SOS & CONTACTS SCHEMA
-- =====================================================================

-- 1. Emergency Contacts Table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    whatsapp_enabled BOOLEAN NOT NULL DEFAULT true,
    relationship VARCHAR(128) NOT NULL DEFAULT 'Emergency Contact',
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Emergency Events Log Table
CREATE TABLE IF NOT EXISTS public.emergency_events (
    id VARCHAR(64) PRIMARY KEY,
    user_id BIGINT NOT NULL DEFAULT 1,
    user_name VARCHAR(255) NOT NULL,
    trigger_method VARCHAR(64) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'COUNTDOWN_ACTIVE',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    escalated_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy_meters DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    battery INTEGER NOT NULL DEFAULT 100,
    maps_url TEXT NOT NULL,
    is_test_mode BOOLEAN NOT NULL DEFAULT false,
    sms_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    sms_message_sid VARCHAR(128),
    sms_error TEXT,
    whatsapp_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    whatsapp_message_sid VARCHAR(128),
    whatsapp_error TEXT,
    contact_notified JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Authenticated users can read and modify their own emergency contacts
CREATE POLICY "Users can manage own emergency contacts"
    ON public.emergency_contacts
    FOR ALL
    USING (auth.uid() IS NULL OR auth.uid()::text = user_id::text);

-- RLS Policies: Authenticated users can view and create their own emergency events
CREATE POLICY "Users can view and create emergency events"
    ON public.emergency_events
    FOR ALL
    USING (auth.uid() IS NULL OR auth.uid()::text = user_id::text);

-- Initial seed emergency contact
INSERT INTO public.emergency_contacts (user_id, name, phone, whatsapp_enabled, relationship, is_primary)
VALUES (1, 'Dr. Ramesh S (Primary Caretaker & Physician)', '+919876543210', true, 'Primary Physician & Caretaker', true)
ON CONFLICT DO NOTHING;
