export type AppApiError = {
	message: string;
	status: number;
	retryAfter?: number;
	errors?: any;
};

type AppApiResponse<T> = {
	data: T;
	error: AppApiError;
};

type AppApiRequestOptions = {
	method: 'POST' | 'GET' | 'PUT' | 'DELETE';
	body?: Record<string, any>;
};

export async function fetchApi<T>(
	url: string,
	options: AppApiRequestOptions
): Promise<AppApiResponse<T>> {
	const response = await fetch(url, {
		method: options.method,
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(options.body)
	});

	return response.json();
}
