// API function that handles all API routes
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');

  try {
    // Log the request for debugging
    console.log(`Processing request for path: ${path}`);
    
    // Check if environment variables are set
    if (!env.CLOUDFLARE_API_TOKEN) {
      console.error("CLOUDFLARE_API_TOKEN is not set");
      return new Response(
        JSON.stringify({ error: "API token not configured" }), 
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*' 
          } 
        }
      );
    }
    
    if (!env.CLOUDFLARE_ACCOUNT_ID) {
      console.error("CLOUDFLARE_ACCOUNT_ID is not set");
      return new Response(
        JSON.stringify({ error: "Account ID not configured" }), 
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*' 
          } 
        }
      );
    }
    
    console.log(`Using account ID: ${env.CLOUDFLARE_ACCOUNT_ID}`);
    
    // Forward all API requests to Cloudflare's browser rendering API
    const cloudflareApiUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/${path}`;
    
    // Log request body for debugging
    let requestBody = null;
    if (request.method !== 'GET') {
      const clonedRequest = request.clone();
      try {
        requestBody = await clonedRequest.json();
        console.log('Request body:', JSON.stringify(requestBody));
      } catch (e) {
        console.error('Error parsing request body:', e);
      }
    }
    
    // Prepare headers
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${env.CLOUDFLARE_API_TOKEN}`);
    headers.set('Content-Type', 'application/json');
    
    // Create a new request to forward
    const apiRequest = new Request(cloudflareApiUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' ? JSON.stringify(requestBody) : undefined,
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
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*' 
          } 
        }
      );
    }
    
    // Create a new response with CORS headers
    const originalResponse = new Response(response.body, response);
    const newHeaders = new Headers(originalResponse.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    
    // Return the response with CORS headers
    return new Response(originalResponse.body, {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers: newHeaders
    });
  } catch (error) {
    console.error(`Exception in API function: ${error.message}`);
    console.error(error.stack);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }), 
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        }
      }
    );
  }
}
