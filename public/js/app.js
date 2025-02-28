// DOM Elements
const urlInput = document.getElementById('url-input');
const generateBtn = document.getElementById('generate-btn');
const loading = document.getElementById('loading');
const previewContainer = document.getElementById('preview-container');
const errorContainer = document.getElementById('error-container');
const errorText = document.getElementById('error-text');
const tabButtons = document.querySelectorAll('.tab-btn');
const platformPreviews = document.querySelectorAll('.platform-preview');

// Debug: Log DOM elements to verify they're found
console.log('DOM Elements loaded:', { 
  urlInput: !!urlInput, 
  generateBtn: !!generateBtn,
  loading: !!loading,
  previewContainer: !!previewContainer,
  errorContainer: !!errorContainer,
  errorText: !!errorText,
  tabButtonsCount: tabButtons.length,
  platformPreviewsCount: platformPreviews.length
});

// Store generated data
let generatedData = {
  url: '',
  title: '',
  description: '',
  screenshots: {},
  downloadUrls: {}, 
  seoContent: null
};

// IMMEDIATELY add onclick handler
if (generateBtn) {
  generateBtn.onclick = function(e) {
    console.log("Direct onclick handler called");
    // Prevent any default behavior
    if (e) e.preventDefault();
    // Show visual feedback
    generateBtn.classList.add('clicked');
    setTimeout(() => generateBtn.classList.remove('clicked'), 200);
    // Call the function
    generatePreviews();
    return false; // Prevent event bubbling
  };
  console.log("Added immediate onclick handler to button");
}

// Document ready event
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded');
  
  // Debug: Explicitly check if the button exists
  if (generateBtn) {
    console.log('Generate button found, adding event listener...');
    
    // Add click event with visual feedback
    generateBtn.addEventListener('click', function(e) {
      console.log('Generate button clicked!');
      if (e) e.preventDefault();
      generateBtn.classList.add('clicked');
      setTimeout(() => generateBtn.classList.remove('clicked'), 200);
      generatePreviews();
      return false; // Prevent event bubbling
    });
  } else {
    console.error('Generate button not found!');
  }
  
  // Debug: Test all event listeners
  if (tabButtons) {
    tabButtons.forEach((button, index) => {
      console.log(`Adding event listener to tab button ${index}`);
      button.addEventListener('click', () => {
        console.log(`Tab button ${index} clicked`);
        switchTab(button.dataset.platform);
      });
    });
  }
  
  // Setup direct event listeners (in case the DOM ready event version fails)
  try {
    // Backup method to ensure click handlers are attached
    console.log("Setting up direct event listeners as backup");
    if (generateBtn) {
      generateBtn.onclick = function() {
        console.log("Direct onclick handler called");
        generatePreviews();
        return false; // Prevent event bubbling
      };
    }
    
    // Direct tab button handlers
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = function() {
        switchTab(this.dataset.platform);
      };
    });
  } catch (e) {
    console.error("Error setting direct handlers:", e);
  }
});

// Attempt to click button programmatically
setTimeout(() => {
  console.log("Attempting to click button programmatically");
  if (generateBtn) {
    // Try clicking the button with a synthetic event
    try {
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      generateBtn.dispatchEvent(clickEvent);
    } catch (e) {
      console.error("Error dispatching synthetic event:", e);
    }
    
    // Secondary click handler as a backup
    try {
      console.log("Secondary button click handler triggered");
      generateBtn.onclick && generateBtn.onclick();
    } catch (e) {
      console.error("Error in secondary click handler:", e);
    }
  }
}, 1000);

