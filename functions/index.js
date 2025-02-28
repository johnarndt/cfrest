// Main entry point for the application
export async function onRequest(context) {
  try {
    // Get request path
    const url = new URL(context.request.url);
    const path = url.pathname;
    
    console.log(`Index function handling path: ${path}`);
    
    // If root or path is not specified, serve index.html
    if (path === "/" || path === "") {
      // Serve index.html from the assets
      const response = await context.env.ASSETS.fetch(new URL(context.request.url));
      return response;
    }
    
    // Otherwise pass to the asset handler
    return await context.env.ASSETS.fetch(context.request);
  } catch (error) {
    console.error(`Exception in index function: ${error.message}`);
    console.error(error.stack);
    
    return new Response(`Error serving page: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
