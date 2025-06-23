

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."app_subscription_type" AS ENUM (
    'basic_weekly',
    'basic_monthly',
    'basic_yearly',
    'pro_weekly',
    'pro_monthly',
    'pro_yearly'
);


ALTER TYPE "public"."app_subscription_type" OWNER TO "postgres";


CREATE TYPE "public"."audit_action" AS ENUM (
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'invite_sent',
    'invite_accepted',
    'subscription_created',
    'subscription_updated',
    'subscription_canceled'
);


ALTER TYPE "public"."audit_action" OWNER TO "postgres";


CREATE TYPE "public"."invitation_status" AS ENUM (
    'pending',
    'accepted',
    'declined',
    'expired'
);


ALTER TYPE "public"."invitation_status" OWNER TO "postgres";


CREATE TYPE "public"."member_role" AS ENUM (
    'owner',
    'admin',
    'member'
);


ALTER TYPE "public"."member_role" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'info',
    'success',
    'warning',
    'error',
    'invitation',
    'subscription',
    'system'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'incomplete',
    'trialing',
    'active',
    'paused',
    'past_due',
    'canceled',
    'unpaid',
    'will_expire'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_invitation"("invitation_token" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."accept_invitation"("invitation_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."authorize_active_org"("organization_id" "uuid" DEFAULT NULL::"uuid", "minimum_role" "public"."member_role" DEFAULT 'member'::"public"."member_role") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."authorize_active_org"("organization_id" "uuid", "minimum_role" "public"."member_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_organization_with_owner"("org_name" "text", "org_slug" "text", "org_description" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."create_organization_with_owner"("org_name" "text", "org_slug" "text", "org_description" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."member_role" DEFAULT 'member'::"public"."member_role" NOT NULL,
    "invited_by" "uuid",
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_active_membership"() RETURNS "public"."organization_members"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."current_active_membership"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_active_organization_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
    SELECT (public.current_active_membership()).organization_id;
$$;


ALTER FUNCTION "public"."current_active_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_organization_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  -- current_setting returns NULL if not set (with second param true)
  -- NULLIF converts empty string to NULL as well for safety
  RETURN NULLIF(current_setting('app.current_organization_id', true), '')::uuid;
END;
$$;


ALTER FUNCTION "public"."get_current_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_profile_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."handle_user_profile_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_organization_member"("org_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."is_organization_member"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_current_organization_id"("org_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Convert NULL to empty string for storage, COALESCE handles NULL input
  PERFORM set_config('app.current_organization_id', COALESCE(org_id::text, ''), false);
END;
$$;


ALTER FUNCTION "public"."set_current_organization_id"("org_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "organization_id" "uuid",
    "action" "public"."audit_action" NOT NULL,
    "resource_type" "text",
    "resource_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."files" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "size" bigint NOT NULL,
    "mime_type" "text" NOT NULL,
    "checksum" "text",
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "is_public" boolean DEFAULT false NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "openai_file_id" "text",
    "is_ready" boolean DEFAULT false NOT NULL,
    CONSTRAINT "files_size_positive" CHECK (("size" > 0))
);


ALTER TABLE "public"."files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "public"."member_role" DEFAULT 'member'::"public"."member_role" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "status" "public"."invitation_status" DEFAULT 'pending'::"public"."invitation_status" NOT NULL,
    "token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(32), 'hex'::"text") NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."notification_type" DEFAULT 'info'::"public"."notification_type" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "read_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "logo_url" "text",
    "website_url" "text",
    "openai_vector_store_id" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "organization_id" "uuid",
    "app_subscription_type" "public"."app_subscription_type",
    "stripe_subscription_id" "text",
    "stripe_customer_id" "text",
    "stripe_price_id" "text",
    "status" "public"."subscription_status" DEFAULT 'incomplete'::"public"."subscription_status" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "canceled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "display_name" "text",
    "avatar_url" "text",
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles_private" (
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text",
    "openai_vector_store_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_profiles_private" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_unique" UNIQUE ("organization_id", "email");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_unique" UNIQUE ("organization_id", "user_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_organization_id_unique" UNIQUE ("organization_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_profiles_private"
    ADD CONSTRAINT "user_profiles_private_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at");



CREATE INDEX "idx_audit_logs_org_id" ON "public"."audit_logs" USING "btree" ("organization_id");



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_files_is_public" ON "public"."files" USING "btree" ("is_public");



CREATE INDEX "idx_files_organization_id" ON "public"."files" USING "btree" ("organization_id");



CREATE INDEX "idx_files_user_id" ON "public"."files" USING "btree" ("user_id");



CREATE INDEX "idx_invitations_email" ON "public"."invitations" USING "btree" ("email");



CREATE INDEX "idx_invitations_expires_at" ON "public"."invitations" USING "btree" ("expires_at");



CREATE INDEX "idx_invitations_invited_by" ON "public"."invitations" USING "btree" ("invited_by");



CREATE INDEX "idx_invitations_org_id" ON "public"."invitations" USING "btree" ("organization_id");



CREATE INDEX "idx_invitations_status" ON "public"."invitations" USING "btree" ("status");



CREATE INDEX "idx_invitations_token" ON "public"."invitations" USING "btree" ("token");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at");



CREATE INDEX "idx_notifications_read_at" ON "public"."notifications" USING "btree" ("read_at");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_organization_members_invited_by" ON "public"."organization_members" USING "btree" ("invited_by");



CREATE INDEX "idx_organization_members_org_id" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "idx_organization_members_role" ON "public"."organization_members" USING "btree" ("role");



CREATE INDEX "idx_organization_members_user_id" ON "public"."organization_members" USING "btree" ("user_id");



CREATE INDEX "idx_organizations_created_by" ON "public"."organizations" USING "btree" ("created_by");



CREATE INDEX "idx_organizations_slug" ON "public"."organizations" USING "btree" ("slug");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_stripe_customer_id" ON "public"."subscriptions" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_subscriptions_user_id" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_email" ON "public"."user_profiles" USING "btree" ("email");



CREATE INDEX "idx_user_profiles_user_id" ON "public"."user_profiles" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "files_updated_at" BEFORE UPDATE ON "public"."files" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "invitations_updated_at" BEFORE UPDATE ON "public"."invitations" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "user_profiles_private_updated_at" BEFORE UPDATE ON "public"."user_profiles_private" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."user_profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."user_profiles"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles_private"
    ADD CONSTRAINT "user_profiles_private_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Organization admins can delete organization files" ON "public"."files" FOR DELETE USING (( SELECT "public"."authorize_active_org"("files"."organization_id", 'admin'::"public"."member_role") AS "authorize_active_org"));



CREATE POLICY "Organization admins can update organization files" ON "public"."files" FOR UPDATE USING (( SELECT "public"."authorize_active_org"("files"."organization_id", 'admin'::"public"."member_role") AS "authorize_active_org")) WITH CHECK (( SELECT "public"."authorize_active_org"("files"."organization_id", 'admin'::"public"."member_role") AS "authorize_active_org"));



CREATE POLICY "Organization members can view and manage invitations for their " ON "public"."invitations" USING (( SELECT "public"."authorize_active_org"("invitations"."organization_id", 'member'::"public"."member_role") AS "authorize_active_org"));



CREATE POLICY "Users can delete their own files" ON "public"."files" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own notifications" ON "public"."notifications" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can select organizations they belong to" ON "public"."organizations" FOR SELECT USING (( SELECT "public"."is_organization_member"("organizations"."id") AS "is_organization_member"));



CREATE POLICY "Users can select thir own memberships" ON "public"."organization_members" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own files" ON "public"."files" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."user_profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can upload files to organizations they belong to" ON "public"."files" FOR INSERT WITH CHECK ((( SELECT "public"."authorize_active_org"("files"."organization_id", 'member'::"public"."member_role") AS "authorize_active_org") AND (( SELECT "auth"."uid"() AS "uid") = "user_id")));



CREATE POLICY "Users can upload their own files" ON "public"."files" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view and manage organization members for their organi" ON "public"."organization_members" USING (( SELECT "public"."authorize_active_org"("organization_members"."organization_id", 'admin'::"public"."member_role") AS "authorize_active_org"));



CREATE POLICY "Users can view and manage organizations their active organizati" ON "public"."organizations" USING (( SELECT "public"."authorize_active_org"("organizations"."id", 'member'::"public"."member_role") AS "authorize_active_org"));



CREATE POLICY "Users can view audit logs they have access to" ON "public"."audit_logs" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ( SELECT "public"."authorize_active_org"("audit_logs"."organization_id", 'member'::"public"."member_role") AS "authorize_active_org")));



CREATE POLICY "Users can view organization files they belong to" ON "public"."files" FOR SELECT USING (( SELECT "public"."authorize_active_org"("files"."organization_id", 'member'::"public"."member_role") AS "authorize_active_org"));



CREATE POLICY "Users can view public files" ON "public"."files" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Users can view their organization's subscription" ON "public"."subscriptions" FOR SELECT USING ((("user_id" IS NULL) AND ( SELECT "public"."authorize_active_org"("subscriptions"."organization_id", 'member'::"public"."member_role") AS "authorize_active_org")));



CREATE POLICY "Users can view their own files" ON "public"."files" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."user_profiles" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own subscription" ON "public"."subscriptions" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles_private" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."accept_invitation"("invitation_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_invitation"("invitation_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_invitation"("invitation_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."authorize_active_org"("organization_id" "uuid", "minimum_role" "public"."member_role") TO "anon";
GRANT ALL ON FUNCTION "public"."authorize_active_org"("organization_id" "uuid", "minimum_role" "public"."member_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."authorize_active_org"("organization_id" "uuid", "minimum_role" "public"."member_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_organization_with_owner"("org_name" "text", "org_slug" "text", "org_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_organization_with_owner"("org_name" "text", "org_slug" "text", "org_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_organization_with_owner"("org_name" "text", "org_slug" "text", "org_description" "text") TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON FUNCTION "public"."current_active_membership"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_active_membership"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_active_membership"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_active_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_active_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_active_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_profile_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_profile_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_profile_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_organization_member"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_organization_member"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_organization_member"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_current_organization_id"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_current_organization_id"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_current_organization_id"("org_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."files" TO "anon";
GRANT ALL ON TABLE "public"."files" TO "authenticated";
GRANT ALL ON TABLE "public"."files" TO "service_role";



GRANT ALL ON TABLE "public"."invitations" TO "anon";
GRANT ALL ON TABLE "public"."invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."invitations" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles_private" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