// Main function to generate previews
async function generatePreviews() {
  console.log('generatePreviews function called');
  
  try {
    // Get the URL from the input
    const url = urlInput.value.trim();
    console.log('Input URL:', url);
    
    // Validate URL
    if (!isValidUrl(url)) {
      console.warn('URL validation failed');
      showError('Please enter a valid URL');
      return;
    }
    
    console.log('Starting preview generation process...');
    
    // Show loading indicator
    loading.style.display = 'flex';
    console.log('Loading indicator displayed');
    
    previewContainer.style.display = 'none';
    errorContainer.style.display = 'none';
    
    // Reset stored data
    generatedData = {
      url,
      title: '',
      description: '',
      screenshots: {},
      downloadUrls: {},
      seoContent: null
    };
    
    console.log('Calling fetchMetadata API...');
    
    // For basic demo without API, generate mock data
    try {
      let metadata;
      
      try {
        // First try actual API call
        metadata = await fetchMetadata(url);
        console.log('Metadata API call successful:', metadata);
      } catch (apiError) {
        console.error("Metadata fetch failed, using fallback:", apiError);
        
        // Use fallback data when API is unavailable
        metadata = {
          title: "Example Website Title",
          description: "This is an example description for demonstration purposes when APIs aren't available.",
          image: ""
        };
      }
      
      console.log('Metadata received:', metadata);
      
      generatedData.title = metadata.title || "Example Title";
      generatedData.description = metadata.description || "Example Description";
      
      // Try SEO generation, but have a fallback
      try {
        console.log('Calling generateSEO API...');
        
        // Try actual API call first
        const seoContent = await generateSEO(url, metadata.title, metadata.description);
        console.log('SEO content received:', seoContent);
        generatedData.seoContent = seoContent;
      } catch (seoError) {
        console.error("Error in SEO generation, using fallback:", seoError);
        
        // Create mock SEO content as fallback
        generatedData.seoContent = {
          twitter: {
            title: "Twitter: " + (metadata.title || "Example Title"),
            description: "Twitter description example for demonstration",
            hashtags: "#example #demo #socialmedia"
          },
          linkedin: {
            title: "LinkedIn: " + (metadata.title || "Example Title"),
            description: "LinkedIn description example for demonstration",
            hashtags: "#example #demo #professional"
          },
          facebook: {
            title: "Facebook: " + (metadata.title || "Example Title"),
            description: "Facebook description example for demonstration",
            hashtags: "#example #demo #social"
          }
        };
      }
      
      // Generate screenshots for each platform (or use placeholders)
      console.log('Generating screenshots for all platforms');
      
      const platforms = ['twitter', 'linkedin', 'facebook'];
      
      // Try to use real screenshots or fall back to placeholders
      for (const platform of platforms) {
        try {
          const platformPreview = document.getElementById(`${platform}-preview`);
          if (!platformPreview) {
            console.error(`Platform preview element not found for ${platform}`);
            continue;
          }
          
          const imageContainer = platformPreview.querySelector('.preview-image');
          if (!imageContainer) {
            console.error(`Image container not found for ${platform}`);
            continue;
          }
          
          // Show loading
          imageContainer.innerHTML = '<div class="platform-loading">Generating preview...</div>';
          
          // Try to get a real screenshot first
          try {
            // First try to generate actual screenshot
            const screenshotSuccess = await generateScreenshot(platform);
            if (screenshotSuccess) {
              console.log(`Generated real screenshot for ${platform}`);
              continue; // Continue to next platform if successful
            }
          } catch (screenshotError) {
            console.error(`Error generating screenshot for ${platform}:`, screenshotError);
          }
          
          // Fallback to placeholder if screenshot generation failed
          console.log(`Using placeholder for ${platform}`);
          const placeholderImg = new Image();
          placeholderImg.src = `/img/${platform}-placeholder.jpg`;
          placeholderImg.alt = `${platform} preview`;
          placeholderImg.onerror = () => {
            // If placeholder fails, create a colored div
            const colorDiv = document.createElement('div');
            colorDiv.style.width = '100%';
            colorDiv.style.height = '300px';
            colorDiv.style.backgroundColor = platform === 'twitter' ? '#1DA1F2' : 
                                           platform === 'linkedin' ? '#0077B5' : '#4267B2';
            colorDiv.style.display = 'flex';
            colorDiv.style.alignItems = 'center';
            colorDiv.style.justifyContent = 'center';
            colorDiv.style.color = 'white';
            colorDiv.style.fontWeight = 'bold';
            colorDiv.textContent = `${platform.toUpperCase()} Preview`;
            
            imageContainer.innerHTML = '';
            imageContainer.appendChild(colorDiv);
          };
          
          placeholderImg.onload = () => {
            imageContainer.innerHTML = '';
            imageContainer.appendChild(placeholderImg);
          };
          
          // Store a mock URL
          generatedData.screenshots[platform] = placeholderImg.src;
        } catch (platformError) {
          console.error(`Error setting up ${platform} preview:`, platformError);
        }
      }
      
      // Update the UI with generated content
      console.log('Updating UI with generated content');
      updateUI();
      
      // Hide loading indicator and show preview
      loading.style.display = 'none';
      previewContainer.style.display = 'block';
      
      // Switch to Twitter tab by default
      switchTab('twitter');
      
      console.log('Preview generation completed successfully');
    } catch (innerError) {
      console.error('Inner error during preview generation:', innerError);
      showError(`Failed to generate previews: ${innerError.message}`);
      loading.style.display = 'none';
    }
  } catch (error) {
    console.error('Error generating previews:', error);
    showError(`Failed to generate previews: ${error.message}`);
    loading.style.display = 'none';
  }
}

