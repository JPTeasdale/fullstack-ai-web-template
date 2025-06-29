BEGIN;
SET client_min_messages TO WARNING;
SELECT plan(2);
select app_tests.create_organization('test_org_1');
insert into public.subscriptions (organization_id, status, app_subscription_type)
values (
        app_tests.get_organization_id('test_org_1'),
        'active',
        'basic_weekly'
    );
    
select tap.is(
        (
            select plan
            from public.organization_private
            where organization_id = app_tests.get_organization_id('test_org_1')
        ),
        'basic',
        'organization plan is set to basic'
    );

update public.subscriptions
set app_subscription_type = 'pro_weekly'
where organization_id = app_tests.get_organization_id('test_org_1');
select tap.is(
        (
            select plan
            from public.organization_private
            where organization_id = app_tests.get_organization_id('test_org_1')
        ),
        'pro',
        'organization plan updates to pro'
    );
select * FROM finish();
ROLLBACK;