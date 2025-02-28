// DOM Elements
const urlInput = document.getElementById('url-input');
const analyzeBtn = document.getElementById('analyze-btn');
const loading = document.getElementById('loading');
const resultsContainer = document.getElementById('results-container');
const errorContainer = document.getElementById('error-container');
const errorText = document.getElementById('error-text');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// Debug: Log DOM elements to verify they're found
console.log('DOM Elements loaded:', { 
  urlInput: !!urlInput, 
  analyzeBtn: !!analyzeBtn,
  loading: !!loading,
  resultsContainer: !!resultsContainer,
  errorContainer: !!errorContainer,
  errorText: !!errorText,
  tabButtonsCount: tabButtons.length,
  tabPanesCount: tabPanes.length
});

// Store analysis data
let analysisData = {
  url: '',
  screenshot: '',
  valuePropositions: [],
  toneAnalysis: {},
  strengths: [],
  recommendations: []
};

// IMMEDIATELY add onclick handler
if (analyzeBtn) {
  analyzeBtn.onclick = function(e) {
    console.log("Direct onclick handler called");
    // Prevent any default behavior
    if (e) e.preventDefault();
    // Show visual feedback
    analyzeBtn.classList.add('clicked');
    setTimeout(() => analyzeBtn.classList.remove('clicked'), 200);
    // Call the analyze function
    analyzePage();
  };
  console.log("Added immediate onclick handler to button");
}

// Document ready event
document.addEventListener('DOMContentLoaded', function() {
  console.log("Document fully loaded");
  
  try {
    // Attach event listeners to tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const tab = this.getAttribute('data-tab');
        switchTab(tab);
      });
    });
    
    // Download button for screenshot
    const downloadBtn = document.getElementById('download-screenshot');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function() {
        downloadScreenshot();
      });
    }
    
    // Test onclick on analyze button again
    const analyzeButton = document.getElementById('analyze-btn');
    if (analyzeButton) {
      console.log('Analyze button found in DOMContentLoaded');
      analyzeButton.addEventListener('click', analyzePage);
    }
  } catch (e) {
    console.error("Error setting up event handlers:", e);
  }
});

/**
 * Main function to analyze the landing page
 */
async function analyzePage() {
  console.log("analyzePage function called");
  const url = urlInput.value.trim();
  
  // Validate URL
  if (!isValidUrl(url)) {
    showError("Please enter a valid URL");
    return;
  }
  
  try {
    // Show loading state
    loading.style.display = 'block';
    errorContainer.style.display = 'none';
    resultsContainer.style.display = 'none';
    
    // Store URL
    analysisData.url = url;
    
    // Get screenshot first
    await generateScreenshot(url);
    
    // Then analyze the content with Groq
    await analyzeContent(url);
    
    // Update UI with all the gathered data
    updateUI();
    
    // Hide loading and show results
    loading.style.display = 'none';
    resultsContainer.style.display = 'block';
    
  } catch (error) {
    console.error("Error analyzing page:", error);
    loading.style.display = 'none';
    showError(`Failed to analyze the page: ${error.message}`);
  }
}

/**
 * Generate a screenshot of the landing page
 */