// Fetch metadata from the URL
async function fetchMetadata(url) {
  console.log(`Fetching metadata for ${url}...`);
  try {
    const response = await fetch(`/fetchMetadata?url=${encodeURIComponent(url)}`);
    console.log('Metadata API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Metadata API error response:', errorText);
      throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Metadata API response data:', data);
    
    // The fetchMetadata endpoint doesn't return a success field,
    // it just returns the metadata object directly
    if (data.error) {
      throw new Error(data.error || 'Failed to fetch metadata');
    }
    
    // Return the metadata directly since it's already in the right format
    return data;
  } catch (error) {
    console.error('Error in fetchMetadata:', error);
    throw error;
  }
}

// Generate SEO content using Groq's API
async function generateSEO(url, title, description) {
  const response = await fetch('/generateSEO', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url, title, description })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate SEO content');
  }
  
  return await response.json();
}

// Generate screenshot for a specific platform
async function generateScreenshot(platform) {
  console.log(`Starting screenshot generation for ${platform}`);
  
  // Get the platform preview elements
  const platformPreview = document.getElementById(`${platform}-preview`);
  if (!platformPreview) {
    console.error(`Platform preview element not found for ${platform}`);
    return false;
  }
  
  const imageContainer = platformPreview.querySelector('.preview-image');
  if (!imageContainer) {
    console.error(`Image container not found for ${platform}`);
    return false;
  }
  
  try {
    // Configure screenshot parameters based on platform
    let width, height;
    switch (platform) {
      case 'twitter':
        width = 1200;
        height = 628;
        break;
      case 'linkedin':
        width = 1200;
        height = 627;
        break;
      case 'facebook':
        width = 1200;
        height = 630;
        break;
      default:
        width = 1200;
        height = 630;
    }
    
    // Show loading indicator for this platform
    imageContainer.innerHTML = '<div class="platform-loading"><div class="spinner"></div><p>Generating screenshot...</p></div>';
    
    console.log(`Making API call to renderSite for ${platform} with dimensions ${width}x${height}`);
    
    // Get the URL from the input
    const url = urlInput.value.trim();
    
    // Make the API call to capture the screenshot
    const apiUrl = `/renderSite?url=${encodeURIComponent(url)}&platform=${platform}&width=${width}&height=${height}`;
    console.log(`API request URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    console.log(`API response status for ${platform}:`, response.status, response.statusText);
    
    if (!response.ok) {
      let errorText = await response.text();
      try {
        // Try to parse as JSON to get more info
        const errorData = JSON.parse(errorText);
        console.error(`API error for ${platform}:`, errorData);
        throw new Error(errorData.error || `API returned ${response.status}`);
      } catch (e) {
        // If not JSON, use text directly
        console.error(`API error text for ${platform}:`, errorText);
        throw new Error(`Failed to generate screenshot: ${response.status} ${response.statusText}`);
      }
    }
    
    // Parse the API response
    const data = await response.json();
    console.log(`API response data for ${platform}:`, data);
    
    if (!data.success || !data.result || !data.result.screenshotUrl) {
      throw new Error(`Missing screenshot data for ${platform}`);
    }
    
    // Load the image
    const img = new Image();
    const imageLoaded = new Promise((resolve, reject) => {
      const loadingTimeout = setTimeout(() => {
        img.onerror = null;
        img.onload = null;
        reject(new Error('Image load timeout'));
      }, 10000); // 10 second timeout
      
      img.onload = () => {
        clearTimeout(loadingTimeout);
        console.log(`Screenshot loaded successfully for ${platform}`);
        resolve();
      };
      
      img.onerror = () => {
        clearTimeout(loadingTimeout);
        console.error(`Failed to load image for ${platform} from URL:`, data.result.screenshotUrl.substring(0, 50) + '...');
        reject(new Error('Failed to load image'));
      };
      
      img.src = data.result.screenshotUrl;
    });
    
    // Wait for the image to load
    await imageLoaded;
    
    // Clear the loading indicator and add the image
    imageContainer.innerHTML = '';
    imageContainer.appendChild(img);
    
    // Enable download button
    const downloadBtn = platformPreview.querySelector('.download-btn');
    if (downloadBtn) {
      downloadBtn.disabled = false;
    }
    
    // Store the screenshot URL
    generatedData.screenshots[platform] = data.result.screenshotUrl;
    
    // Store the download URL if available
    if (data.result && data.result.downloadUrl) {
      generatedData.downloadUrls[platform] = data.result.downloadUrl;
    }
    
    return true;
  } catch (error) {
    console.error(`Error generating ${platform} screenshot:`, error);
    
    // Show error in the platform preview
    if (imageContainer) {
      imageContainer.innerHTML = `<div class="preview-error">Failed to generate preview: ${error.message}</div>`;
    }
    
    // Use a placeholder image if available
    try {
      const placeholderImg = new Image();
      placeholderImg.src = `/img/${platform}-placeholder.jpg`;
      placeholderImg.onload = () => {
        imageContainer.innerHTML = '';
        imageContainer.appendChild(placeholderImg);
      };
    } catch (e) {
      console.warn('Could not load placeholder image:', e);
    }
    
    return false;
  }
}

// Update the UI with generated content
function updateUI() {
  try {
    console.log('updateUI called with data:', generatedData);
    const { url, title, description, screenshots, seoContent } = generatedData;
    
    // Extract hostname for display
    const hostname = new URL(url).hostname;
    
    // Update hashtags safely if the container exists
    const hashtagsContainer = document.getElementById('hashtags-container');
    if (hashtagsContainer && seoContent && seoContent.hashtags) {
      hashtagsContainer.innerHTML = ''; // Clear previous hashtags
      seoContent.hashtags.forEach(tag => {
        const hashtagElem = document.createElement('span');
        hashtagElem.className = 'hashtag';
        hashtagElem.textContent = tag;
        hashtagsContainer.appendChild(hashtagElem);
      });
    }
    
    // Create platform data references safely
    const platformData = {
      twitter: {
        title: document.getElementById('twitter-title'),
        description: document.getElementById('twitter-description'),
        url: document.getElementById('twitter-url'),
        image: document.getElementById('twitter-image'),
        seoTitle: document.getElementById('twitter-seo-title'),
        seoDescription: document.getElementById('twitter-seo-description'),
        seoHashtags: document.getElementById('twitter-seo-hashtags')
      },
      linkedin: {
        title: document.getElementById('linkedin-title'),
        description: document.getElementById('linkedin-description'),
        url: document.getElementById('linkedin-url'),
        image: document.getElementById('linkedin-image'),
        seoTitle: document.getElementById('linkedin-seo-title'),
        seoDescription: document.getElementById('linkedin-seo-description'),
        seoHashtags: document.getElementById('linkedin-seo-hashtags')
      },
      facebook: {
        title: document.getElementById('facebook-title'),
        description: document.getElementById('facebook-description'),
        url: document.getElementById('facebook-url'),
        image: document.getElementById('facebook-image'),
        seoTitle: document.getElementById('facebook-seo-title'),
        seoDescription: document.getElementById('facebook-seo-description'),
        seoHashtags: document.getElementById('facebook-seo-hashtags')
      }
    };
    
    // Safely update each platform's preview
    for (const platform in platformData) {
      const elements = platformData[platform];
      
      // Only proceed if we have valid elements
      if (!elements) {
        console.error(`Platform data for ${platform} is missing`);
        continue;
      }
      
      // Set the screenshot image (safely)
      if (elements.image) {
        if (screenshots && screenshots[platform]) {
          elements.image.src = screenshots[platform];
          // Add error handling for images
          elements.image.onerror = function() {
            console.error(`Failed to load image for ${platform}`);
            this.src = `https://via.placeholder.com/1200x630?text=Preview+Unavailable`;
          };
        } else {
          elements.image.src = 'https://via.placeholder.com/1200x630?text=No+Preview+Available';
        }
      } else {
        console.warn(`Image element for ${platform} not found`);
      }
      
      // Set title, description, and URL (safely)
      if (elements.title) {
        elements.title.textContent = seoContent && seoContent[platform] && seoContent[platform].title 
          ? seoContent[platform].title 
          : (title || 'No title available');
      }
      
      if (elements.description) {
        elements.description.textContent = seoContent && seoContent[platform] && seoContent[platform].description 
          ? seoContent[platform].description 
          : (description || 'No description available');
      }
      
      if (elements.url) {
        elements.url.textContent = hostname || 'example.com';
      }
      
      // Update SEO content if elements exist
      if (elements.seoTitle && seoContent && seoContent[platform]) {
        elements.seoTitle.textContent = seoContent[platform].title || 'No SEO title available';
      }
      
      if (elements.seoDescription && seoContent && seoContent[platform]) {
        elements.seoDescription.textContent = seoContent[platform].description || 'No SEO description available';
      }
      
      if (elements.seoHashtags && seoContent && seoContent[platform]) {
        elements.seoHashtags.textContent = seoContent[platform].hashtags || 'No hashtags available';
      }
    }
    
    console.log('UI update completed successfully');
  } catch (error) {
    console.error('Error updating UI:', error);
    showError(`Failed to update UI: ${error.message}`);
  }
}

