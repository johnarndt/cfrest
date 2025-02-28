// Middleware for handling all requests
export async function onRequest(context) {
  try {
    // Get the URL path
    const url = new URL(context.request.url);
    const path = url.pathname;
    
    console.log(`Middleware processing path: ${path}`);
    
    // Check environment variables are available
    if (!context.env.CLOUDFLARE_API_TOKEN || !context.env.CLOUDFLARE_ACCOUNT_ID) {
      console.error("Missing required environment variables");
      if (!context.env.CLOUDFLARE_API_TOKEN) console.error("CLOUDFLARE_API_TOKEN is not set");
      if (!context.env.CLOUDFLARE_ACCOUNT_ID) console.error("CLOUDFLARE_ACCOUNT_ID is not set");
    } else {
      console.log("Environment variables are properly set");
    }
    
    // Continue to the next handler
    return await context.next();
  } catch (error) {
    console.error(`Middleware exception: ${error.message}`);
    console.error(error.stack);
    
    return new Response(`Server error in middleware: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
