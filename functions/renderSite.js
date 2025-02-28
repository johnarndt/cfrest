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
    // Log the attempt to call the API for debugging
    console.log(`Attempting to take screenshot of: ${targetUrl}`);
    console.log(`Using account ID: ${context.env.CLOUDFLARE_ACCOUNT_ID}`);
    
    // For Cloudflare Pages Functions, we need to use Workers Browser Rendering API
    const response = await fetch(`https://demo.browser.cloudflare.com/?url=${encodeURIComponent(targetUrl)}`, {
      headers: {
        'Authorization': `Bearer ${context.env.CLOUDFLARE_API_TOKEN}`
      }
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status} - ${errorText}`);
      throw new Error(`Browser Rendering API error: ${response.statusText}`);
    }

    // Get the screenshot as a blob
    const imageBlob = await response.blob();
    
    // Convert blob to base64 string
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    // Return the screenshot data
    return new Response(JSON.stringify({
      success: true,
      result: {
        screenshotUrl: `data:image/jpeg;base64,${base64Image}`
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`Error in renderSite: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
