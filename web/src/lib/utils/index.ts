export { isDefined } from './isDefined';
export { errorStr } from './error';

/**
 * Format a date string to a localized date format
 */
export function formatDate(dateString: string | null | undefined): string {
	if (!dateString) return 'N/A';
	return new Date(dateString).toLocaleDateString();
}
