import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the cloudflare:workers module
vi.mock('cloudflare:workers', () => ({
  DurableObject: class DurableObject {
    constructor(public ctx: any, public env: any) {}
  }
}));

import { RateLimiter, RateLimitConfig } from './rate-limiter';

// Mock Durable Object storage
class MockStorage {
  private data = new Map<string, any>();
  
  async get<T>(key: string): Promise<T | undefined> {
    return this.data.get(key);
  }
  
  async put(key: string, value: any): Promise<void> {
    this.data.set(key, value);
  }
  
  async deleteAll(): Promise<void> {
    this.data.clear();
  }
}

// Mock Durable Object environment
class MockDurableObjectState {
  storage = new MockStorage();
}

class MockEnv {}

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  let mockState: MockDurableObjectState;
  let mockEnv: MockEnv;

  beforeEach(() => {
    mockState = new MockDurableObjectState();
    mockEnv = new MockEnv();
    rateLimiter = new RateLimiter(mockState as any, mockEnv as any);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('configuration management', () => {
    it('should use default config when none is set', async () => {
      const state = await rateLimiter.getState();
      expect(state.capacity).toBe(10);
      expect(state.refillAmount).toBe(10);
      expect(state.refillFrequencyMs).toBe(60 * 60 * 1000);
    });

    it('should persist configuration', async () => {
      const config: RateLimitConfig = {
        capacity: 100,
        refillAmount: 50,
        refillFrequencyMs: 60 * 60 * 1000 // 1 hour
      };
      
      await rateLimiter.setConfig(config);
      const storedConfig = await rateLimiter.getConfig();
      
      expect(storedConfig).toEqual(config);
    });

    it('should use persisted config for isAllowed', async () => {
      // Set a custom config
      await rateLimiter.setConfig({
        capacity: 3,
        refillAmount: 60,
        refillFrequencyMs: 60 * 60 * 1000 // 60 tokens per hour
      });
      
      // Should allow 3 requests
      for (let i = 0; i < 3; i++) {
        const result = await rateLimiter.isAllowed();
        expect(result.allowed).toBe(true);
        expect(result.capacity).toBe(3);
      }
      
      // 4th request should be denied
      const result = await rateLimiter.isAllowed();
      expect(result.allowed).toBe(false);
    });

    it('should reset tokens when capacity increases', async () => {
      // Start with small capacity
      await rateLimiter.setConfig({
        capacity: 2,
        refillAmount: 1,
        refillFrequencyMs: 60 * 60 * 1000 // 1 token per hour
      });
      
      // Use all tokens
      await rateLimiter.isAllowed();
      await rateLimiter.isAllowed();
      
      // Should be denied
      let result = await rateLimiter.isAllowed();
      expect(result.allowed).toBe(false);
      
      // Increase capacity
      await rateLimiter.setConfig({
        capacity: 5,
        refillAmount: 1,
        refillFrequencyMs: 60 * 60 * 1000
      });
      
      // Should now have 5 tokens available
      for (let i = 0; i < 5; i++) {
        result = await rateLimiter.isAllowed();
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe('typical usage scenario', () => {
    it('should handle user plan upgrade workflow', async () => {
      // User starts on free plan
      await rateLimiter.setConfig({
        capacity: 10,
        refillAmount: 10,
        refillFrequencyMs: 60 * 60 * 1000 // 10 tokens per hour
      });
      
      // Make some requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.isAllowed();
      }
      
      // Check state
      let state = await rateLimiter.getState();
      expect(state.tokens).toBe(5);
      
      // User upgrades to pro plan
      await rateLimiter.setConfig({
        capacity: 1000,
        refillAmount: 1000,
        refillFrequencyMs: 60 * 60 * 1000 // 1000 tokens per hour
      });
      
      // Should now have 1000 tokens
      state = await rateLimiter.getState();
      expect(state.tokens).toBe(1000);
      expect(state.capacity).toBe(1000);
    });

    it('should maintain separate configs for different users', async () => {
      // Create rate limiters for two users
      const user1State = new MockDurableObjectState();
      const user1Limiter = new RateLimiter(user1State as any, mockEnv as any);
      
      const user2State = new MockDurableObjectState();
      const user2Limiter = new RateLimiter(user2State as any, mockEnv as any);
      
      // Set different configs
      await user1Limiter.setConfig({
        capacity: 100,
        refillAmount: 100,
        refillFrequencyMs: 60 * 60 * 1000 // 100 tokens per hour
      });
      
      await user2Limiter.setConfig({
        capacity: 1000,
        refillAmount: 1000,
        refillFrequencyMs: 60 * 60 * 1000 // 1000 tokens per hour
      });
      
      // Verify they have different configs
      const user1Config = await user1Limiter.getConfig();
      const user2Config = await user2Limiter.getConfig();
      
      expect(user1Config.capacity).toBe(100);
      expect(user2Config.capacity).toBe(1000);
    });
  });

  describe('edge cases', () => {
    it('should handle clear() method', async () => {
      // Set config and use some tokens
      await rateLimiter.setConfig({
        capacity: 5,
        refillAmount: 5,
        refillFrequencyMs: 60 * 60 * 1000
      });
      
      await rateLimiter.isAllowed();
      await rateLimiter.isAllowed();
      
      // Clear everything
      await rateLimiter.clear();
      
      // Should be back to defaults
      const state = await rateLimiter.getState();
      expect(state.capacity).toBe(10); // default capacity
      expect(state.tokens).toBe(10);
    });

    it('should handle reset() method', async () => {
      // Set config and use some tokens
      await rateLimiter.setConfig({
        capacity: 5,
        refillAmount: 5,
        refillFrequencyMs: 60 * 60 * 1000
      });
      
      await rateLimiter.isAllowed();
      await rateLimiter.isAllowed();
      
      // Reset (keeps config)
      await rateLimiter.reset();
      
      // Should have full capacity but same config
      const state = await rateLimiter.getState();
      expect(state.capacity).toBe(5);
      expect(state.tokens).toBe(5);
    });
  });

  describe('refill logic', () => {
    it('should refill tokens based on frequency', async () => {
      // Set config with 10 tokens every minute
      await rateLimiter.setConfig({
        capacity: 100,
        refillAmount: 10,
        refillFrequencyMs: 60 * 1000 // 1 minute
      });
      
      // Use some tokens
      for (let i = 0; i < 5; i++) {
        await rateLimiter.isAllowed();
      }
      
      // Should have 95 tokens
      let state = await rateLimiter.getState();
      expect(state.tokens).toBe(95);
      
      // Advance time by 2 minutes
      vi.advanceTimersByTime(2 * 60 * 1000);
      
      // Should have refilled 20 tokens (2 cycles × 10 tokens)
      state = await rateLimiter.getState();
      expect(state.tokens).toBe(100); // Capped at capacity
    });

    it('should handle sub-second refill frequencies', async () => {
      // Set config with 1 token every 100ms
      await rateLimiter.setConfig({
        capacity: 50,
        refillAmount: 1,
        refillFrequencyMs: 100
      });
      
      // Use 10 tokens
      for (let i = 0; i < 10; i++) {
        await rateLimiter.isAllowed();
      }
      
      // Should have 40 tokens
      let state = await rateLimiter.getState();
      expect(state.tokens).toBe(40);
      
      // Advance time by 500ms
      vi.advanceTimersByTime(500);
      
      // Should have refilled 5 tokens
      state = await rateLimiter.getState();
      expect(state.tokens).toBe(45);
    });
  });
}); 