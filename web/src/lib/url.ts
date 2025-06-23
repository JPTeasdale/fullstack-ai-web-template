export const URL_ROOT = '';

export const URL_API_ROOT = '/api';
export const URL_API_V1_ROOT = '/api/v1';
export const URL_API_PUBLIC_ROOT = '/api/webhooks';

export const URL_API_SIGNOUT = `${URL_API_V1_ROOT}/signout`;

export const URL_DASHBOARD = '/dashboard';
export const URL_ORGANIZATIONS = '/organizations';

export function urlOrganization(orgId: string) {
	return `${URL_ORGANIZATIONS}/${orgId}`;
}

export function urlOrganizationMembers(orgId: string) {
	return `${urlOrganization(orgId)}/members`;
}
export function urlOrganizationSettings(orgId: string) {
	return `${urlOrganization(orgId)}/settings`;
}
export function urlOrganizationSubscription(orgId: string) {
	return `${urlOrganization(orgId)}/subscription`;
}
export function urlOrganizationFiles(orgId: string) {
	return `${urlOrganization(orgId)}/files`;
}

export const URL_AUTH = '/auth';
export const URL_SIGNIN = `${URL_AUTH}/signin`;
export const URL_SIGNUP = `${URL_AUTH}/signup`;
export const URL_VERIFY_MAGIC_LINK = `${URL_AUTH}/confirm`;

export const URL_ROUTE_AUTHENTICATED = '/(auth)';

export const URL_MANAGE_SUBSCRIPTION = '/dashboard/subscription';
export const URL_CONFIRM_SUBSCRIPTION_STRIPE_TEMPLATE =
	'/dashboard/subscription?payment_intent={CHECKOUT_SESSION_ID}';

export const urlGetParentPath = (pathname: string): string => {
	const pathParts = pathname.split('/');
	return pathParts.slice(0, -1).join('/');
};

// https://posthog.com/docs/advanced/proxy/sveltekit
export const URL_POSTHOG_PROXY = '/api/status';