// Switch between platform tabs
function switchTab(platform) {
  console.log(`Switching to ${platform} tab`);

  try {
    // Update active tab button
    tabButtons.forEach(button => {
      if (button.dataset.platform === platform) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
    
    // Update active platform preview
    platformPreviews.forEach(preview => {
      if (preview.id === `${platform}-preview`) {
        preview.classList.add('active');
      } else {
        preview.classList.remove('active');
      }
    });
    
    console.log(`Tab switched to ${platform}`);
  } catch (error) {
    console.error('Error switching tabs:', error);
  }
}

// Copy the generated text to clipboard
function copyText(platform) {
  if (!generatedData.seoContent || !generatedData.seoContent[platform]) {
    alert('No content available to copy');
    return;
  }
  
  const { title, description } = generatedData.seoContent[platform];
  let hashtags = '';
  
  if (platform === 'twitter' && generatedData.seoContent.hashtags) {
    hashtags = generatedData.seoContent.hashtags.join(' ');
  }
  
  const textToCopy = `${title}\n\n${description}\n\n${generatedData.url}\n\n${hashtags}`;
  
  navigator.clipboard.writeText(textToCopy)
    .then(() => {
      // Show temporary success message
      const copyBtn = platformData[platform].copyBtn;
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2000);
    })
    .catch(err => {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy to clipboard');
    });
}

// Download the preview image
function downloadImage(platform) {
  // First check if we have a dedicated download URL (from cloud storage)
  const downloadUrl = generatedData.downloadUrls[platform];
  if (downloadUrl) {
    console.log(`Downloading image from URL: ${downloadUrl}`);
    // Create an invisible anchor element
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${platform}-preview-${new Date().getTime()}.jpg`;
    a.style.display = 'none';
    
    // Add it to the DOM, click it, then remove it
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }
  
  // Fall back to base64 if no download URL is available
  const screenshotUrl = generatedData.screenshots[platform];
  
  if (!screenshotUrl) {
    alert('No image available to download');
    return;
  }
  
  console.log(`Downloading image from base64 data`);
  // Create an invisible anchor element
  const a = document.createElement('a');
  a.href = screenshotUrl;
  a.download = `${platform}-preview-${new Date().getTime()}.jpg`;
  a.style.display = 'none';
  
  // Add it to the DOM, click it, then remove it
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Show error message
function showError(message) {
  console.log('Showing error message:', message);
  // Safely check if errorText exists before using it
  if (errorText) {
    errorText.textContent = message;
  } else {
    console.error('Error text element not found!');
    // Fallback approach
    if (errorContainer) {
      errorContainer.innerHTML = `<p>${message}</p>`;
    }
  }
  
  // Safely show the error container
  if (errorContainer) {
    errorContainer.style.display = 'block';
  } else {
    // Create an error element if it doesn't exist
    const tempError = document.createElement('div');
    tempError.style.padding = '15px';
    tempError.style.color = 'red';
    tempError.style.backgroundColor = '#ffeeee';
    tempError.style.border = '1px solid red';
    tempError.style.borderRadius = '5px';
    tempError.style.margin = '20px 0';
    tempError.textContent = message;
    
    // Insert it at the beginning of the container
    const container = document.querySelector('.container');
    if (container) {
      container.insertBefore(tempError, container.firstChild);
    } else {
      // Last resort - add to body
      document.body.appendChild(tempError);
    }
  }
}

// Validate URL format
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
