// API function that handles all API routes
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');

  // Forward all API requests to Cloudflare's browser rendering API
  const cloudflareApiUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/${path}`;
  
  // Prepare headers
  const headers = new Headers(request.headers);
  headers.set('Authorization', `Bearer ${env.CLOUDFLARE_API_TOKEN}`);
  
  // Create a new request to forward
  const apiRequest = new Request(cloudflareApiUrl, {
    method: request.method,
    headers: headers,
    body: request.body,
  });
  
  try {
    // Forward the request to Cloudflare API
    const response = await fetch(apiRequest);
    
    // Return the response
    return response;
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
