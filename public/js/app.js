// DOM Elements
const urlInput = document.getElementById('url-input');
const generateBtn = document.getElementById('generate-btn');
const loading = document.getElementById('loading');
const previewContainer = document.getElementById('preview-container');
const errorContainer = document.getElementById('error-container');
const platformButtons = document.querySelectorAll('.platform-btn');
const platformPreviews = document.querySelectorAll('.platform-preview');

// Store generated data
const generatedData = {
  url: '',
  title: '',
  description: '',
  screenshots: {},
  downloadUrls: {}, // New property to store download URLs
  seoContent: null
};

// Social platform preview elements
const platformData = {
  twitter: {
    image: document.getElementById('twitter-image'),
    title: document.getElementById('twitter-title'),
    description: document.getElementById('twitter-description'),
    url: document.getElementById('twitter-url'),
    copyBtn: document.getElementById('copy-twitter'),
    downloadBtn: document.getElementById('download-twitter'),
    width: 1200,
    height: 628
  },
  linkedin: {
    image: document.getElementById('linkedin-image'),
    title: document.getElementById('linkedin-title'),
    description: document.getElementById('linkedin-description'),
    url: document.getElementById('linkedin-url'),
    copyBtn: document.getElementById('copy-linkedin'),
    downloadBtn: document.getElementById('download-linkedin'),
    width: 1200,
    height: 628
  },
  facebook: {
    image: document.getElementById('facebook-image'),
    title: document.getElementById('facebook-title'),
    description: document.getElementById('facebook-description'),
    url: document.getElementById('facebook-url'),
    copyBtn: document.getElementById('copy-facebook'),
    downloadBtn: document.getElementById('download-facebook'),
    width: 1200,
    height: 630
  }
};

// Event Listeners
generateBtn.addEventListener('click', generatePreviews);
platformButtons.forEach(button => {
  button.addEventListener('click', () => switchTab(button.dataset.platform));
});

// Setup copy and download buttons for each platform
for (const platform in platformData) {
  const { copyBtn, downloadBtn } = platformData[platform];
  
  copyBtn.addEventListener('click', () => copyText(platform));
  downloadBtn.addEventListener('click', () => downloadImage(platform));
}

// Main function to generate previews
async function generatePreviews() {
  const url = urlInput.value.trim();
  
  if (!url) {
    showError('Please enter a valid URL');
    return;
  }
  
  if (!isValidUrl(url)) {
    showError('Please enter a valid URL with http:// or https:// prefix');
    return;
  }
  
  // Show loading and hide previous results
  loading.classList.remove('hidden');
  previewContainer.classList.add('hidden');
  errorContainer.classList.add('hidden');
  
  try {
    // Reset stored data
    generatedData = {
      url,
      title: '',
      description: '',
      screenshots: {},
      downloadUrls: {},
      seoContent: null
    };
    
    // Step 1: Fetch metadata from the URL
    const metadata = await fetchMetadata(url);
    generatedData.title = metadata.title;
    generatedData.description = metadata.description;
    
    // Step 2: Generate SEO content using Groq
    const seoContent = await generateSEO(url, metadata.title, metadata.description);
    generatedData.seoContent = seoContent;
    
    // Step 3: Generate screenshots for each platform - catch individual errors
    try {
      // Instead of awaiting all 3 separately, just generate one screenshot for all
      await generateScreenshot('twitter');
      // Use the same screenshot for all platforms
      generatedData.screenshots['linkedin'] = generatedData.screenshots['twitter'];
      generatedData.screenshots['facebook'] = generatedData.screenshots['twitter'];
    } catch (screenshotError) {
      console.error('Error generating screenshots:', screenshotError);
      // Continue with the rest of the function even if screenshots fail
    }
    
    // Step 4: Update the UI with all the generated content
    updateUI();
    
    // Show the preview container
    loading.classList.add('hidden');
    previewContainer.classList.remove('hidden');
    
    // Switch to Twitter tab by default
    switchTab('twitter');
  } catch (error) {
    console.error('Error generating previews:', error);
    loading.classList.add('hidden');
    showError(error.message || 'An error occurred while generating previews');
  }
}

