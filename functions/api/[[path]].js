// API function that handles all API routes
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');

  try {
    // Log the request for debugging
    console.log(`Processing request for path: ${path}`);
    console.log(`Using account ID: ${env.CLOUDFLARE_ACCOUNT_ID}`);
    
    // Forward all API requests to Cloudflare's browser rendering API
    const cloudflareApiUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/${path}`;
    
    // Prepare headers
    const headers = new Headers(request.headers);
    headers.set('Authorization', `Bearer ${env.CLOUDFLARE_API_TOKEN}`);
    
    // Create a new request to forward
    const apiRequest = new Request(cloudflareApiUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' ? request.body : undefined,
    });
    
    console.log(`Forwarding to: ${cloudflareApiUrl}`);
    
    // Forward the request to Cloudflare API
    const response = await fetch(apiRequest);
    
    // Check if the response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status} ${response.statusText}`);
      console.error(`Error details: ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: `API error: ${response.status} ${response.statusText}`, 
          details: errorText 
        }), 
        { 
          status: response.status, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Return the response
    return response;
  } catch (error) {
    console.error(`Exception in API function: ${error.message}`);
    console.error(error.stack);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
