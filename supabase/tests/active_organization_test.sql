BEGIN;
SET client_min_messages TO WARNING;
SELECT plan(3);
select app_tests.create_users('user_1', 'user_2', 'user_3', 'user_4');
select app_tests.create_organization('test_org_1');
select app_tests.create_organization('test_org_2');
select app_tests.add_user_to_organization('user_1', 'test_org_1', 'admin');
select app_tests.add_user_to_organization('user_2', 'test_org_1', 'member');
select app_tests.add_user_to_organization('user_3', 'test_org_1', 'member');
select app_tests.add_user_to_organization('user_4', 'test_org_2', 'member');
select app_tests.authenticate_as_service_role();
select app_tests.has_row_count(
        'select * from public.organization_members;',
        4,
        'service role can select all members from all organizations'
    );
select app_tests.authenticate_as('user_1');
select app_tests.has_row_count(
        'select * from public.organization_members;',
        1,
        'admins can only select self when orgaization is not active'
    );
select public.set_current_organization_id(
        (
            select app_tests.get_organization_id('test_org_1')
        )
    );
select app_tests.has_row_count(
        'select * from public.organization_members;',
        3,
        'admins can select all members when organization is active'
    );
SELECT *
FROM finish();
ROLLBACK;