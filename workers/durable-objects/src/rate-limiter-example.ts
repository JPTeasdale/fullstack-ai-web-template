import { RateLimitConfig } from './rate-limiter';

// RateLimiter Durable Object stub interface
interface RateLimiterStub {
	setConfig(config: RateLimitConfig): Promise<{ success: boolean; config: RateLimitConfig }>;
	getConfig(): Promise<RateLimitConfig>;
	isAllowed(): Promise<{
		allowed: boolean;
		remainingTokens: number;
		capacity: number;
		refillAmount: number;
		refillFrequencyMs: number;
		nextRefillIn: number;
	}>;
	getState(): Promise<{
		tokens: number;
		capacity: number;
		refillAmount: number;
		refillFrequencyMs: number;
		nextRefillIn: number;
		config: RateLimitConfig;
	}>;
	reset(): Promise<void>;
	clear(): Promise<void>;
}

// Environment bindings
interface Env {
	RATE_LIMITER: DurableObjectNamespace;
}

// Define your app's rate limit plans
const RATE_LIMIT_PLANS: Record<string, RateLimitConfig> = {
	free: {
		capacity: 10,
		refillAmount: 10,
		refillFrequencyMs: 60 * 60 * 1000 // Refill 10 tokens every hour
	},
	basic: {
		capacity: 100,
		refillAmount: 100,
		refillFrequencyMs: 60 * 60 * 1000 // Refill 100 tokens every hour
	},
	pro: {
		capacity: 1000,
		refillAmount: 1000,
		refillFrequencyMs: 60 * 60 * 1000 // Refill 1000 tokens every hour
	},
	enterprise: {
		capacity: 10000,
		refillAmount: 10000,
		refillFrequencyMs: 60 * 60 * 1000 // Refill 10000 tokens every hour
	},
	// Example of a more frequent refill plan
	streaming: {
		capacity: 60,
		refillAmount: 1,
		refillFrequencyMs: 1000 // Refill 1 token every second (60 per minute)
	}
};

// Worker with different endpoints
export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const userId = request.headers.get('x-user-id') || 'anonymous';
		
		// Get the rate limiter for this user
		const id = env.RATE_LIMITER.idFromName(userId);
		const rateLimiter = env.RATE_LIMITER.get(id);
		
		// Handle different endpoints
		switch (url.pathname) {
			// Admin endpoint to update a user's rate limit plan
			case '/api/admin/update-plan': {
				if (request.method !== 'POST') {
					return new Response('Method not allowed', { status: 405 });
				}
				
				const { userId, plan } = await request.json() as { userId: string; plan: string };
				const planConfig = RATE_LIMIT_PLANS[plan];
				
				if (!planConfig) {
					return new Response('Invalid plan', { status: 400 });
				}
				
				// Get the user's rate limiter
				const userLimiterId = env.RATE_LIMITER.idFromName(userId);
				const userRateLimiter = env.RATE_LIMITER.get(userLimiterId);
				
				// Update their configuration
				const result = await userRateLimiter.setConfig(planConfig);
				
				return new Response(JSON.stringify({
					message: 'Plan updated successfully',
					...result
				}), {
					headers: { 'Content-Type': 'application/json' }
				});
			}
			
			// Regular API endpoint that checks rate limits
			case '/api/data': {
				// No need to pass config - it uses the stored configuration
				const { allowed, remainingTokens, capacity, nextRefillIn } = await rateLimiter.isAllowed();
				
				// Add rate limit headers
				const headers = new Headers({
					'X-RateLimit-Limit': capacity.toString(),
					'X-RateLimit-Remaining': remainingTokens.toString(),
					'X-RateLimit-Reset': nextRefillIn.toString(),
					'Content-Type': 'application/json'
				});
				
				if (!allowed) {
					headers.set('Retry-After', nextRefillIn.toString());
					return new Response(JSON.stringify({ 
						error: 'Rate limit exceeded',
						retryAfter: nextRefillIn 
					}), { 
						status: 429,
						headers 
					});
				}
				
				// Process the request
				return new Response(JSON.stringify({ 
					data: 'Your API response here',
					rateLimit: {
						remaining: remainingTokens,
						limit: capacity,
						resetIn: nextRefillIn
					}
				}), {
					headers
				});
			}
			
			// Endpoint to check current rate limit status
			case '/api/rate-limit/status': {
				const state = await rateLimiter.getState();
				
				return new Response(JSON.stringify(state), {
					headers: { 'Content-Type': 'application/json' }
				});
			}
			
			// Webhook endpoint called when user subscription changes
			case '/webhooks/subscription-updated': {
				if (request.method !== 'POST') {
					return new Response('Method not allowed', { status: 405 });
				}
				
				const { userId, newPlan } = await request.json() as { userId: string; newPlan: string };
				const planConfig = RATE_LIMIT_PLANS[newPlan];
				
				if (!planConfig) {
					return new Response('Invalid plan', { status: 400 });
				}
				
				// Get the user's rate limiter
				const userLimiterId = env.RATE_LIMITER.idFromName(userId);
				const userRateLimiter = env.RATE_LIMITER.get(userLimiterId);
				
				// Update their configuration
				await userRateLimiter.setConfig(planConfig);
				
				return new Response('OK', { status: 200 });
			}
			
			default:
				return new Response('Not found', { status: 404 });
		}
	}
};

// Example: Initialize a new user with a specific plan
export async function initializeUserRateLimit(
	env: Env, 
	userId: string, 
	plan: keyof typeof RATE_LIMIT_PLANS
) {
	const id = env.RATE_LIMITER.idFromName(userId);
	const rateLimiter = env.RATE_LIMITER.get(id);
	const planConfig = RATE_LIMIT_PLANS[plan];
	
	await rateLimiter.setConfig(planConfig);
} 