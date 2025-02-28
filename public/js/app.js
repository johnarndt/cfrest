// Flash message handler
function showFlashMessage(message, type = 'info') {
    const flashContainer = document.getElementById('flash-messages');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    flashContainer.appendChild(alert);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
    }, 5000);
}

// Format URL (ensure it has http:// or https://)
function formatUrl(url) {
    if (!url) return '';
    return url.match(/^https?:\/\//) ? url : `https://${url}`;
}

// Store current result
let currentResult = null;

// Analyze website using Groq AI
async function analyzeWebsite(url, screenshotDataUrl = null) {
    if (!url) {
        showFlashMessage('No URL to analyze', 'error');
        return;
    }
    
    try {
        // Show loading state
        document.getElementById('result-analyze-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        document.getElementById('result-analyze-btn').disabled = true;
        
        // Prepare request data
        const requestData = { url };
        if (screenshotDataUrl) {
            requestData.screenshot = screenshotDataUrl;
        }
        
        // Make API request to analyze endpoint
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Display analysis results
        const analysisSection = document.getElementById('analysis-section');
        const analysisContent = document.getElementById('analysis-content');
        
        analysisContent.innerHTML = data.analysis;
        analysisSection.style.display = 'block';
        
        // Update the current result to include analysis
        if (currentResult) {
            currentResult.analysis = data.analysis;
            saveCurrentResult();
        }
        
        // Scroll to analysis section
        analysisSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        showFlashMessage(`Error: ${error.message}`, 'error');
        console.error(error);
    } finally {
        // Reset button state
        document.getElementById('result-analyze-btn').innerHTML = '<i class="fas fa-chart-line"></i> Analyze SEO';
        document.getElementById('result-analyze-btn').disabled = false;
    }
}

// Save current result to localStorage
function saveCurrentResult() {
    if (!currentResult) return;
    
    // Get existing results or initialize empty array
    const existingResults = JSON.parse(localStorage.getItem('capturedResults') || '[]');
    
    // Check if we already have this result
    const existingIndex = existingResults.findIndex(r => 
        r.url === currentResult.url && 
        r.type === currentResult.type &&
        r.timestamp === currentResult.timestamp);
    
    if (existingIndex !== -1) {
        // Update existing
        existingResults[existingIndex] = currentResult;
    } else {
        // Add new result
        existingResults.unshift(currentResult);
    }
    
    // Save back to localStorage (limit to 20 results)
    localStorage.setItem('capturedResults', JSON.stringify(existingResults.slice(0, 20)));
}

// Clear current result
function clearResult() {
    currentResult = null;
    document.getElementById('result-container').style.display = 'none';
    document.getElementById('analysis-section').style.display = 'none';
}

// Display result
function displayResult(result) {
    if (!result) return;
    
    currentResult = result;
    
    const resultContainer = document.getElementById('result-container');
    const resultUrl = document.getElementById('result-url');
    const resultType = document.getElementById('result-type');
    const resultContent = document.getElementById('result-content');
    const resultViewBtn = document.getElementById('result-view-btn');
    const resultDownloadBtn = document.getElementById('result-download-btn');
    const resultAnalyzeBtn = document.getElementById('result-analyze-btn');
    
    // Set result details
    resultUrl.textContent = result.url;
    resultType.textContent = result.type.toUpperCase();
    
    // Clear previous content
    resultContent.innerHTML = '';
    
    // Create content based on type
    if (result.type === 'screenshot') {
        const img = document.createElement('img');
        img.src = result.dataUrl;
        img.alt = 'Screenshot of ' + result.url;
        img.className = 'result-image';
        resultContent.appendChild(img);
        
        resultViewBtn.href = result.dataUrl;
        resultViewBtn.style.display = 'inline-block';
        resultDownloadBtn.href = result.dataUrl;
        resultDownloadBtn.style.display = 'inline-block';
        resultAnalyzeBtn.style.display = 'inline-block';
    } else if (result.type === 'pdf') {
        const pdfIcon = document.createElement('div');
        pdfIcon.innerHTML = '<i class="fas fa-file-pdf fa-5x text-danger mb-3"></i>';
        resultContent.appendChild(pdfIcon);
        
        resultViewBtn.href = result.dataUrl;
        resultViewBtn.style.display = 'inline-block';
        resultDownloadBtn.href = result.dataUrl;
        resultDownloadBtn.style.display = 'inline-block';
        resultAnalyzeBtn.style.display = 'none'; // Hide analyze button for PDFs
    }
    
    // Show result container
    resultContainer.style.display = 'block';
    
    // Show analysis if available
    if (result.analysis) {
        const analysisSection = document.getElementById('analysis-section');
        const analysisContent = document.getElementById('analysis-content');
        
        analysisContent.innerHTML = result.analysis;
        analysisSection.style.display = 'block';
    } else {
        // Hide analysis section if no analysis
        document.getElementById('analysis-section').style.display = 'none';
    }
    
    // Save result to localStorage
    saveCurrentResult();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Test environment button
    document.getElementById('test-env-btn').addEventListener('click', async function() {
        try {
            const testResults = document.getElementById('test-results');
            const resultsPre = testResults.querySelector('pre');
            
            // Show loading state
            resultsPre.textContent = 'Testing...';
            testResults.classList.remove('d-none');
            
            const response = await fetch('/api/test');
            const data = await response.json();
            
            resultsPre.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
            showFlashMessage(`Test failed: ${error.message}`, 'error');
        }
    });
    
    // Take Screenshot Button
    document.getElementById('screenshot-btn').addEventListener('click', async function() {
        const urlInput = document.getElementById('websiteUrl');
        const url = urlInput.value.trim();
        
        if (!url) {
            showFlashMessage('Please enter a valid URL', 'warning');
            urlInput.focus();
            return;
        }
        
        const formattedUrl = formatUrl(url);
        
        try {
            // Show loading state
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            this.disabled = true;
            
            // Make API request
            const response = await fetch('/api/screenshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: formattedUrl })
            });
            
            if (!response.ok) {
                throw new Error(`Screenshot failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Create result object
            const result = {
                url: formattedUrl,
                type: 'screenshot',
                dataUrl: data.imageUrl,
                timestamp: new Date().toISOString()
            };
            
            // Display the result
            displayResult(result);
            
            // Show success message
            showFlashMessage(`Screenshot of ${formattedUrl} captured!`, 'success');
            
        } catch (error) {
            showFlashMessage(`Error: ${error.message}`, 'error');
            console.error(error);
        } finally {
            // Reset button state
            this.innerHTML = '<i class="fas fa-camera"></i> Take Screenshot';
            this.disabled = false;
        }
    });
    
    // Generate PDF Button
    document.getElementById('pdf-btn').addEventListener('click', async function() {
        const urlInput = document.getElementById('websiteUrl');
        const url = urlInput.value.trim();
        
        if (!url) {
            showFlashMessage('Please enter a valid URL', 'warning');
            urlInput.focus();
            return;
        }
        
        const formattedUrl = formatUrl(url);
        
        try {
            // Show loading state
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            this.disabled = true;
            
            // Make API request
            const response = await fetch('/api/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: formattedUrl })
            });
            
            if (!response.ok) {
                throw new Error(`PDF generation failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Create result object
            const result = {
                url: formattedUrl,
                type: 'pdf',
                dataUrl: data.pdfUrl,
                timestamp: new Date().toISOString()
            };
            
            // Display the result
            displayResult(result);
            
            // Show success message
            showFlashMessage(`PDF of ${formattedUrl} generated!`, 'success');
            
        } catch (error) {
            showFlashMessage(`Error: ${error.message}`, 'error');
            console.error(error);
        } finally {
            // Reset button state
            this.innerHTML = '<i class="fas fa-file-pdf"></i> Generate PDF';
            this.disabled = false;
        }
    });
    
    // Screenshot & Analyze Button
    document.getElementById('screenshot-analyze-btn').addEventListener('click', async function() {
        const urlInput = document.getElementById('websiteUrl');
        const url = urlInput.value.trim();
        
        if (!url) {
            showFlashMessage('Please enter a valid URL', 'warning');
            urlInput.focus();
            return;
        }
        
        const formattedUrl = formatUrl(url);
        
        try {
            // Show loading state
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            this.disabled = true;
            
            // First take a screenshot
            const screenshotResponse = await fetch('/api/screenshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: formattedUrl })
            });
            
            if (!screenshotResponse.ok) {
                throw new Error(`Screenshot failed: ${screenshotResponse.status} ${screenshotResponse.statusText}`);
            }
            
            const screenshotData = await screenshotResponse.json();
            const imageUrl = screenshotData.imageUrl;
            
            // Now analyze with the screenshot
            const analyzeResponse = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: formattedUrl,
                    screenshot: imageUrl
                })
            });
            
            if (!analyzeResponse.ok) {
                throw new Error(`Error analyzing: ${analyzeResponse.status} ${analyzeResponse.statusText}`);
            }
            
            const analysisData = await analyzeResponse.json();
            const analysisText = analysisData.analysis;
            
            // Create and display result
            const result = {
                url: formattedUrl,
                type: 'screenshot',
                dataUrl: imageUrl,
                analysis: analysisText,
                timestamp: new Date().toISOString()
            };
            
            // Display the result with analysis
            displayResult(result);
            
            // Show success message
            showFlashMessage(`Screenshot and analysis of ${formattedUrl} completed!`, 'success');
            
        } catch (error) {
            showFlashMessage(`Error: ${error.message}`, 'error');
            console.error(error);
        } finally {
            // Reset button state
            this.innerHTML = '<i class="fas fa-magic"></i> Screenshot & Analyze';
            this.disabled = false;
        }
    });
    
    // Analyze Result Button
    document.getElementById('result-analyze-btn').addEventListener('click', function() {
        if (currentResult && currentResult.url) {
            analyzeWebsite(currentResult.url, currentResult.dataUrl);
        } else {
            showFlashMessage('No result to analyze', 'error');
        }
    });
    
    // Clear Result Button
    document.getElementById('clear-result').addEventListener('click', function() {
        clearResult();
    });
    
    // Load most recent result if available
    const savedResults = JSON.parse(localStorage.getItem('capturedResults') || '[]');
    if (savedResults.length > 0) {
        displayResult(savedResults[0]);
    }
});
