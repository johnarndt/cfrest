/**
 * Function to capture website screenshots using Cloudflare's Browser Rendering API
 * https://developers.cloudflare.com/browser-rendering/rest-api/screenshot-endpoint/
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
    // Define the API URL according to Cloudflare's documentation
    const browserRenderingApiUrl = `https://browser-rendering.host.cloudflare.com/api/screenshot`;
    
    // Prepare the request body with options specified in Cloudflare's documentation
    const requestBody = {
      // Required
      url: targetUrl,
      // Optional parameters (all according to the API documentation)
      width: parseInt(url.searchParams.get('width') || '1200'),
      height: parseInt(url.searchParams.get('height') || '630'),
      timeout: 30,
      device: "desktop",
      wait_until: "networkidle0",
      // Output format options
      output_format: "binary",
      response_format: "json",
      encoding: "base64",
      dark_mode: false,
      // Optional selector to wait for - uncomment if needed
      // wait_for: ".specific-element",
    };
    
    console.log('Making request to Cloudflare Browser Rendering API with:', {
      url: targetUrl,
      accountId: context.env.CLOUDFLARE_ACCOUNT_ID
    });
    
    // Make the request to the Cloudflare Browser Rendering API
    const response = await fetch(browserRenderingApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    // Check for errors in the response
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = `API error: ${errorData.errors?.[0]?.message || errorData.error || errorMessage}`;
        console.error('Error details:', errorData);
      } catch (e) {
        const errorText = await response.text();
        errorMessage = `API error: ${errorText || errorMessage}`;
        console.error('Error response text:', errorText);
      }
      
      throw new Error(errorMessage);
    }
    
    // Parse the successful response
    const data = await response.json();
    
    if (!data.screenshot) {
      throw new Error('No screenshot data returned from API');
    }
    
    // Return the base64-encoded screenshot
    return new Response(JSON.stringify({
      success: true,
      result: {
        screenshotUrl: `data:image/jpeg;base64,${data.screenshot}`
      }
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error(`Error in renderSite:`, error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
