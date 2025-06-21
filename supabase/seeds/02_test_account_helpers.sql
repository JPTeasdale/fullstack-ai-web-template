
create extension if not exists "basejump-supabase_test_helpers";


-- Drop the schema if it already exists to start fresh
drop schema if exists app_tests cascade;
-- Create a dedicated schema for testing
create schema if not exists app_tests;


grant usage on schema app_tests to anon, authenticated, service_role;
alter default privileges in schema app_tests grant execute on functions to anon, authenticated, service_role;


-- ///////////////////////////////////////////////////////////////////////
-- CREATE TEST

create or replace function app_tests.get_tmp_phone_number()
  returns citext
  language plpgsql
  security definer
  as $$
declare
  v_phone_number text;
  current_counter int;
begin
  -- Check if the temporary table exists; if not, create and initialize it
  create temporary table if not exists user_creation_counter(
    counter int default 0
  ) on commit drop;
  -- Initialize the database
  insert into user_creation_counter(counter)
  select
    0
  where
    not exists (
      select
        1
      from
        user_creation_counter);
  -- Retrieve the current counter value from the temporary table
  select
    counter into current_counter
  from
    user_creation_counter;
  current_counter := current_counter + 1;
  -- Check if the limit is exceeded
  if current_counter > 99 then
    raise exception 'Too many phone numbers created!';
  end if;
  -- Generate a unique phone number
  v_phone_number := '122255501' || lpad(current_counter::text, 2, '0');
  -- Update the counter in the temporary table
  update
    user_creation_counter
  set
    counter = current_counter;
  -- Return the generated phone number
  return v_phone_number;
end;
$$;

create or replace function app_tests.create_user(_identifier text)
  returns uuid
  language plpgsql
  set search_path = auth, pg_temp
  as $$
declare
  v_user_id uuid;
begin
  -- Check if the temporary table 'test_user_lookup' exists; if not, create it
  create temporary table if not exists test_user_lookup(
    identifier text primary key not null,
    user_id uuid not null
  ) on commit drop;

  select tests.create_supabase_user(_identifier, _identifier || '@app.test', app_tests.get_tmp_phone_number()) into v_user_id;
 
  -- Setup admin privileges if the user is admin
  if _identifier = 'admin' or _identifier like 'admin%' then
    update
      public.user_profiles_private
    set
      is_admin = true
    where
      user_id = v_user_id;
  end if;
  -- Return the user ID of the newly created user
  return v_user_id;
end;
$$;

create or replace function app_tests.create_users(variadic _identifiers text[])
  returns void
  language plpgsql
  as $$
declare
  _identifier text;
begin
  -- Loop through each name in the input variadic parameter
  foreach _identifier in array _identifiers loop
    perform
      app_tests.create_user(_identifier);
  end loop;
end;
$$;

create or replace function app_tests.get_user_profile(_identifier text)
  returns public.user_profiles
  language plpgsql
  security definer
  set search_path = auth, pg_temp
  as $$
declare
  v_user public.user_profiles;
begin
  select * into v_user 
  from public.user_profiles 
  where user_id = tests.get_supabase_uid(_identifier);
  return v_user;
end;
$$;

create or replace function app_tests.get_user_id(_identifier text)
  returns uuid
  language plpgsql
  security definer
  set search_path = auth, pg_temp
  as $$
declare
  v_user_id uuid;
begin
  -- Assign the result of the select statement to the variable
  -- select tests.get_supabase_user(_identifier) ->> 'id' into v_user_id;
  
  -- Return the user ID
  select tests.get_supabase_uid(_identifier) into v_user_id;
  return v_user_id;
end;
$$;

create or replace function app_tests.create_organization(_org_identifier text)
    returns void
    as $$
begin
  insert into public.organizations(name, slug)
    values (_org_identifier, _org_identifier);
end;
$$
language plpgsql;


create or replace function app_tests.get_organization_id(_org_identifier text)
    returns uuid
    as $$
begin
  return (select id from public.organizations where slug = _org_identifier);
end;
$$
language plpgsql;

create or replace function app_tests.add_user_to_organization(_user_identifier text, _org_identifier text, _role public.member_role = 'member')
    returns void
    as $$
declare
    v_user_id uuid;
    v_org_id uuid;
begin
  select app_tests.get_user_id(_user_identifier) into v_user_id;
  select app_tests.get_organization_id(_org_identifier) into v_org_id;

  insert into public.organization_members(organization_id, user_id, role)
    values (app_tests.get_organization_id(_org_identifier), app_tests.get_user_id(_user_identifier), _role);
end;
$$
language plpgsql;
