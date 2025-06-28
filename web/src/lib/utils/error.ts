export function errorStr(error: unknown): string {
	if (error instanceof Error || 'message' in error) {
		return error.message;
	}
	return String(error);
}