// Fetch metadata from the URL
async function fetchMetadata(url) {
  const response = await fetch(`/fetchMetadata?url=${encodeURIComponent(url)}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch metadata');
  }
  
  return await response.json();
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
    const platformPreview = document.getElementById(`${platform}-preview`);
    const imageContainer = platformPreview.querySelector('.preview-image');
    imageContainer.innerHTML = '<div class="platform-loading">Generating preview...</div>';
    
    // Call the screenshot API
    const response = await fetch(`/renderSite?url=${encodeURIComponent(generatedData.url)}&width=${width}&height=${height}&platform=${platform}`);
    const data = await response.json();
    
    if (!data.success || data.error) {
      throw new Error(data.error || 'Failed to generate screenshot');
    }
    
    // Store the screenshot URL
    generatedData.screenshots[platform] = data.result.screenshotUrl;
    
    // Store the download URL if available
    if (data.result.downloadUrl) {
      generatedData.downloadUrls[platform] = data.result.downloadUrl;
    }
    
    // Load the image
    const img = new Image();
    let loadingTimeout;
    
    const imageLoaded = new Promise((resolve, reject) => {
      loadingTimeout = setTimeout(() => {
        reject(new Error('Image loading timed out'));
      }, 15000); // 15 second timeout
      
      img.onload = () => {
        clearTimeout(loadingTimeout);
        resolve();
      };
      
      img.onerror = () => {
        clearTimeout(loadingTimeout);
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
    downloadBtn.disabled = false;
    
    return true;
  } catch (error) {
    console.error(`Error generating ${platform} screenshot:`, error);
    
    // Show error in the platform preview
    const platformPreview = document.getElementById(`${platform}-preview`);
    const imageContainer = platformPreview.querySelector('.preview-image');
    imageContainer.innerHTML = `<div class="preview-error">Failed to generate preview: ${error.message}</div>`;
    
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
  const { url, title, description, screenshots, seoContent } = generatedData;
  
  // Extract hostname for display
  const hostname = new URL(url).hostname;
  
  // Update hashtags
  const hashtagsContainer = document.getElementById('hashtags-container');
  hashtagsContainer.innerHTML = ''; // Clear previous hashtags
  
  if (seoContent && seoContent.hashtags) {
    seoContent.hashtags.forEach(tag => {
      const hashtagElem = document.createElement('span');
      hashtagElem.className = 'hashtag';
      hashtagElem.textContent = tag;
      hashtagsContainer.appendChild(hashtagElem);
    });
  }
  
  // Update each platform's preview
  for (const platform in platformData) {
    const elements = platformData[platform];
    
    // Set the screenshot image
    if (screenshots[platform]) {
      elements.image.src = screenshots[platform];
      // Add error handling for images
      elements.image.onerror = function() {
        console.error(`Failed to load image for ${platform}`);
        this.src = `https://via.placeholder.com/1200x630?text=Preview+Unavailable`;
      };
    } else if (title && description) {
      elements.image.src = 'https://via.placeholder.com/1200x630?text=No+Preview+Available';
    } else {
      // Set a placeholder if no image available
      elements.image.src = 'https://via.placeholder.com/1200x630?text=No+Preview+Available';
    }
    
    // Set title, description, and URL
    if (seoContent && seoContent[platform]) {
      elements.title.textContent = seoContent[platform].title;
      elements.description.textContent = seoContent[platform].description;
    } else {
      elements.title.textContent = title || 'No title available';
      elements.description.textContent = description || 'No description available';
    }
    
    elements.url.textContent = hostname;
  }
}

// Switch between platform tabs
function switchTab(platform) {
  // Update active tab button
  platformButtons.forEach(button => {
    if (button.dataset.platform === platform) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  // Show the selected platform preview
  platformPreviews.forEach(preview => {
    if (preview.id === `${platform}-preview`) {
      preview.classList.add('active');
    } else {
      preview.classList.remove('active');
    }
  });
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
  errorText.textContent = message;
  errorContainer.classList.remove('hidden');
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
