// Groq AI integration for website analysis
export async function onRequestPost(context) {
  try {
    // Get request data
    const requestData = await context.request.json();
    
    // Check for required URL
    if (!requestData.url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get API key from environment
    const apiKey = context.env.GROQ_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY environment variable is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Construct the user message based on whether we have a screenshot
    let userMessage = `Analyze this website for SEO, performance, and Cloudflare optimization opportunities: ${requestData.url}. Organize your response in sections with emoji icons.`;
    
    if (requestData.screenshot) {
      userMessage = `Analyze this website for SEO, performance, and Cloudflare optimization opportunities: ${requestData.url}. 
A screenshot of the website is attached. Please include a "Visual Analysis 📸" section in your response that analyzes the visual layout, user interface design, and any visual elements visible in the screenshot.

Please organize your response in clear sections with emoji icons for each category, such as:
- SEO Analysis 🔍
- Performance Optimization ⚡
- Visual Design 📸
- Cloudflare Recommendations 🌩️
- Content Quality 📝
- User Experience 🌟

Be specific with your suggestions and explain why they would help improve the website.`;
    }
    
    // Prepare the API request to Groq
    const apiRequest = {
      model: "llama3-70b-8192",
      messages: [
        {
            role: "system", 
            content: "You are a professional SEO and website optimization expert with strong visual design analysis skills. Analyze the website URL provided and give detailed feedback on SEO, performance, visual design, and Cloudflare-specific optimizations."
        },
        {
            role: "user", 
            content: userMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      top_p: 1,
      stream: false,
    };
    
    // Call the Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(apiRequest)
    });
    
    // Check for successful response
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errorText}`);
    }
    
    // Get the analysis result
    const result = await response.json();
    
    // Extract and format the analysis content
    const analysisText = result.choices[0].message.content;
    
    // Format the analysis for HTML display
    const formattedAnalysis = analysisText
      .replace(/\n## (.*?)📸(.*?)\n/g, '<h5><i class="fas fa-camera"></i> $1$2</h5>')
      .replace(/\n## (.*?)🌟(.*?)\n/g, '<h5><i class="fas fa-star"></i> $1$2</h5>')
      .replace(/\n## (.*?)🔍(.*?)\n/g, '<h5><i class="fas fa-search"></i> $1$2</h5>')
      .replace(/\n## (.*?)⚡(.*?)\n/g, '<h5><i class="fas fa-bolt"></i> $1$2</h5>')
      .replace(/\n## (.*?)🌩️(.*?)\n/g, '<h5><i class="fas fa-cloud"></i> $1$2</h5>')
      .replace(/\n## (.*?)📝(.*?)\n/g, '<h5><i class="fas fa-clipboard"></i> $1$2</h5>')
      .replace(/\n## (.*?)(.*?)\n/g, '<h5>$1$2</h5>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    
    // Return the analysis result
    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: formattedAnalysis 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`Exception in analyze API: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
