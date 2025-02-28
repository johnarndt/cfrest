/**
 * Function to retrieve stored screenshot images for downloading
 */
export async function onRequest(context) {
  // Get the filename from the URL path
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/');
  const filename = pathParts[pathParts.length - 1];
  
  if (!filename) {
    return new Response(JSON.stringify({ error: 'No filename provided', success: false }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  console.log(`Retrieving image: ${filename}`);
  
  try {
    // First, try to get the image from R2 if available
    if (context.env.PREVIEW_IMAGES) {
      try {
        console.log(`Checking R2 storage for ${filename}`);
        const r2Object = await context.env.PREVIEW_IMAGES.get(filename);
        
        if (r2Object !== null) {
          console.log(`Image found in R2 storage: ${filename}`);
          // Return the image with appropriate headers for download
          return new Response(r2Object.body, {
            headers: {
              'Content-Type': 'image/jpeg',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Cache-Control': 'public, max-age=86400'
            }
          });
        } else {
          console.log(`Image not found in R2 storage: ${filename}, trying cache`);
        }
      } catch (r2Error) {
        console.error('Error accessing R2 storage:', r2Error);
        // Fall through to cache as fallback
      }
    }
    
    // Fallback to cache if R2 fails or image not found in R2
    console.log(`Checking cache for ${filename}`);
    const cacheKey = new Request(`https://image-cache/${filename}`);
    const cache = caches.default;
    
    // Look for the image in the cache
    const cachedResponse = await cache.match(cacheKey);
    
    if (!cachedResponse) {
      console.log(`Image not found in cache: ${filename}`);
      return new Response(JSON.stringify({ error: 'Image not found', success: false }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`Image found in cache: ${filename}`);
    // Return the image with appropriate headers for download
    return new Response(cachedResponse.body, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (error) {
    console.error('Error retrieving screenshot:', error);
    return new Response(JSON.stringify({ 
      error: 'Error retrieving image: ' + error.message,
      success: false 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
