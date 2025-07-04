import { URL_VERIFY_MAGIC_LINK } from '$lib/url';

// Wrap the confirmation URL in a login parameter to prevent the link from being invalidated by email client pre-fetching
export function generateConfirmationURL({
	baseUrl,
	token_hash,
	email_action_type,
	redirect_to
}: {
	baseUrl: string;
	token_hash: string;
	email_action_type: string;
	redirect_to: string;
}) {
	const confirmLink = `${baseUrl}${URL_VERIFY_MAGIC_LINK}?token_hash=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
	return `${baseUrl}${URL_VERIFY_MAGIC_LINK}?login=${encodeURIComponent(confirmLink)}`;
}
