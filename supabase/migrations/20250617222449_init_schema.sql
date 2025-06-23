-- ============================================================================
-- FULLSTACK WEB TEMPLATE - INITIAL DATABASE SETUP
-- ============================================================================
-- This script is re-runnable and will drop/recreate all objects

-- ============================================================================
-- DROP EXISTING OBJECTS (in reverse dependency order)
-- ============================================================================

-- Drop triggers on auth.users (table not being dropped)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Drop tables (policies, triggers, and indexes auto-dropped)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.files CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.user_profiles_private CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.authorize_active_org(UUID, public.member_role);
DROP FUNCTION IF EXISTS public.create_organization_with_owner(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.accept_invitation(TEXT);
DROP FUNCTION IF EXISTS public.handle_user_profile_sync();
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP FUNCTION IF EXISTS public.validate_active_organization_id();
DROP FUNCTION IF EXISTS public.is_organization_member(UUID);
DROP FUNCTION IF EXISTS public.current_active_membership();
DROP FUNCTION IF EXISTS public.current_active_organization_id();
DROP FUNCTION IF EXISTS public.set_current_organization_id(UUID);
DROP FUNCTION IF EXISTS public.get_current_organization_id();
DROP FUNCTION IF EXISTS public.create_organization_with_owner(TEXT, TEXT, TEXT);

-- Drop types
DROP TYPE IF EXISTS public.notification_type CASCADE;
DROP TYPE IF EXISTS public.audit_action CASCADE;
DROP TYPE IF EXISTS public.invitation_status CASCADE;
DROP TYPE IF EXISTS public.member_role CASCADE;
DROP TYPE IF EXISTS public.subscription_status CASCADE;

-- ============================================================================
-- CREATE NEW OBJECTS
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USER PROFILES TABLE
-- ============================================================================

CREATE TABLE public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" 
    ON public.user_profiles FOR SELECT 
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own profile" 
    ON public.user_profiles FOR UPDATE 
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own profile" 
    ON public.user_profiles FOR INSERT 
    WITH CHECK ((select auth.uid()) = user_id);

-- Create function to handle user profile sync
CREATE OR REPLACE FUNCTION public.handle_user_profile_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Create profile when user is created
        INSERT INTO public.user_profiles (user_id, email, full_name)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', '')
        );
        INSERT INTO public.user_profiles_private (user_id)
        VALUES (
            NEW.id
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update email in profile when auth.users email changes
        UPDATE public.user_profiles 
        SET 
            email = NEW.email,
            updated_at = NOW()
        WHERE user_id = NEW.id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Profile will be deleted via CASCADE foreign key constraint
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create triggers for user profile sync
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_profile_sync();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_profile_sync();

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create trigger for updated_at on user_profiles
CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- USER PROFILES PRIVATE TABLE
-- ============================================================================

-- Create user_profiles_private table
CREATE TABLE public.user_profiles_private (
    user_id UUID PRIMARY KEY REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id TEXT,
    openai_vector_store_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS for user_profiles_private
ALTER TABLE public.user_profiles_private ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from anon and authenticated roles on user_profiles_private
-- This ensures only the service role can access sensitive data like Stripe customer IDs
-- The handle_user_profile_sync() function can still insert because it runs with SECURITY DEFINER
REVOKE ALL PRIVILEGES ON public.user_profiles_private FROM anon, authenticated;

-- Create trigger for updated_at on user_profiles_private
CREATE TRIGGER user_profiles_private_updated_at
    BEFORE UPDATE ON public.user_profiles_private
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================================
-- ORGANIZATIONS TABLE (for team/multi-tenant features)
-- ============================================================================

CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    openai_vector_store_id TEXT,
    created_by UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at on organizations
CREATE TRIGGER organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================================================

-- Create enum for member role
CREATE TYPE public.member_role AS ENUM ('owner', 'admin', 'member');


CREATE TABLE public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
    role public.member_role NOT NULL DEFAULT 'member',
    invited_by UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT organization_members_unique UNIQUE (organization_id, user_id)
);

-- Enable RLS for organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select thir own memberships" 
    ON public.organization_members FOR SELECT
    USING ((select auth.uid()) = user_id);

-- ============================================================================
-- AUTHORIZATION FUNCTIONS (needed for RLS policies)
-- ============================================================================

-- Create an optimized function that PostgreSQL will call only once per statement
CREATE OR REPLACE FUNCTION public.current_active_membership()
RETURNS public.organization_members
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    org_id uuid;
    result public.organization_members;
    current_user_id uuid;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Get the current organization ID from session config
    org_id := public.get_current_organization_id();
    
    -- If no organization is set, return NULL
    IF org_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get the organization member record
    SELECT om.* INTO result
    FROM public.organization_members om
    WHERE om.organization_id = org_id
    AND om.user_id = current_user_id
    LIMIT 1;
    
    RETURN result;
END;
$$;

-- Helper function to just get the org ID (even more optimized)
CREATE OR REPLACE FUNCTION public.current_active_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
    SELECT (public.current_active_membership()).organization_id;
$$;

-- Function to check if user has required role in organization
CREATE OR REPLACE FUNCTION public.authorize_active_org(
    organization_id UUID DEFAULT NULL,
    minimum_role public.member_role DEFAULT 'member'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
    p_active_membership public.organization_members;
    role_hierarchy INTEGER;
    min_role_hierarchy INTEGER;
BEGIN
    -- Handle NULL organization_id - return FALSE immediately
    IF organization_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT * INTO p_active_membership FROM public.current_active_membership();

    -- Check if organization matches user's active organization
    -- If user has no active organization, return FALSE
    IF p_active_membership IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if the organization_id matches the active organization
    IF organization_id <> p_active_membership.organization_id THEN
        RETURN FALSE;
    END IF;

    -- Convert roles to hierarchy numbers (higher = more permissions)
    role_hierarchy := CASE p_active_membership.role
        WHEN 'owner' THEN 3
        WHEN 'admin' THEN 2
        WHEN 'member' THEN 1
        ELSE 0
    END;
    
    min_role_hierarchy := CASE minimum_role
        WHEN 'owner' THEN 3
        WHEN 'admin' THEN 2
        WHEN 'member' THEN 1
        ELSE 0
    END;
    
    -- Return true if user has required role or higher
    RETURN role_hierarchy >= min_role_hierarchy;
END;
$$;

-- Function to check if user is a member of ANY organization (not just active)
CREATE OR REPLACE FUNCTION public.is_organization_member(
    org_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Handle NULL organization_id - return FALSE immediately
    IF org_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Return true if user has any role in the organization
    RETURN EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = current_user_id
    );
END;
$$;

-- RLS Policies for organizations and members (consolidated to avoid multiple permissive policies)
CREATE POLICY "Users can view and manage organizations their active organization" 
    ON public.organizations FOR ALL
    USING ((select public.authorize_active_org(id, 'member')));

CREATE POLICY "Users can select organizations they belong to" 
    ON public.organizations FOR SELECT
    USING ((select public.is_organization_member(id)));

CREATE POLICY "Users can view and manage organization members for their organizations" 
    ON public.organization_members FOR ALL
    USING ((select public.authorize_active_org(organization_id, 'admin')));

-- ============================================================================
-- INVITATIONS TABLE
-- ============================================================================

-- Create enum for invitation status
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role public.member_role NOT NULL DEFAULT 'member',
    invited_by UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
    status public.invitation_status NOT NULL DEFAULT 'pending',
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT invitations_unique UNIQUE (organization_id, email)
);

-- Enable RLS for invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations (consolidated to avoid multiple permissive policies)
CREATE POLICY "Organization members can view and manage invitations for their organization" 
    ON public.invitations FOR ALL 
    USING ((select public.authorize_active_org(organization_id, 'member')));

-- Create trigger for updated_at on invitations
CREATE TRIGGER invitations_updated_at
    BEFORE UPDATE ON public.invitations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================

-- Create enum for subscription status
CREATE TYPE public.subscription_status AS ENUM (
    'incomplete',
    'trialing',
    'active',
    'paused',
    'past_due',
    'canceled',
    'unpaid',
    'will_expire'
);

-- Create enum for subscription status
CREATE TYPE public.app_subscription_type AS ENUM (
    'basic_weekly',
    'basic_monthly',
    'basic_yearly',
    'pro_weekly',
    'pro_monthly',
    'pro_yearly'
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    app_subscription_type public.app_subscription_type DEFAULT NULL,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    stripe_price_id TEXT,
    status public.subscription_status NOT NULL DEFAULT 'incomplete',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id),
    CONSTRAINT subscriptions_organization_id_unique UNIQUE (organization_id)
);

