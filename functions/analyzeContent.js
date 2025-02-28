/**
 * Function to analyze landing page content using Groq's API
 */
export async function onRequest(context) {
  // Log that the function was called and available environment variables
  console.log('analyzeContent function called, env vars available:', {
    GROQ_API_KEY: !!context.env.GROQ_API_KEY
  });
  
  try {
    // Get the URL from the request - read only once
    let requestData;
    try {
      requestData = await context.request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: error.message,
        success: false 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { url } = requestData;
    
    console.log('Request data received:', {
      hasUrl: !!url
    });
    
    // Check if required data was provided
    if (!url) {
      return new Response(JSON.stringify({ 
        error: 'URL is required', 
        success: false 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if we have a Groq API key
    if (!context.env.GROQ_API_KEY) {
      console.error('Missing GROQ_API_KEY in environment variables');
      throw new Error('GROQ_API_KEY environment variable is not set');
    }
    
    // First, we need to get the text content from the page
    // Let's call the renderSite function to get the page content
    const renderResponse = await fetch(`${new URL(context.request.url).origin}/functions/renderSite?url=${encodeURIComponent(url)}&textOnly=true`);
    
    if (!renderResponse.ok) {
      throw new Error(`Failed to fetch page content: ${renderResponse.status} ${renderResponse.statusText}`);
    }
    
    const renderData = await renderResponse.json();
    
    if (!renderData.success || !renderData.pageContent) {
      throw new Error('Failed to extract page content');
    }
    
    const pageContent = renderData.pageContent;
    
    // Prepare a prompt for Groq to analyze the landing page
    const prompt = `
      Analyze this landing page content for a competitor analysis:
      
      URL: ${url}
      
      PAGE CONTENT:
      ${pageContent}
      
      Please provide a comprehensive analysis with the following sections:
      
      1. Value Propositions: Identify the main value propositions and unique selling points on this landing page.
      2. Tone Analysis: Analyze the tone, voice, and style of the content.
      3. Strengths: Identify the key strengths of this landing page.
      4. Recommendations: Provide actionable recommendations on how to create a landing page that differentiates from this competitor.
      
      Format the response as a JSON object with the following structure:
      {
        "valuePropositions": [
          {
            "title": "Value Proposition Title",
            "description": "Detailed explanation of the value proposition"
          }
        ],
        "toneAnalysis": {
          "overall": "Overall description of the tone",
          "aspects": [
            {
              "name": "Aspect Name (e.g., Formality, Emotion, etc.)",
              "description": "Description of this tone aspect"
            }
          ]
        },
        "strengths": [
          {
            "title": "Strength Title",
            "description": "Detailed explanation of the strength"
          }
        ],
        "recommendations": [
          {
            "title": "Recommendation Title",
            "description": "Detailed actionable recommendation",
            "tags": ["relevantTag1", "relevantTag2"]
          }
        ]
      }
      
      Make sure your analysis is detailed, insightful, and provides actionable intelligence.
    `;

    console.log('Prompt prepared');

    // Call Groq's API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192', // Using Llama 3 70B model
        messages: [
          {
            role: 'system',
            content: 'You are an expert landing page analyst specializing in marketing, UX, and competitor analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    console.log('Groq API response received:', response.status);

    // Check if the request was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
    }

    // Parse the response
    const responseData = await response.json();
    console.log('Groq API response parsed successfully');

    // Extract the content from Groq's response
    const content = responseData.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in Groq API response');
    }

    // Parse the JSON from the response
    let analysisData;
    try {
      // Extract JSON object from the response (it might include markdown backticks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract JSON from Groq response');
      }
    } catch (parseError) {
      console.error('Error parsing Groq response:', parseError);
      throw new Error(`Failed to parse analysis data: ${parseError.message}`);
    }

    // Return the analysis data
    return new Response(JSON.stringify({
      success: true,
      url,
      valuePropositions: analysisData.valuePropositions || [],
      toneAnalysis: analysisData.toneAnalysis || {},
      strengths: analysisData.strengths || [],
      recommendations: analysisData.recommendations || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in analyzeContent:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
