BEGIN;
SET client_min_messages TO WARNING;
SELECT plan(4);
select app_tests.create_users('user_1', 'user_2', 'user_3');
select app_tests.create_organization('test_org_1');
select app_tests.create_organization('test_org_2');
select app_tests.add_user_to_organization('user_1', 'test_org_1');
select app_tests.add_user_to_organization('user_2', 'test_org_2');
select app_tests.authenticate_as_service_role();
select app_tests.has_row_count(
        'select * from public.organizations;',
        2,
        'service role cannot select organizations'
    );
select app_tests.authenticate_as('user_1');
select app_tests.has_row_count(
        'select * from public.organizations;',
        1,
        'organization members can select organizations'
    );
select app_tests.authenticate_as('user_2');
select app_tests.has_row_count(
        'select * from public.organizations;',
        1,
        'members can select their own organizations'
    );
select app_tests.authenticate_as('user_3');
select is_empty(
        'select * from public.organizations;',
        'non-members cannot select organizations'
    );
SELECT *
FROM finish();
ROLLBACK;