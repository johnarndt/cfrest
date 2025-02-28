/**
 * Function to retrieve stored screenshot images for downloading
 */
export async function onRequest(context) {
  // Get the filename from the URL path
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/');
  const filename = pathParts[pathParts.length - 1];
  
  if (!filename) {
    return new Response(JSON.stringify({ error: 'No filename provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Try to get the image from the cache
    const cacheKey = new Request(`https://image-cache/${filename}`);
    const cache = caches.default;
    
    // Look for the image in the cache
    const cachedResponse = await cache.match(cacheKey);
    
    if (!cachedResponse) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
