export interface Env {
	CF_API_TOKEN: string;
	CF_ZONE_ID: string;
	TOKEN_CONFIG_ID: string;
	JWKS_URL: string;
  }

  interface JWKS {
	keys: {
		kid: string;
		alg: string;
		use: string;
		n: string;
		e: string;
	}[];
  }
  
  export default {
	async scheduled(_: ScheduledController, env: Env, ctx: ExecutionContext) {
	  ctx.waitUntil(fetch(env.JWKS_URL)
		.then(res => res.json() as Promise<JWKS>)
		.then(jwks => 
		  fetch(
			`https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/api_gateway/token_validation/${env.TOKEN_CONFIG_ID}/credentials`,
			{
			  method: "PUT",
			  headers: {
				Authorization: `Bearer ${env.CF_API_TOKEN}`,
				"Content-Type": "application/json"
			  },
			  body: JSON.stringify({ keys: jwks.keys })
			}
		  )
		)
	  );
	}
  };