-- Enable RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription" 
    ON public.subscriptions FOR SELECT 
    USING ((select auth.uid()) = user_id);


-- RLS Policies for subscriptions
CREATE POLICY "Users can view their organization's subscription" 
    ON public.subscriptions FOR SELECT 
    USING (
        user_id IS NULL AND
        (select public.authorize_active_org(organization_id, 'member'))
    );

-- Create trigger for updated_at on subscriptions
CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================

-- Create enum for audit action types
CREATE TYPE public.audit_action AS ENUM (
    'create', 'update', 'delete', 
    'login', 'logout', 
    'invite_sent', 'invite_accepted',
    'subscription_created', 'subscription_updated', 'subscription_canceled'
);

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    action public.audit_action NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs (consolidated to avoid multiple permissive policies)
CREATE POLICY "Users can view audit logs they have access to" 
    ON public.audit_logs FOR SELECT 
    USING (
        (select auth.uid()) = user_id OR
        (select public.authorize_active_org(organization_id, 'member'))
    );

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================

-- Create enum for notification types
CREATE TYPE public.notification_type AS ENUM (
    'info', 'success', 'warning', 'error',
    'invitation', 'subscription', 'system'
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
    type public.notification_type NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can manage their own notifications" 
    ON public.notifications FOR ALL 
    USING ((select auth.uid()) = user_id);

-- ============================================================================
-- FILES TABLE (for Cloudflare R2 file storage)
-- ============================================================================

CREATE TABLE public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    checksum TEXT,
    user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    openai_file_id TEXT,
    is_ready BOOLEAN DEFAULT FALSE NOT NULL,
    
    CONSTRAINT files_size_positive CHECK (size > 0)
);

