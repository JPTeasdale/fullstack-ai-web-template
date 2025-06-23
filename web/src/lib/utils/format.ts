export function formatScientific(value: number): string {
	if (value === 0) return '0';
	if (isNaN(value)) return 'N/A';

	// For very small or very large numbers, use scientific notation
	if (Math.abs(value) < 0.01 || Math.abs(value) >= 1e6) {
		return value.toExponential(2);
	}

	// For regular numbers, use fixed decimal places
	return value.toFixed(2);
}

export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(date: string): string {
	return new Date(date).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}