

create or replace function app_tests.has_row_count(_query text, _expected_count integer, _msg text)
  returns setof text
  language plpgsql
  as $$
declare
  actual_count integer;
begin
  -- Execute the query and capture the number of affected rows
  execute _query;
  -- Retrieve the actual number of rows affected by the last executed statement
  GET DIAGNOSTICS actual_count = ROW_COUNT;
  return query
  select
    is (actual_count,
      _expected_count,
      _msg);
end;
$$;