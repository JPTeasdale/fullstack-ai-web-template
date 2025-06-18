/**
 * Supabase Keepalive Worker
 *
 * This Cloudflare Worker pings your Supabase instance periodically to prevent
 * it from going to sleep on the free tier. It runs on a configurable interval
 * using Cloudflare's cron triggers.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` to test locally
 * - Run `npm run deploy` to publish your Worker
 *
 * Configure your Supabase URL and API key in wrangler.jsonc environment variables.
 */

interface Env {
	SUPABASE_URL: string;
	SUPABASE_ANON_KEY: string;
}

export default {
	async fetch(req, env: Env) {
		const url = new URL(req.url);
		url.pathname = '/__scheduled';
		url.searchParams.append('cron', '0 0 */3 * *');
		return new Response(
			`Supabase Keepalive Worker\n\n` +
			`To test the scheduled handler locally:\n` +
			`1. Use "--test-scheduled" flag when running wrangler dev\n` +
			`2. Run: curl "${url.href}"\n\n` +
			`Current config:\n` +
			`- Supabase URL: ${env.SUPABASE_URL ? 'configured' : 'not configured'}\n` +
			`- API Key: ${env.SUPABASE_ANON_KEY ? 'configured' : 'not configured'}`
		);
	},

	// The scheduled handler runs every 5 minutes to ping Supabase
	async scheduled(event, env: Env, ctx): Promise<void> {
		console.log(`🔄 Supabase keepalive triggered at ${event.cron}`);

		if (!env.SUPABASE_URL) {
			console.error('❌ SUPABASE_URL environment variable not configured');
			return;
		}

		try {
			// Ping Supabase with a simple health check request
			// This uses the REST API's health endpoint which is lightweight
			const supabaseUrl = env.SUPABASE_URL.replace(/\/$/, ''); // Remove trailing slash
			const healthUrl = `${supabaseUrl}/rest/v1/`;
			
			const response = await fetch(healthUrl, {
				method: 'GET',
				headers: {
					'apikey': env.SUPABASE_ANON_KEY || '',
					'Authorization': `Bearer ${env.SUPABASE_ANON_KEY || ''}`,
					'Content-Type': 'application/json'
				},
				// Add timeout to prevent hanging
				signal: AbortSignal.timeout(10000) // 10 second timeout
			});

			if (response.ok) {
				console.log(`✅ Supabase ping successful (${response.status})`);
			} else {
				console.warn(`⚠️ Supabase ping returned ${response.status}: ${response.statusText}`);
			}
		} catch (error) {
			console.error(`❌ Supabase ping failed:`, error instanceof Error ? error.message : String(error));
		}
	},
} satisfies ExportedHandler<Env>;
