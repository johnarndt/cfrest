/**
 * Function to capture website screenshots using Cloudflare's Browser Rendering API
 */
export async function onRequest(context) {
  // Get the URL from the request
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get('url');
  
  // Check if a URL was provided
  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'No URL provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Prepare the request to Cloudflare's Browser Rendering API
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${context.env.CLOUDFLARE_ACCOUNT_ID}/browser/screenshots`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: targetUrl,
        // Different sizes for different social platforms
        width: url.searchParams.get('width') || 1200,
        height: url.searchParams.get('height') || 628,
        // Wait until network is idle to ensure the page is fully loaded
        wait_until: 'networkidle0',
        // Format can be jpeg or png
        format: 'jpeg',
        // Quality between 1-100 for jpeg
        quality: 80
      })
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.errors?.[0]?.message || response.statusText}`);
    }

    // Return the screenshot data
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
