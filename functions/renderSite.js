/**
 * Function to capture website screenshots using Cloudflare's Browser Rendering API
 * https://developers.cloudflare.com/browser-rendering/rest-api/screenshot-endpoint/
 */
export async function onRequest(context) {
  // Get the URL from the request - using URL parameters instead of body
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get('url');
  const diagnosticsMode = url.searchParams.get('diagnostics') === 'true';
  
  // If diagnostics mode is enabled, return detailed environment info
  if (diagnosticsMode) {
    return generateDiagnosticResponse(context);
  }
  
  // Log all available environment variables (keys only for security)
  const envKeys = Object.keys(context.env);
  console.log('Available environment variables:', envKeys);
  
  // Detailed check for API credentials
  const credentialStatus = {
    api_token: {
      exists: typeof context.env.CLOUDFLARE_API_TOKEN === 'string',
      length: context.env.CLOUDFLARE_API_TOKEN?.length || 0,
      format: context.env.CLOUDFLARE_API_TOKEN?.startsWith('bearer_') ? 'likely_valid' : 
              context.env.CLOUDFLARE_API_TOKEN?.length > 30 ? 'possibly_valid' : 'likely_invalid'
    },
    account_id: {
      exists: typeof context.env.CLOUDFLARE_ACCOUNT_ID === 'string',
      length: context.env.CLOUDFLARE_ACCOUNT_ID?.length || 0,
      format: /^[a-f0-9]{32}$/i.test(context.env.CLOUDFLARE_ACCOUNT_ID || '') ? 'likely_valid' : 'likely_invalid'
    },
    r2_binding: {
      exists: typeof context.env.PREVIEW_IMAGES !== 'undefined',
      type: typeof context.env.PREVIEW_IMAGES
    }
  };
  
  console.log('Credential status check:', JSON.stringify(credentialStatus));
  
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
    let errorMessages = [];
    
    // Additional API token debug info (not showing actual token)
    console.log('API Token debug info:', {
      isDefined: typeof context.env.CLOUDFLARE_API_TOKEN === 'string',
      length: context.env.CLOUDFLARE_API_TOKEN?.length || 0, 
      firstChar: context.env.CLOUDFLARE_API_TOKEN?.charAt(0) || 'undefined',
      lastChar: context.env.CLOUDFLARE_API_TOKEN?.charAt(context.env.CLOUDFLARE_API_TOKEN?.length - 1) || 'undefined'
    });
    
    console.log('Account ID debug info:', {
      isDefined: typeof context.env.CLOUDFLARE_ACCOUNT_ID === 'string',
      length: context.env.CLOUDFLARE_ACCOUNT_ID?.length || 0,
      firstChar: context.env.CLOUDFLARE_ACCOUNT_ID?.charAt(0) || 'undefined',
      lastChar: context.env.CLOUDFLARE_ACCOUNT_ID?.charAt(context.env.CLOUDFLARE_ACCOUNT_ID?.length - 1) || 'undefined'
    });

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
        const errorText = await response.text();
        const errorMsg = `X-Auth method failed with status ${response.status}: ${errorText}`;
        errorMessages.push(errorMsg);
        console.log(errorMsg);
        throw new Error(errorMsg);
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
          const errorText = await response.text();
          const errorMsg = `Bearer method failed with status ${response.status}: ${errorText}`;
          errorMessages.push(errorMsg);
          console.log(errorMsg);
          throw new Error(errorMsg);
        }
      } catch (bearerError) {
        // Try a third method with CF-Access headers
        try {
          console.log('Trying CF-Access header authentication method');
          response = await fetch(apiEndpoints[0], {
            method: 'POST',
            headers: {
              'CF-Access-Client-Id': context.env.CLOUDFLARE_ACCOUNT_ID,
              'CF-Access-Client-Secret': context.env.CLOUDFLARE_API_TOKEN,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });
          
          authMethodUsed = 'CF-Access';
          console.log('CF-Access method response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            const errorMsg = `CF-Access method failed with status ${response.status}: ${errorText}`;
            errorMessages.push(errorMsg);
            console.log(errorMsg);
            throw new Error(errorMsg);
          }
        } catch (cfAccessError) {
          console.error('All authentication methods failed:', {
            errorMessages,
            lastError: cfAccessError.message
          });
          
          throw new Error('All authentication methods failed: ' + errorMessages.join('; '));
        }
      }
    }
    
    console.log(`Successful API call using ${authMethodUsed} method`);
    
    // Check for errors in the response
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      let errorDetails = null;
      
      // Clone the response before reading it
      const responseClone = response.clone();
      
      // Get detailed error information
      try {
        const errorData = await response.json();
        errorDetails = errorData;
        errorMessage = `API error: ${errorData.errors?.[0]?.message || errorData.error || errorMessage}`;
        console.error('Error details:', JSON.stringify(errorData));
      } catch (e) {
        try {
          const errorText = await responseClone.text();
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
    // Clone the response before reading it to avoid "body used" errors
    const responseForParsing = response.clone();
    let data;
    try {
      data = await responseForParsing.json();
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
    
    // Create a new Response with the screenshot data to avoid body used errors
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

// Function to generate a diagnostic response
function generateDiagnosticResponse(context) {
  const diagnosticInfo = {
    envVars: Object.keys(context.env),
    requestUrl: context.request.url,
    requestHeaders: Object.keys(context.request.headers),
    workerCwd: process.cwd(),
    nodeVersion: process.version,
    v8Version: process.versions.v8,
    osPlatform: process.platform,
    osArch: process.arch,
    osRelease: process.release,
    osUptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
  };

  return new Response(JSON.stringify(diagnosticInfo, null, 2), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
