/**
 * Function to capture website screenshots using a free screenshot service
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
    
    // Using a publicly available screenshot service
    // This service doesn't require authentication and returns a direct image
    const screenshotUrl = `https://api.apiflash.com/v1/urltoimage?access_key=6f8d1881727a46cf90966cd711d4772c&url=${encodeURIComponent(targetUrl)}&format=jpeg&quality=90&width=1200&height=628&ttl=2592000`;
    
    // Return the screenshot URL directly
    return new Response(JSON.stringify({
      success: true,
      result: {
        screenshotUrl: screenshotUrl
      }
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      }
    });
  } catch (error) {
    console.error(`Error in renderSite: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
