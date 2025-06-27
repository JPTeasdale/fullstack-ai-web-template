import { fail, isRedirect, type RequestEvent } from '@sveltejs/kit';
import { z, type ZodSchema } from 'zod';
import type { BaseContext, AuthenticatedContext } from '$lib/models/context';
import { errorStr } from '$lib/utils/error';
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
} from '$lib/errors';

// Action handler types
type ActionContext = RequestEvent & {
    locals: App.Locals;
};

type ActionResult<T = any> = {
    success?: boolean;
    data?: T;
    error?: string;
    errors?: Record<string, string[]>;
    values?: Record<string, any>;
    message?: string;
};

type ActionHandler<T = any> = (
    context: ActionContext & { ctx: BaseContext }
) => Promise<ActionResult<T> | Response>;

type AuthenticatedActionHandler<T = any> = (
    context: ActionContext & { ctx: AuthenticatedContext }
) => Promise<ActionResult<T> | Response>;

type ValidatedActionHandler<TSchema extends ZodSchema, T = any> = (
    context: ActionContext & { 
        ctx: BaseContext; 
        body: z.infer<TSchema>;
        rawFormData: FormData;
    }
) => Promise<ActionResult<T> | Response>;

type AuthenticatedValidatedActionHandler<TSchema extends ZodSchema, T = any> = (
    context: ActionContext & { 
        ctx: AuthenticatedContext; 
        body: z.infer<TSchema>;
        rawFormData: FormData;
    }
) => Promise<ActionResult<T> | Response>;

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

    if (error instanceof OperationError || error instanceof ServiceUnavailableError || error instanceof ConfigurationError) {
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
 * Creates a form action handler with automatic error handling and context creation
 */
export function createActionHandler<T = any>(
    handler: ActionHandler<T>
): (event: ActionContext) => Promise<ReturnType<typeof fail> | Response> {
    return async (event) => {
        try {
            const ctx = event.locals as BaseContext;
            const result = await handler({ ...event, ctx });
            
            // If handler returns a Response (like redirect), pass it through
            if (result instanceof Response) {
                return result;
            }
            
            // Otherwise, it's a success (form actions don't need explicit success responses)
            return result as any;
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
export function createAuthenticatedActionHandler<T = any>(
    handler: AuthenticatedActionHandler<T>
): (event: ActionContext) => Promise<ReturnType<typeof fail> | Response> {
    return async (event) => {
        try {
            if (!event.locals.user) {
                throw new UnauthorizedError('Please sign in to continue');
            }
            
            const ctx = { ...event.locals, user: event.locals.user } as AuthenticatedContext;
            const result = await handler({ ...event, ctx });
            
            if (result instanceof Response) {
                return result;
            }
            
            return result as any;
        } catch (error) {
            const formData = await event.request.formData().catch(() => new FormData());
            const values = preserveFormValues(formData);
            return mapErrorToFailure(error, values);
        }
    };
}

/**
 * Creates a form action handler with Zod schema validation
 */
export function createValidatedActionHandler<TSchema extends ZodSchema, T = any>(
    schema: TSchema,
    handler: ValidatedActionHandler<TSchema, T>
): (event: ActionContext) => Promise<ReturnType<typeof fail> | Response> {
    return async (event) => {
        try {
            const ctx = event.locals as BaseContext;
            const formData = await event.request.formData();
            
            // Convert FormData to object for validation
            const rawData = Object.fromEntries(formData.entries());
            
            // Parse and validate
            const parseResult = schema.safeParse(rawData);
            
            if (!parseResult.success) {
                const errors: Record<string, string[]> = {};
                parseResult.error.errors.forEach((error) => {
                    const path = error.path.join('.');
                    if (!errors[path]) {
                        errors[path] = [];
                    }
                    errors[path].push(error.message);
                });
                
                return fail(400, {
                    error: 'Please check the form for errors',
                    errors,
                    values: rawData
                });
            }
            
            const result = await handler({ 
                ...event, 
                ctx, 
                body: parseResult.data,
                rawFormData: formData
            });
            
            if (result instanceof Response) {
                return result;
            }
            
            return result as any;
        } catch (error) {
            const formData = await event.request.formData().catch(() => new FormData());
            const values = preserveFormValues(formData);
            return mapErrorToFailure(error, values);
        }
    };
}

/**
 * Creates an authenticated form action handler with validation
 */
export function createAuthenticatedValidatedActionHandler<TSchema extends ZodSchema, T = any>(
    schema: TSchema,
    handler: AuthenticatedValidatedActionHandler<TSchema, T>
): (event: ActionContext) => Promise<ReturnType<typeof fail> | Response> {
    return async (event) => {
        try {
            if (!event.locals.user) {
                throw new UnauthorizedError('Please sign in to continue');
            }
            
            const ctx = { ...event.locals, user: event.locals.user } as AuthenticatedContext;
            const formData = await event.request.formData();
            
            const rawData = Object.fromEntries(formData.entries());
            const parseResult = schema.safeParse(rawData);
            
            if (!parseResult.success) {
                const errors: Record<string, string[]> = {};
                parseResult.error.errors.forEach((error) => {
                    const path = error.path.join('.');
                    if (!errors[path]) {
                        errors[path] = [];
                    }
                    errors[path].push(error.message);
                });
                
                return fail(400, {
                    error: 'Please check the form for errors',
                    errors,
                    values: rawData
                });
            }
            
            const result = await handler({ 
                ...event, 
                ctx, 
                body: parseResult.data,
                rawFormData: formData
            });
            
            if (result instanceof Response) {
                return result;
            }
            
            return result as any;
        } catch (error) {
            const formData = await event.request.formData().catch(() => new FormData());
            const values = preserveFormValues(formData);
            return mapErrorToFailure(error, values);
        }
    };
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
export function actionSuccess<T = any>(data?: T, message?: string): ActionResult<T> {
    return {
        success: true,
        data,
        ...(message && { message })
    };
}

/**
 * Helper to preserve form values on error
 */
export function preserveFormValues(formData: FormData, exclude: string[] = ['password', 'confirm-password', 'confirmPassword']): Record<string, any> {
    const values: Record<string, any> = {};
    
    for (const [key, value] of formData.entries()) {
        if (!exclude.includes(key) && typeof value === 'string') {
            values[key] = value;
        }
    }
    
    return values;
} 