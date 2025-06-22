BEGIN;
SET client_min_messages TO WARNING;
SELECT plan(4);
select app_tests.create_users('user_1', 'user_2');
select app_tests.create_organization('test_org_1');
select app_tests.create_organization('test_org_2');
select app_tests.add_user_to_organization('user_1', 'test_org_1');
select app_tests.add_user_to_organization('user_2', 'test_org_2');
insert into public.subscriptions (organization_id, status, app_subscription_type)
values (
        app_tests.get_organization_id('test_org_1'),
        'active',
        'basic_weekly'
    );
insert into public.subscriptions (organization_id, status, app_subscription_type)
values (
        app_tests.get_organization_id('test_org_2'),
        'active',
        'basic_weekly'
    );
select app_tests.authenticate_as_service_role();
select app_tests.has_row_count(
        'select * from public.subscriptions;',
        2,
        'service role can select all subscriptions'
    );
select app_tests.authenticate_as('user_1');
select is_empty(
        'select * from public.subscriptions;',
        'organization members cannot select subscriptions when not active'
    );

select app_tests.set_active_org('test_org_1');
select app_tests.has_row_count(
        'select * from public.subscriptions;',
        1,
        'members can select their own organization subscriptions when active'
    );
select app_tests.authenticate_as('user_2');
select is_empty(
        'select * from public.subscriptions;',
        'members cannot select subscriptions from other organizations'
    );
SELECT *
FROM finish();
ROLLBACK;