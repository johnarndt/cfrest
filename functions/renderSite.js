/**
 * Function to capture website screenshots using Cloudflare's Browser Rendering API
 * https://developers.cloudflare.com/browser-rendering/rest-api/screenshot-endpoint/
 */
export async function onRequest(context) {
  // Log all available environment variables (keys only for security)
  console.log('Available environment variables:', Object.keys(context.env));
  
  // Get the URL from the request
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get('url');
  
  // Validate the URL
  if (!targetUrl) {
    return new Response(JSON.stringify({
      error: 'Missing URL parameter',
      success: false
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  console.log('Rendering site:', targetUrl);
  
  try {
    // Cloudflare Browser Rendering API documentation reference:
    // https://developers.cloudflare.com/browser-rendering/
    
    // Testing both API endpoints to see which one works
    const apiEndpoints = [
      'https://browser-rendering.cloudflare.com/screenshot',
      'https://browser-rendering.host.cloudflare.com/api/screenshot'
    ];
    
    // Log API token and account ID structure/format (not the actual values for security)
    console.log('API token format check:', {
      length: context.env.CLOUDFLARE_API_TOKEN?.length,
      startsWithLetters: context.env.CLOUDFLARE_API_TOKEN?.startsWith('a') || context.env.CLOUDFLARE_API_TOKEN?.startsWith('b'),
      defined: !!context.env.CLOUDFLARE_API_TOKEN
    });
    
    console.log('Account ID format check:', {
      length: context.env.CLOUDFLARE_ACCOUNT_ID?.length,
      containsOnlyHexChars: /^[a-f0-9]+$/i.test(context.env.CLOUDFLARE_ACCOUNT_ID || ''),
      defined: !!context.env.CLOUDFLARE_ACCOUNT_ID
    });
    
    // Define the API URL according to Cloudflare's documentation
    const browserRenderingApiUrl = apiEndpoints[0]; // Using the first endpoint initially
    
    // Prepare the request body with options specified in Cloudflare's documentation
    const requestBody = {
      // Required
      url: targetUrl,
      // Optional parameters (all according to the API documentation)
      width: parseInt(url.searchParams.get('width') || '1200'),
      height: parseInt(url.searchParams.get('height') || '630'),
      timeout: 30,
      device: "desktop",
      wait_until: "networkidle0",
      // Output format options
      output_format: "binary",
      response_format: "json",
      encoding: "base64",
      dark_mode: false,
    };
    
    console.log('Making request to Browser Rendering API:', {
      endpoint: browserRenderingApiUrl,
      requestBody: { ...requestBody, url: targetUrl.substring(0, 30) + '...' }, // Truncate for logging
      envVarsAvailable: {
        CLOUDFLARE_API_TOKEN: !!context.env.CLOUDFLARE_API_TOKEN,
        CLOUDFLARE_ACCOUNT_ID: !!context.env.CLOUDFLARE_ACCOUNT_ID,
        GROQ_API_KEY: !!context.env.GROQ_API_KEY
      }
    });
    
    // Check if credentials are available
    if (!context.env.CLOUDFLARE_API_TOKEN) {
      throw new Error('CLOUDFLARE_API_TOKEN is missing in environment variables');
    }
    
    if (!context.env.CLOUDFLARE_ACCOUNT_ID) {
      throw new Error('CLOUDFLARE_ACCOUNT_ID is missing in environment variables');
    }
    
    // Try different authentication methods
    let response;
    let authMethodUsed;
    
    // Try the X-Auth method first
    try {
      console.log('Trying X-Auth header authentication method');
      response = await fetch(browserRenderingApiUrl, {
        method: 'POST',
        headers: {
          'X-Auth-Email': 'none',
          'X-Auth-Key': context.env.CLOUDFLARE_API_TOKEN,
          'X-Account-ID': context.env.CLOUDFLARE_ACCOUNT_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      authMethodUsed = 'X-Auth';
      console.log('X-Auth method response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`X-Auth method failed with status ${response.status}`);
      }
    } catch (error) {
      console.log('X-Auth method failed, trying Bearer token method');
      
      // If X-Auth fails, try the Bearer token method
      try {
        response = await fetch(apiEndpoints[1], {  // Using the second endpoint
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${context.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        authMethodUsed = 'Bearer';
        console.log('Bearer method response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Bearer method failed with status ${response.status}`);
        }
      } catch (bearerError) {
        console.error('Both authentication methods failed:', {
          xAuthError: error.message,
          bearerError: bearerError.message
        });
        
        throw new Error('All authentication methods failed');
      }
    }
    
    console.log(`Successful API call using ${authMethodUsed} method`);
    
    // Check for errors in the response
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      let errorDetails = null;
      
      // Get detailed error information
      try {
        const errorData = await response.json();
        errorDetails = errorData;
        errorMessage = `API error: ${errorData.errors?.[0]?.message || errorData.error || errorMessage}`;
        console.error('Error details:', JSON.stringify(errorData));
      } catch (e) {
        try {
          const errorText = await response.text();
          errorDetails = { text: errorText };
          errorMessage = `API error: ${errorText || errorMessage}`;
          console.error('Error response text:', errorText);
        } catch (textError) {
          console.error('Failed to get error details:', textError);
        }
      }
      
      // Log the complete error information
      console.error('Browser Rendering API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: browserRenderingApiUrl,
        authMethod: authMethodUsed,
        errorMessage,
        errorDetails
      });
      
      throw new Error(errorMessage);
    }
    
    // Parse the successful response
    let data;
    try {
      data = await response.json();
      console.log('API response structure:', {
        hasScreenshot: !!data.screenshot,
        responseKeys: Object.keys(data),
        dataType: typeof data,
        size: data.screenshot ? data.screenshot.length : 0
      });
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      const responseText = await response.text();
      console.log('Raw response text sample:', responseText.substring(0, 100) + '...');
      throw new Error('Failed to parse API response: ' + parseError.message);
    }
    
    if (!data.screenshot) {
      console.error('No screenshot in response:', data);
      throw new Error('No screenshot data returned from API');
    }

    // Now store this image using our storage function for better download support
    const platform = url.searchParams.get('platform') || 'default';
    const storeResponse = await fetch(new URL('/storeScreenshot', context.request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageData: `data:image/jpeg;base64,${data.screenshot}`,
        url: targetUrl,
        platform: platform
      })
    });

    if (!storeResponse.ok) {
      console.warn('Failed to store image, falling back to base64:', await storeResponse.text());
      // If storage fails, fall back to base64 data URL
      return new Response(JSON.stringify({
        success: true,
        result: {
          screenshotUrl: `data:image/jpeg;base64,${data.screenshot}`,
          downloadUrl: null
        }
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      });
    }

    // Get the stored image URL
    const storeData = await storeResponse.json();
    
    // Return both the base64 for display and the download URL
    return new Response(JSON.stringify({
      success: true,
      result: {
        screenshotUrl: `data:image/jpeg;base64,${data.screenshot}`,
        downloadUrl: storeData.imageUrl
      }
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error(`Error in renderSite:`, error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
