// Redirect API paths to the API function
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const { pathname } = url;

  // Static assets handling will be managed by Cloudflare Pages
  return context.next();
}
