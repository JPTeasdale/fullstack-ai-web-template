import { DurableObject } from 'cloudflare:workers';

export interface RateLimitConfig {
	capacity: number;
	refillAmount: number;
	refillFrequencyMs: number;
}

// Default configuration if none is set
const DEFAULT_CONFIG: RateLimitConfig = {
	capacity: 10,
	refillAmount: 10,
	refillFrequencyMs: 60 * 60 * 1000 // 1 hour in milliseconds
};

// Durable Object with persistent configuration
export class RateLimiter extends DurableObject {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	// Set or update the configuration
	async setConfig(config: RateLimitConfig) {
		const currentConfig = await this.ctx.storage.get<RateLimitConfig>('config');
		
		// If capacity changed, reset tokens to new capacity
		if (!currentConfig || currentConfig.capacity !== config.capacity) {
			await this.ctx.storage.put('tokens', config.capacity);
			await this.ctx.storage.put('lastRefillMs', Date.now());
		}
		
		await this.ctx.storage.put('config', config);
		
		return {
			success: true,
			config
		};
	}

	// Get current configuration
	async getConfig(): Promise<RateLimitConfig> {
		const config = await this.ctx.storage.get<RateLimitConfig>('config');
		return config || DEFAULT_CONFIG;
	}

	// Check if request is allowed (no need to pass config)
	async isAllowed() {
		// Get stored configuration
		const config = await this.getConfig();
		
		// Load state from storage
		let lastRefillMs = await this.ctx.storage.get<number>('lastRefillMs');
		let tokens = await this.ctx.storage.get<number>('tokens');

		// Initialize on first use
		if (lastRefillMs === undefined || tokens === undefined) {
			lastRefillMs = Date.now();
			tokens = config.capacity;
			await this.ctx.storage.put('lastRefillMs', lastRefillMs);
			await this.ctx.storage.put('tokens', tokens);
		}

		// Refill tokens based on elapsed time
		const nowMs = Date.now();
		const elapsedMs = nowMs - lastRefillMs;
		const refillCycles = Math.floor(elapsedMs / config.refillFrequencyMs);
		const tokensToAdd = refillCycles * config.refillAmount;

		if (tokensToAdd > 0) {
			tokens = Math.min(tokens + tokensToAdd, config.capacity);
			
			// Update lastRefillMs to account for only the refill cycles we processed
			lastRefillMs = lastRefillMs + (refillCycles * config.refillFrequencyMs);
			
			await this.ctx.storage.put('lastRefillMs', lastRefillMs);
			await this.ctx.storage.put('tokens', tokens);
		}

		// Check if request is allowed
		if (tokens > 0) {
			tokens -= 1;
			await this.ctx.storage.put('tokens', tokens);
			
			return {
				allowed: true,
				remainingTokens: tokens,
				capacity: config.capacity,
				refillAmount: config.refillAmount,
				refillFrequencyMs: config.refillFrequencyMs,
				nextRefillIn: this._calculateNextRefillTime(lastRefillMs, config)
			};
		} else {
			return {
				allowed: false,
				remainingTokens: 0,
				capacity: config.capacity,
				refillAmount: config.refillAmount,
				refillFrequencyMs: config.refillFrequencyMs,
				nextRefillIn: this._calculateNextRefillTime(lastRefillMs, config)
			};
		}
	}

	// Get current state without consuming a token
	async getState() {
		const config = await this.getConfig();
		let lastRefillMs = await this.ctx.storage.get<number>('lastRefillMs');
		let tokens = await this.ctx.storage.get<number>('tokens');

		// Handle uninitialized state
		if (lastRefillMs === undefined || tokens === undefined) {
			return {
				tokens: config.capacity,
				capacity: config.capacity,
				refillAmount: config.refillAmount,
				refillFrequencyMs: config.refillFrequencyMs,
				nextRefillIn: 0,
				config
			};
		}

		// Calculate current tokens with refill
		const nowMs = Date.now();
		const elapsedMs = nowMs - lastRefillMs;
		const refillCycles = Math.floor(elapsedMs / config.refillFrequencyMs);
		const tokensToAdd = refillCycles * config.refillAmount;
		const currentTokens = Math.min(tokens + tokensToAdd, config.capacity);

		return {
			tokens: currentTokens,
			capacity: config.capacity,
			refillAmount: config.refillAmount,
			refillFrequencyMs: config.refillFrequencyMs,
			nextRefillIn: this._calculateNextRefillTime(lastRefillMs, config),
			config
		};
	}

	// Reset the rate limiter (keeps current config)
	async reset() {
		const config = await this.getConfig();
		await this.ctx.storage.put('lastRefillMs', Date.now());
		await this.ctx.storage.put('tokens', config.capacity);
	}

	// Clear all data including config
	async clear() {
		await this.ctx.storage.deleteAll();
	}

	private _calculateNextRefillTime(lastRefillMs: number, config: RateLimitConfig): number {
		const timeSinceLastRefill = Date.now() - lastRefillMs;
		const timeUntilNextRefill = config.refillFrequencyMs - (timeSinceLastRefill % config.refillFrequencyMs);
		return Math.ceil(timeUntilNextRefill / 1000); // Return seconds
	}
} 