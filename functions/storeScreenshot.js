/**
 * Function to store screenshot images in Cloudflare KV
 * This allows for better downloading of images
 */
export async function onRequest(context) {
  try {
    // Ensure this is a POST request
    if (context.request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the request body
    const request = await context.request.json();
    const { imageData, url, platform } = request;
    
    if (!imageData || !url || !platform) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Extract the base64 data (remove the data:image/jpeg;base64, prefix)
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate a unique key for the image
    const timestamp = new Date().getTime();
    const urlHash = await hashString(url);
    const filename = `${platform}-${urlHash}-${timestamp}.jpg`;
    
    // Use Cloudflare Worker's cache for temporary storage (lasts up to 24 hours)
    const cacheKey = new Request(`https://image-cache/${filename}`);
    const cache = caches.default;
    
    // Create a new response with the image data
    const imageResponse = new Response(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
    
    // Store in the cache
    await cache.put(cacheKey, imageResponse.clone());
    
    // Return the URL for accessing the image
    const imageUrl = new URL(context.request.url);
    imageUrl.pathname = `/getScreenshot/${filename}`;
    
    return new Response(JSON.stringify({
      success: true,
      imageUrl: imageUrl.toString(),
      filename: filename
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error storing screenshot:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Helper function to create a hash from a string
 */
async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 10); // Only use first 10 chars for brevity
}