async function generateScreenshot(url) {
  console.log("Generating screenshot for:", url);
  
  try {
    const response = await fetch(`/functions/renderSite?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to generate screenshot");
    }
    
    analysisData.screenshot = data.screenshotUrl;
    console.log("Screenshot generated:", analysisData.screenshot);
    
    return true;
  } catch (error) {
    console.error("Error generating screenshot:", error);
    throw new Error(`Screenshot generation failed: ${error.message}`);
  }
}

/**
 * Analyze the content of the landing page using Groq
 */
async function analyzeContent(url) {
  console.log("Analyzing content for:", url);
  
  try {
    const response = await fetch('/functions/analyzeContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to analyze content");
    }
    
    // Store analysis data
    analysisData.valuePropositions = data.valuePropositions || [];
    analysisData.toneAnalysis = data.toneAnalysis || {};
    analysisData.strengths = data.strengths || [];
    analysisData.recommendations = data.recommendations || [];
    
    console.log("Content analysis complete:", analysisData);
    
    return true;
  } catch (error) {
    console.error("Error analyzing content:", error);
    throw new Error(`Content analysis failed: ${error.message}`);
  }
}

/**
 * Update the UI with analysis results
 */
function updateUI() {
  console.log("Updating UI with analysis data");
  
  // Update screenshot
  const screenshotImg = document.getElementById('page-screenshot');
  if (screenshotImg && analysisData.screenshot) {
    screenshotImg.src = analysisData.screenshot;
    document.getElementById('download-screenshot').disabled = false;
  }
  
  // Update value propositions
  const valuePropsContent = document.getElementById('value-props-content');
  if (valuePropsContent && analysisData.valuePropositions.length > 0) {
    valuePropsContent.innerHTML = '';
    
    const valuePropsHTML = analysisData.valuePropositions.map(prop => 
      `<div class="card">
        <div class="card-title">${prop.title || 'Value Proposition'}</div>
        <p>${prop.description}</p>
      </div>`
    ).join('');
    
    valuePropsContent.innerHTML = valuePropsHTML;
  } else if (valuePropsContent) {
    valuePropsContent.innerHTML = '<p>No value propositions identified.</p>';
  }
  
  // Update tone analysis
  const toneContent = document.getElementById('tone-content');
  if (toneContent && analysisData.toneAnalysis) {
    toneContent.innerHTML = '';
    
    let toneHTML = `
      <div class="card">
        <div class="card-title">Overall Tone</div>
        <p>${analysisData.toneAnalysis.overall || 'Not available'}</p>
      </div>
    `;
    
    if (analysisData.toneAnalysis.aspects && analysisData.toneAnalysis.aspects.length > 0) {
      analysisData.toneAnalysis.aspects.forEach(aspect => {
        toneHTML += `
          <div class="card">
            <div class="card-title">${aspect.name}</div>
            <p>${aspect.description}</p>
          </div>
        `;
      });
    }
    
    toneContent.innerHTML = toneHTML;
  } else if (toneContent) {
    toneContent.innerHTML = '<p>Tone analysis not available.</p>';
  }
  
  // Update strengths
  const strengthsContent = document.getElementById('strengths-content');
  if (strengthsContent && analysisData.strengths.length > 0) {
    strengthsContent.innerHTML = '';
    
    const strengthsHTML = `
      <ul class="strengths-list">
        ${analysisData.strengths.map(strength => 
          `<li>
            <div class="card">
              <div class="card-title">${strength.title || 'Strength'}</div>
              <p>${strength.description}</p>
            </div>
          </li>`
        ).join('')}
      </ul>
    `;
    
    strengthsContent.innerHTML = strengthsHTML;
  } else if (strengthsContent) {
    strengthsContent.innerHTML = '<p>No significant strengths identified.</p>';
  }
  
  // Update recommendations
  const recommendationsContent = document.getElementById('recommendations-content');
  if (recommendationsContent && analysisData.recommendations.length > 0) {
    recommendationsContent.innerHTML = '';
    
    const recommendationsHTML = `
      <ul class="recommendations-list">
        ${analysisData.recommendations.map(rec => 
          `<li>
            <div class="card">
              <div class="card-title">${rec.title || 'Recommendation'}</div>
              <p>${rec.description}</p>
              ${rec.tags ? 
                `<div class="tags">
                  ${rec.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>` : ''}
            </div>
          </li>`
        ).join('')}
      </ul>
    `;
    
    recommendationsContent.innerHTML = recommendationsHTML;
  } else if (recommendationsContent) {
    recommendationsContent.innerHTML = '<p>No recommendations available.</p>';
  }
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
  console.log("Switching to tab:", tabName);
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Update tab panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    if (pane.id === `${tabName}-tab`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });
}

/**
 * Download the screenshot
 */
function downloadScreenshot() {
  console.log("Downloading screenshot");
  
  if (!analysisData.screenshot) {
    showError("No screenshot available to download");
    return;
  }
  
  // Create a temporary link to download the image
  const link = document.createElement('a');
  link.href = analysisData.screenshot;
  link.download = `landing-page-${new Date().getTime()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Show error message
 */
function showError(message) {
  console.error("Error:", message);
  errorText.textContent = message;
  errorContainer.style.display = 'block';
}

/**
 * Validate URL format
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
