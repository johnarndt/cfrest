/**
 * Function to fetch metadata from a given URL
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
    // Fetch the webpage content
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extract metadata from the HTML
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    
    const descriptionMatch = html.match(/<meta name="description" content="(.*?)"/i);
    const description = descriptionMatch ? descriptionMatch[1] : '';
    
    // Extract Open Graph metadata
    const ogTitleMatch = html.match(/<meta property="og:title" content="(.*?)"/i);
    const ogTitle = ogTitleMatch ? ogTitleMatch[1] : '';
    
    const ogDescriptionMatch = html.match(/<meta property="og:description" content="(.*?)"/i);
    const ogDescription = ogDescriptionMatch ? ogDescriptionMatch[1] : '';
    
    const ogImageMatch = html.match(/<meta property="og:image" content="(.*?)"/i);
    const ogImage = ogImageMatch ? ogImageMatch[1] : '';
    
    // Compile and return the metadata
    const metadata = {
      url: targetUrl,
      title: ogTitle || title,
      description: ogDescription || description,
      image: ogImage
    };
    
    return new Response(JSON.stringify(metadata), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
