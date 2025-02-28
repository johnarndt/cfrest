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

    // Get the request body - parse only once
    let requestData;
    try {
      requestData = await context.request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: error.message,
        success: false
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { imageData, url, platform } = requestData;
    
    // Log receipt of data without exposing actual image data
    console.log('Storing screenshot:', {
      hasImageData: !!imageData,
      url: url?.substring(0, 30) + '...',
      platform,
      imageDataLength: imageData?.length
    });
    
    if (!imageData || !url || !platform) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters',
        success: false
      }), {
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
    
    console.log(`Storing image with filename: ${filename}`);
    
    // Check if we have R2 storage binding available
    if (context.env.PREVIEW_IMAGES) {
      try {
        // Store image in R2 bucket
        await context.env.PREVIEW_IMAGES.put(filename, buffer, {
          httpMetadata: {
            contentType: 'image/jpeg',
            cacheControl: 'public, max-age=86400',
            contentDisposition: `attachment; filename="${filename}"`
          }
        });
        
        // Get the public URL for the image - adjust this based on your actual domain 
        const domain = new URL(context.request.url).hostname;
        const publicUrl = `https://${domain}/getScreenshot/${filename}`;
        
        console.log(`Image stored in R2, public URL: ${publicUrl}`);
        
        // Return the URL for accessing the image
        return new Response(JSON.stringify({
          success: true,
          imageUrl: publicUrl,
          filename: filename
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (r2Error) {
        console.error('R2 storage error:', r2Error);
        // Fall through to cache storage as fallback
      }
    }
    
    // Fallback to cache storage if R2 is not available
    console.log('Falling back to cache storage (24 hour retention)');
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
