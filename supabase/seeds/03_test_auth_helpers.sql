

create or replace function app_tests.authenticate_as(_identifier text)
  returns void
  as $$
begin
  perform tests.authenticate_as(_identifier);
end
$$
language plpgsql;

create or replace function app_tests.authenticate_as_service_role()
  returns void
  as $$
begin
  perform tests.authenticate_as_service_role();
end
$$
language plpgsql;


create or replace function app_tests.reset_auth()
  returns void
  as $$
begin
    perform set_config('role', null, true);
    perform set_config('request.jwt.claims', null, true);
end
$$
language plpgsql;

