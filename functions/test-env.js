// Test file to check environment variables
export async function onRequest(context) {
  const { env } = context;
  
  // Build a simple response with environment variable status
  const response = {
    hasApiToken: !!env.CLOUDFLARE_API_TOKEN,
    hasAccountId: !!env.CLOUDFLARE_ACCOUNT_ID,
    // Don't include actual values for security reasons
    accountIdPrefix: env.CLOUDFLARE_ACCOUNT_ID ? env.CLOUDFLARE_ACCOUNT_ID.substring(0, 5) + '...' : null,
    tokenLength: env.CLOUDFLARE_API_TOKEN ? env.CLOUDFLARE_API_TOKEN.length : 0
  };
  
  return new Response(JSON.stringify(response, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
