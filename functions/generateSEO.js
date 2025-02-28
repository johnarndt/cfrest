/**
 * Function to generate SEO-optimized titles, descriptions, and hashtags using Groq's API
 */
export async function onRequest(context) {
  // Get the URL and metadata from the request
  const request = await context.request.json();
  const { url, title, description } = request;
  
  // Check if required data was provided
  if (!url) {
    return new Response(JSON.stringify({ error: 'URL is required' }), {
      status: 400, 
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Prepare a prompt for Groq to generate social media content
    const prompt = `
      Generate SEO-optimized social media content for the following webpage:
      
      URL: ${url}
      Original Title: ${title || 'Not provided'}
      Original Description: ${description || 'Not provided'}
      
      Please provide:
      1. A Twitter title (max 60 characters)
      2. A Twitter description (max 200 characters)
      3. A LinkedIn title (max 70 characters)
      4. A LinkedIn description (max 300 characters)
      5. A Facebook title (max 80 characters)
      6. A Facebook description (max 250 characters)
      7. 5-7 relevant hashtags
      
      Format the response as a JSON object with the following structure:
      {
        "twitter": {
          "title": "...",
          "description": "..."
        },
        "linkedin": {
          "title": "...",
          "description": "..."
        },
        "facebook": {
          "title": "...",
          "description": "..."
        },
        "hashtags": ["...", "...", "..."]
      }
      
      Make the content engaging, click-worthy, but not clickbait. Maintain accuracy.
    `;

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
            content: 'You are an expert SEO copywriter specializing in social media optimization.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
    }

    // Process the response
    const data = await response.json();
    let seoContent;
    
    try {
      // Try to parse the JSON from the completion
      const completion = data.choices[0].message.content;
      // Extract the JSON part from the response
      const jsonMatch = completion.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        seoContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from completion');
      }
    } catch (e) {
      // If parsing fails, return the raw completion
      return new Response(JSON.stringify({ 
        raw: data.choices[0].message.content,
        error: 'Failed to parse structured content'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(seoContent), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