-- Enable RLS for files
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for files
CREATE POLICY "Users can view their own files" 
    ON public.files FOR SELECT 
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can view public files" 
    ON public.files FOR SELECT 
    USING (is_public = TRUE);

CREATE POLICY "Users can view organization files they belong to" 
    ON public.files FOR SELECT 
    USING ((select public.authorize_active_org(organization_id, 'member')));

CREATE POLICY "Users can upload their own files" 
    ON public.files FOR INSERT 
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can upload files to organizations they belong to" 
    ON public.files FOR INSERT 
    WITH CHECK (
        (select public.authorize_active_org(organization_id, 'member')) AND
        (select auth.uid()) = user_id
    );

CREATE POLICY "Users can update their own files" 
    ON public.files FOR UPDATE 
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Organization admins can update organization files" 
    ON public.files FOR UPDATE 
    USING ((select public.authorize_active_org(organization_id, 'admin')))
    WITH CHECK ((select public.authorize_active_org(organization_id, 'admin')));

CREATE POLICY "Users can delete their own files" 
    ON public.files FOR DELETE 
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Organization admins can delete organization files" 
    ON public.files FOR DELETE 
    USING ((select public.authorize_active_org(organization_id, 'admin')));

-- Create trigger for updated_at on files
CREATE TRIGGER files_updated_at
    BEFORE UPDATE ON public.files
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Sets the current organization ID in session config. Pass NULL to clear.
CREATE OR REPLACE FUNCTION public.set_current_organization_id(org_id uuid) RETURNS void AS $$
BEGIN
  -- Convert NULL to empty string for storage, COALESCE handles NULL input
  PERFORM set_config('app.current_organization_id', COALESCE(org_id::text, ''), false);
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Returns the current organization ID from session config, or NULL if not set
CREATE OR REPLACE FUNCTION public.get_current_organization_id() RETURNS uuid AS $$
BEGIN
  -- current_setting returns NULL if not set (with second param true)
  -- NULLIF converts empty string to NULL as well for safety
  RETURN NULLIF(current_setting('app.current_organization_id', true), '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to create organization with owner
CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
    org_name TEXT,
    org_slug TEXT,
    org_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Create the organization
    INSERT INTO public.organizations (name, slug, description, created_by)
    VALUES (org_name, org_slug, org_description, auth.uid())
    RETURNING id INTO new_org_id;
    
    -- Add the creator as owner
    INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
    VALUES (new_org_id, auth.uid(), 'owner', auth.uid());
    
    -- Log the action
    INSERT INTO public.audit_logs (user_id, organization_id, action, resource_type, resource_id)
    VALUES (auth.uid(), new_org_id, 'create', 'organization', new_org_id);
    
    RETURN new_org_id;
END;
$$;

-- Function to accept invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    invitation_record RECORD;
    user_email TEXT;
BEGIN
    -- Get current user email
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    
    -- Get invitation details
    SELECT * INTO invitation_record 
    FROM public.invitations 
    WHERE token = invitation_token 
    AND status = 'pending' 
    AND expires_at > NOW()
    AND email = user_email;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Add user to organization
    INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
    VALUES (invitation_record.organization_id, auth.uid(), invitation_record.role, invitation_record.invited_by)
    ON CONFLICT (organization_id, user_id) DO NOTHING;
    
    -- Update invitation status
    UPDATE public.invitations 
    SET status = 'accepted', accepted_at = NOW(), updated_at = NOW()
    WHERE id = invitation_record.id;
    
    -- Log the action
    INSERT INTO public.audit_logs (user_id, organization_id, action, resource_type, resource_id)
    VALUES (auth.uid(), invitation_record.organization_id, 'invite_accepted', 'invitation', invitation_record.id);
    
    RETURN TRUE;
END;
$$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Organizations indexes
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_created_by ON public.organizations(created_by);

-- Organization members indexes
CREATE INDEX idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_role ON public.organization_members(role);
CREATE INDEX idx_organization_members_invited_by ON public.organization_members(invited_by);

-- Invitations indexes
CREATE INDEX idx_invitations_org_id ON public.invitations(organization_id);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_status ON public.invitations(status);
CREATE INDEX idx_invitations_expires_at ON public.invitations(expires_at);
CREATE INDEX idx_invitations_invited_by ON public.invitations(invited_by);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_org_id ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- Files indexes
CREATE INDEX idx_files_user_id ON public.files(user_id);
CREATE INDEX idx_files_organization_id ON public.files(organization_id);
CREATE INDEX idx_files_is_public ON public.files(is_public);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.files TO authenticated;

-- Grant usage on sequences (for any serial columns if added later)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.authorize_active_org TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_organization_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_active_membership TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_active_organization_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization_with_owner TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_user_profile_sync TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_updated_at TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_organization_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_organization_id TO authenticated;

