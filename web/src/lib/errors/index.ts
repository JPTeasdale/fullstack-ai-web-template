/**
 * Application-wide custom error classes for better error handling
 */

/**
 * Error thrown when a requested resource is not found
 */
export class NotFoundError extends Error {
    constructor(
        public readonly resource: string = 'Resource',
        message?: string
    ) {
        super(message || `${resource} not found`);
        this.name = 'NotFoundError';
    }
}

/**
 * Error thrown when an operation fails
 */
export class OperationError extends Error {
    constructor(
        message: string,
        public readonly operation: string,
        public readonly context?: Record<string, any>
    ) {
        super(message);
        this.name = 'OperationError';
    }
}

/**
 * Error thrown when user is not authorized to perform an action
 */
export class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

/**
 * Error thrown when user lacks permission for a specific resource or action
 */
export class ForbiddenError extends Error {
    constructor(message = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

/**
 * Error thrown when request validation fails
 */
export class ValidationError extends Error {
    constructor(
        message: string,
        public readonly fields?: Record<string, string[]>
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}

/**
 * Error thrown when an external service is unavailable
 */
export class ServiceUnavailableError extends Error {
    constructor(
        public readonly service: string,
        message?: string
    ) {
        super(message || `${service} service is unavailable`);
        this.name = 'ServiceUnavailableError';
    }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends Error {
    constructor(
        public readonly resource: string,
        public readonly limit: number,
        public readonly resetTime?: Date
    ) {
        super(`Rate limit exceeded for ${resource}`);
        this.name = 'RateLimitError';
    }
}

/**
 * Error thrown when there's a conflict with existing data
 */
export class ConflictError extends Error {
    constructor(
        message: string,
        public readonly conflictType: 'duplicate' | 'state' | 'version',
        public readonly existingResource?: any
    ) {
        super(message);
        this.name = 'ConflictError';
    }
}

/**
 * Error thrown when request payload is too large
 */
export class PayloadTooLargeError extends Error {
    constructor(
        public readonly maxSize: number,
        public readonly actualSize: number
    ) {
        super(`Payload too large. Maximum size: ${maxSize} bytes, actual: ${actualSize} bytes`);
        this.name = 'PayloadTooLargeError';
    }
}

/**
 * Error thrown when a required configuration is missing
 */
export class ConfigurationError extends Error {
    constructor(
        public readonly configKey: string,
        message?: string
    ) {
        super(message || `Missing required configuration: ${configKey}`);
        this.name = 'ConfigurationError';
    }
}

// Re-export API error utilities
export { throwApiError, withApiErrorHandling } from './api'; 