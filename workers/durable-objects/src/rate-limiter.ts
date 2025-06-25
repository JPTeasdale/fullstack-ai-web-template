import { DurableObject } from 'cloudflare:workers';

const RATE_LIMIT_CONFIG = {
	basic: { capacity: 5, refillPerHour: 1 },
	pro: { capacity: 60, refillPerHour: 60 } 
};

// Durable Object
export class RateLimiter extends DurableObject {
	lastRefillMs: number;
	tokens: number;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.lastRefillMs = 0;
		this.tokens = 5;
	}

	async isAllowed(plan: keyof typeof RATE_LIMIT_CONFIG) {
		const config = RATE_LIMIT_CONFIG[plan] || RATE_LIMIT_CONFIG['basic'];

		this._refillTokens(config);

		if (this.tokens > 0) {
			this.tokens -= 1;
			return {
				allowed: true,
				waitMs: 0
			};
		} else {
			return {
				allowed: false
			};
		}
	}

	_refillTokens(config: { capacity: number; refillPerHour: number }) {
		const nowMs = Date.now();
		const elapsedMs = nowMs - this.lastRefillMs;
		const elapsedHours = msToHour(elapsedMs);
		const tokensToAdd = Math.floor(elapsedHours * config.refillPerHour);

		if (tokensToAdd > 0) {
			this.tokens = Math.min(this.tokens + tokensToAdd, config.capacity);

			// Keep the time remainder for the next refill
			const timeRemainder = elapsedHours % config.refillPerHour;
			this.lastRefillMs = nowMs - hourToMs(timeRemainder);
		}
	}
}


function msToHour(ms: number) {
	return ms / 1000 / 60 / 60;
}
function hourToMs(hours: number) {
	return hours * 60 * 60 * 1000;
}