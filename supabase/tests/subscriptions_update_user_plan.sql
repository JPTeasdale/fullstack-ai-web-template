BEGIN;
SET client_min_messages TO WARNING;
SELECT plan(2);
select app_tests.create_users('test_org_1');
insert into public.subscriptions (user_id, status, app_subscription_type)
values (
        app_tests.get_user_id('test_org_1'),
        'active',
        'basic_weekly'
    );
select tap.is(
        (
            select plan
            from public.user_private
            where user_id = app_tests.get_user_id('test_org_1')
        ),
        'basic',
        'user plan is set to basic'
    );
update public.subscriptions
set app_subscription_type = 'pro_weekly'
where user_id = app_tests.get_user_id('test_org_1');
select tap.is(
        (
            select plan
            from public.user_private
            where user_id = app_tests.get_user_id('test_org_1')
        ),
        'pro',
        'user plan updates to pro'
    );
select *
FROM finish();
ROLLBACK;