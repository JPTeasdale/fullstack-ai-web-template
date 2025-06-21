
--------------------------------------
---- Seed Users
--------------------------------------

-- Insert users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  raw_app_meta_data,
  raw_user_meta_data
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'user' || generate_series(1, 10) || '@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb;

-- Insert identities
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  created_at,
  updated_at
)
SELECT
  uuid_generate_v4(),
  id,
  id,
  json_build_object('sub', id::text, 'email', email),
  'email',
  now(),
  now()
FROM auth.users
WHERE email LIKE 'user%@example.com';