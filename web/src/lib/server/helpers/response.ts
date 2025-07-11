import { json } from '@sveltejs/kit';

/**
 * Standard success response format
 */
export function successResponse<T = any>(
	data: T,
	meta?: {
		page?: number;
		limit?: number;
		total?: number;
		[key: string]: any;
	}
) {
	return json({
		success: true,
		data,
		...(meta && { meta })
	});
}

/**
 * Standard error response format
 */
export function errorResponse(
	error: string | { message: string; code?: string },
	status = 400,
	details?: any
) {
	const errorObj = typeof error === 'string' ? { message: error } : error;

	return json(
		{
			success: false,
			error: errorObj,
			...(details && { details })
		},
		{ status }
	);
}

/**
 * No content response (204)
 */
export function noContentResponse() {
	return new Response(null, { status: 204 });
}

/**
 * Created response (201)
 */
export function createdResponse<T = any>(data: T, location?: string) {
	const headers = new Headers();
	if (location) {
		headers.set('Location', location);
	}

	return json(
		{
			success: true,
			data
		},
		{ status: 201, headers }
	);
}

/**
 * Accepted response (202) for async operations
 */
export function acceptedResponse(taskId?: string, estimatedTime?: number) {
	return json(
		{
			success: true,
			status: 'accepted',
			...(taskId && { taskId }),
			...(estimatedTime && { estimatedTime })
		},
		{ status: 202 }
	);
}

/**
 * Stream response helper
 */
export function streamResponse(stream: ReadableStream, contentType = 'application/octet-stream') {
	return new Response(stream, {
		headers: {
			'Content-Type': contentType,
			'Transfer-Encoding': 'chunked'
		}
	});
}

/**
 * File download response
 */
export function fileDownloadResponse(
	body: ReadableStream | ArrayBuffer | string,
	filename: string,
	contentType: string,
	size?: number
) {
	const headers = new Headers({
		'Content-Type': contentType,
		'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
		...(size && { 'Content-Length': size.toString() })
	});

	return new Response(body, { headers });
}
