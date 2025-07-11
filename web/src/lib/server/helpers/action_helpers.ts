import { fail, isRedirect, type RequestEvent } from '@sveltejs/kit';
import { z, type ZodSchema } from 'zod';
import { assertAuthenticated, type AuthenticatedEvent } from '$lib/server/helpers/event';
import {
	UnauthorizedError,
	ValidationError,
	NotFoundError,
	OperationError,
	ServiceUnavailableError,
	RateLimitError,
	ConflictError,
	PayloadTooLargeError,
	ConfigurationError,
	ForbiddenError
} from '$lib/server/errors';

/**
 * Maps errors to appropriate failure responses for form actions
 */
function mapErrorToFailure(error: unknown, values?: Record<string, any>): ReturnType<typeof fail> {
	console.error('[Action Error]', error);

	if (isRedirect(error)) {
		throw error;
	}

	if (error instanceof ValidationError) {
		return fail(400, {
			error: error.message,
			errors: error.fields,
			values
		});
	}

	if (error instanceof UnauthorizedError) {
		return fail(401, {
			error: error.message || 'Please sign in to continue',
			values
		});
	}

	if (error instanceof ForbiddenError) {
		return fail(403, {
			error: error.message || 'You do not have permission to perform this action',
			values
		});
	}

	if (error instanceof NotFoundError) {
		return fail(404, {
			error: error.message || 'Resource not found',
			values
		});
	}

	if (error instanceof ConflictError) {
		return fail(409, {
			error: error.message,
			values
		});
	}

	if (error instanceof RateLimitError) {
		return fail(429, {
			error: error.message || 'Too many requests. Please try again later.',
			values
		});
	}

	if (error instanceof PayloadTooLargeError) {
		return fail(413, {
			error: error.message || 'File too large',
			values
		});
	}

	if (
		error instanceof OperationError ||
		error instanceof ServiceUnavailableError ||
		error instanceof ConfigurationError
	) {
		return fail(500, {
			error: error.message || 'An error occurred while processing your request',
			values
		});
	}

	// Generic error handling
	const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
	return fail(500, {
		error: errorMessage,
		values
	});
}

/**
 * Creates a form action handler with automatic error handling
 */
export function createActionHandler<T extends RequestEvent>(handler: (event: T) => Promise<any>) {
	return async (event: T) => {
		try {
			return await handler(event);
		} catch (error) {
			const formData = await event.request.formData().catch(() => new FormData());
			const values = preserveFormValues(formData);
			return mapErrorToFailure(error, values);
		}
	};
}

/**
 * Creates a form action handler that requires authentication
 */
export function createAuthenticatedActionHandler<T extends RequestEvent>(
	handler: (event: AuthenticatedEvent) => Promise<any>
) {
	return createActionHandler(async (event) => {
		assertAuthenticated(event);
		return await handler(event);
	});
}

/**
 * Validate form data against a Zod schema
 */
export async function validateFormAction<T extends z.ZodType>(
	schema: T,
	event: RequestEvent
): Promise<z.infer<T>> {
	const formData = await event.request.formData();
	const rawData = Object.fromEntries(formData.entries());
	const result = schema.safeParse(rawData);

	if (!result.success) {
		const errors: Record<string, string[]> = {};
		result.error.errors.forEach((err) => {
			const path = err.path.join('.');
			if (!errors[path]) errors[path] = [];
			errors[path].push(err.message);
		});
		throw new ValidationError('Validation failed', errors);
	}

	return result.data;
}

/**
 * Creates a form action handler with Zod schema validation
 */
export function createValidatedActionHandler<TSchema extends ZodSchema>(
	schema: TSchema,
	handler: (event: RequestEvent & { body: z.infer<TSchema> }) => Promise<any>
) {
	return createActionHandler(async (event) => {
		const body = await validateFormAction(schema, event);

		return await handler({
			...event,
			body
		});
	});
}

/**
 * Helper to parse multipart form data with file uploads
 */
export async function parseFormDataWithFiles(formData: FormData): Promise<{
	fields: Record<string, string>;
	files: Record<string, File>;
}> {
	const fields: Record<string, string> = {};
	const files: Record<string, File> = {};

	for (const [key, value] of formData.entries()) {
		if (value instanceof File) {
			files[key] = value;
		} else {
			fields[key] = value.toString();
		}
	}

	return { fields, files };
}

/**
 * Success action response helper
 */
export function actionSuccess<T = any>(data?: T, message?: string) {
	return {
		success: true,
		data,
		...(message && { message })
	};
}

/**
 * Helper to preserve form values on error
 */
export function preserveFormValues(
	formData: FormData,
	exclude: string[] = ['password', 'confirm-password', 'confirmPassword']
): Record<string, any> {
	const values: Record<string, any> = {};

	for (const [key, value] of formData.entries()) {
		if (!exclude.includes(key) && typeof value === 'string') {
			values[key] = value;
		}
	}

	return values;
}
