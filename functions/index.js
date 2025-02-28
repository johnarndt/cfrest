// Main entry point for the application
export async function onRequest(context) {
  // Serve index.html from the static directory
  return context.env.ASSETS.fetch(new URL(context.request.url).pathname);
}
