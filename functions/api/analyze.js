// Groq AI integration for website analysis
export async function onRequest(context) {
  const { request, env } = context;
  
  try {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Get request body
    const requestData = await request.json();
    
    // Validate request data
    if (!requestData.url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Check if Groq API key is set
    if (!env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set");
      return new Response(JSON.stringify({ error: "Groq API token not configured" }), { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        } 
      });
    }
    
    // Call the Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: "You are a professional SEO and website optimization expert. Analyze the website URL provided and give detailed feedback on SEO, performance, and Cloudflare-specific optimizations."
          },
          {
            role: "user",
            content: `Analyze this website for SEO, performance, and Cloudflare optimization opportunities: ${requestData.url}. If there's a screenshot attached, use that for visual analysis as well. Organize your response in sections with emoji icons.`
          }
        ],
        temperature: 0.5,
        max_tokens: 1024
      })
    });
    
    // Check if the Groq API call was successful
    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error(`Groq API error: ${groqResponse.status} ${groqResponse.statusText}`);
      console.error(`Error details: ${errorText}`);
      
      return new Response(JSON.stringify({ 
        error: `Groq API error: ${groqResponse.status} ${groqResponse.statusText}`, 
        details: errorText 
      }), { 
        status: groqResponse.status, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        } 
      });
    }
    
    // Parse and return Groq's response
    const analysisData = await groqResponse.json();
    
    return new Response(JSON.stringify(analysisData), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      }
    });
    
  } catch (error) {
    console.error(`Exception in analyze API: ${error.message}`);
    console.error(error.stack);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      }
    });
  }
}
