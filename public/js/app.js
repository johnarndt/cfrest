// Main application JavaScript

// Flash message helper
function showFlashMessage(message, category = 'success') {
    const flashContainer = document.getElementById('flash-messages');
    const alert = document.createElement('div');
    alert.className = `alert alert-${category === 'error' ? 'danger' : category} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    flashContainer.appendChild(alert);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Take a screenshot
async function takeScreenshot() {
    const url = document.getElementById('screenshotUrl').value;
    if (!url) {
        showFlashMessage('Please enter a URL', 'error');
        return;
    }

    try {
        // Show loading
        showFlashMessage('Taking screenshot...', 'info');
        
        // Format URL if needed
        const formattedUrl = formatUrl(url);
        
        // Call the API
        const response = await fetch('/api/screenshot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: formattedUrl,
                screenshotOptions: {
                    fullPage: true
                },
                viewport: {
                    width: 1280,
                    height: 720
                },
                gotoOptions: {
                    waitUntil: "networkidle0",
                    timeout: 30000
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        // Get the blob data
        const blob = await response.blob();
        
        // Create a local URL for the image
        const imageUrl = URL.createObjectURL(blob);
        
        // Save to results
        saveResult({
            url: formattedUrl,
            type: 'screenshot',
            dataUrl: imageUrl,
            timestamp: new Date().toISOString()
        });
        
        // Show success message
        showFlashMessage(`Screenshot of ${formattedUrl} taken successfully!`, 'success');
        
        // Update the UI
        loadSavedResults();
    } catch (error) {
        showFlashMessage(`Error taking screenshot: ${error.message}`, 'error');
        console.error(error);
    }
}

// Generate a PDF
async function generatePDF() {
    const url = document.getElementById('pdfUrl').value;
    if (!url) {
        showFlashMessage('Please enter a URL', 'error');
        return;
    }

    try {
        // Show loading
        showFlashMessage('Generating PDF...', 'info');
        
        // Format URL if needed
        const formattedUrl = formatUrl(url);
        
        // Call the API
        const response = await fetch('/api/pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: formattedUrl,
                rejectResourceTypes: ["image"],
                rejectRequestPattern: ["/^.*\\.(css)"]
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        // Get the blob data
        const blob = await response.blob();
        
        // Create a local URL for the PDF
        const pdfUrl = URL.createObjectURL(blob);
        
        // Save to results
        saveResult({
            url: formattedUrl,
            type: 'pdf',
            dataUrl: pdfUrl,
            timestamp: new Date().toISOString()
        });
        
        // Show success message
        showFlashMessage(`PDF of ${formattedUrl} generated successfully!`, 'success');
        
        // Update the UI
        loadSavedResults();
    } catch (error) {
        showFlashMessage(`Error generating PDF: ${error.message}`, 'error');
        console.error(error);
    }
}

// Helper function to format URLs
function formatUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return 'https://' + url;
    }
    return url;
}

// Test environment variables
async function testEnvironment() {
    try {
        const testDiv = document.getElementById('test-results');
        const testPre = testDiv.querySelector('pre');
        
        testDiv.classList.remove('d-none');
        testPre.textContent = 'Testing environment...';
        
        const response = await fetch('/test-env');
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        testPre.textContent = JSON.stringify(data, null, 2);
        
        if (!data.hasApiToken || !data.hasAccountId) {
            testPre.classList.add('text-danger');
        } else {
            testPre.classList.add('text-success');
        }
    } catch (error) {
        const testDiv = document.getElementById('test-results');
        const testPre = testDiv.querySelector('pre');
        
        testDiv.classList.remove('d-none');
        testPre.textContent = `Error checking environment: ${error.message}`;
        testPre.classList.add('text-danger');
    }
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Save result to localStorage
function saveResult(result) {
    let results = JSON.parse(localStorage.getItem('capturedResults') || '[]');
    results.push(result);
    localStorage.setItem('capturedResults', JSON.stringify(results));
    return results.length - 1;
}

// Analyze website using Groq AI
async function analyzeWebsite(url, resultId) {
    if (!url) {
        showFlashMessage('No URL to analyze', 'error');
        return;
    }

    try {
        // Show loading
        showFlashMessage('Analyzing website with Groq AI...', 'info');
        
        // Format URL if needed
        const formattedUrl = formatUrl(url);
        
        // Get screenshot data if analyzing from a result
        let screenshotData = null;
        if (resultId !== undefined) {
            const results = JSON.parse(localStorage.getItem('capturedResults') || '[]');
            const result = results[resultId];
            if (result && result.type === 'screenshot' && result.dataUrl) {
                // Need to convert from objectURL to base64 for API
                try {
                    // Fetch the image data from the objectURL
                    const response = await fetch(result.dataUrl);
                    const blob = await response.blob();
                    
                    // Convert to base64
                    screenshotData = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                    
                    console.log('Including screenshot in analysis');
                } catch (error) {
                    console.error('Error converting screenshot to base64:', error);
                }
            }
        }
        
        // Call the API
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: formattedUrl,
                screenshot: screenshotData
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        // Get the JSON response
        const analysisData = await response.json();
        
        // Extract the analysis text
        const analysisText = analysisData.choices[0].message.content;
        
        // Update the results with analysis
        if (resultId !== undefined) {
            updateResultWithAnalysis(resultId, analysisText);
        } else {
            // Create a standalone analysis entry
            saveResult({
                url: formattedUrl,
                type: 'analysis',
                analysis: analysisText,
                timestamp: new Date().toISOString()
            });
            loadSavedResults();
        }
        
        // Show success message
        showFlashMessage(`Analysis of ${formattedUrl} completed!`, 'success');
        
    } catch (error) {
        showFlashMessage(`Error analyzing website: ${error.message}`, 'error');
        console.error(error);
    }
}

// Update result with analysis
function updateResultWithAnalysis(resultId, analysisText) {
    let results = JSON.parse(localStorage.getItem('capturedResults') || '[]');
    if (results[resultId]) {
        results[resultId].analysis = analysisText;
        localStorage.setItem('capturedResults', JSON.stringify(results));
        loadSavedResults(); // Refresh the UI
    }
}

// Load results from localStorage
function loadSavedResults() {
    const resultsContainer = document.getElementById('results-container');
    const results = JSON.parse(localStorage.getItem('capturedResults') || '[]');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-camera fa-4x text-muted mb-3"></i>
                <h5 class="text-muted">No screenshots or PDFs captured yet.</h5>
                <p class="text-muted">Enter a URL above to create your first capture!</p>
            </div>
        `;
        return;
    }
    
    let resultsHTML = '';
    results.forEach((result, index) => {
        let contentHTML = '';
        
        if (result.type === 'screenshot') {
            contentHTML = `
                <div class="text-center mb-3">
                    <img src="${result.dataUrl}" class="img-fluid rounded border" alt="Screenshot of ${result.url}">
                </div>
            `;
        } else if (result.type === 'pdf') {
            contentHTML = `
                <div class="text-center mb-3">
                    <i class="fas fa-file-pdf fa-4x text-danger mb-2"></i>
                    <p>PDF Generated</p>
                    <a href="${result.dataUrl}" class="btn btn-sm btn-primary" download="page.pdf">Download PDF</a>
                </div>
            `;
        } else if (result.type === 'analysis') {
            contentHTML = `
                <div class="text-center mb-3">
                    <i class="fas fa-chart-line fa-4x text-success mb-2"></i>
                    <p>Analysis Result</p>
                </div>
            `;
        }
        
        // Add analysis section if it exists
        let analysisHTML = '';
        if (result.analysis) {
            // Convert markdown-like sections to styled HTML
            let styledAnalysis = result.analysis
                .replace(/\n## (.*?)📸(.*?)\n/g, '<h5 class="mt-3"><i class="fas fa-camera"></i>$1$2</h5>')
                .replace(/\n## (.*?)🌟(.*?)\n/g, '<h5 class="mt-3"><i class="fas fa-star"></i>$1$2</h5>')
                .replace(/\n## (.*?)🔍(.*?)\n/g, '<h5 class="mt-3"><i class="fas fa-search"></i>$1$2</h5>')
                .replace(/\n## (.*?)⚡(.*?)\n/g, '<h5 class="mt-3"><i class="fas fa-bolt"></i>$1$2</h5>')
                .replace(/\n## (.*?)🌩️(.*?)\n/g, '<h5 class="mt-3"><i class="fas fa-cloud"></i>$1$2</h5>')
                .replace(/\n## (.*?)📝(.*?)\n/g, '<h5 class="mt-3"><i class="fas fa-clipboard"></i>$1$2</h5>')
                .replace(/\n## (.*?)(.*?)\n/g, '<h5 class="mt-3">$1$2</h5>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
                
            analysisHTML = `
                <div class="mt-3 border-top pt-3">
                    <h6 class="mb-3"><i class="fas fa-chart-line text-success"></i> Website Analysis:</h6>
                    <div class="analysis-content">${styledAnalysis}</div>
                </div>
            `;
        }
        
        // Create result card
        resultsHTML += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 shadow-sm">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span class="text-truncate" title="${result.url}">${result.url}</span>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteResult(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="card-body overflow-auto" style="max-height: 500px;">
                        ${contentHTML}
                        ${analysisHTML}
                    </div>
                    <div class="card-footer bg-white d-flex justify-content-between align-items-center">
                        <small class="text-muted">${new Date(result.timestamp).toLocaleString()}</small>
                        ${!result.analysis && result.type === 'screenshot' ? `
                            <button class="btn btn-sm btn-success analyze-btn" data-result-id="${index}">
                                <i class="fas fa-chart-line"></i> Analyze
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    resultsContainer.innerHTML = `<div class="row">${resultsHTML}</div>`;
    
    // Add event listeners for analyze buttons after inserting the HTML
    document.querySelectorAll('.analyze-btn').forEach(button => {
        button.addEventListener('click', function() {
            const resultId = parseInt(this.getAttribute('data-result-id'));
            const results = JSON.parse(localStorage.getItem('capturedResults') || '[]');
            if (results[resultId]) {
                analyzeWebsite(results[resultId].url, resultId);
            }
        });
    });
}

// Delete a result
function deleteResult(index) {
    if (confirm('Are you sure you want to delete this item?')) {
        let results = JSON.parse(localStorage.getItem('capturedResults') || '[]');
        results.splice(index, 1);
        localStorage.setItem('capturedResults', JSON.stringify(results));
        loadSavedResults(); // Refresh the UI
        showFlashMessage('Item deleted successfully', 'success');
    }
}

// Document Ready
document.addEventListener('DOMContentLoaded', function() {
    // Load saved results
    loadSavedResults();
    
    // Add screenshot form submission
    document.getElementById('screenshot-form').addEventListener('submit', function(e) {
        e.preventDefault();
        takeScreenshot();
    });
    
    // Add PDF form submission
    document.getElementById('pdf-form').addEventListener('submit', function(e) {
        e.preventDefault();
        generatePDF();
    });
    
    // Add test environment button functionality
    document.getElementById('test-env-btn').addEventListener('click', function() {
        testEnvironment();
    });
    
    // Add analyze with screenshot button functionality
    document.getElementById('screenshot-analyze-btn').addEventListener('click', async function() {
        const url = document.getElementById('screenshotUrl').value;
        if (!url) {
            showFlashMessage('Please enter a URL first', 'error');
            return;
        }
        
        // Show loading
        showFlashMessage('Taking screenshot and analyzing...', 'info');
        
        try {
            // Take a screenshot first
            const formattedUrl = formatUrl(url);
            
            // Call the screenshot API
            const response = await fetch('/api/screenshot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: formattedUrl,
                    screenshotOptions: {
                        fullPage: true
                    },
                    viewport: {
                        width: 1280,
                        height: 720
                    },
                    gotoOptions: {
                        waitUntil: "networkidle0",
                        timeout: 30000
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error taking screenshot: ${response.status} ${response.statusText}`);
            }
            
            // Get the blob data
            const blob = await response.blob();
            
            // Create a local URL for the image and convert to base64
            const imageUrl = URL.createObjectURL(blob);
            
            // Convert to a Base64 string for API
            const blobToBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
            
            // Now analyze with the screenshot
            const analyzeResponse = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: formattedUrl,
                    screenshot: blobToBase64
                })
            });
            
            if (!analyzeResponse.ok) {
                throw new Error(`Error analyzing: ${analyzeResponse.status} ${analyzeResponse.statusText}`);
            }
            
            // Get the analysis results
            const analysisData = await analyzeResponse.json();
            const analysisText = analysisData.choices[0].message.content;
            
            // Save both the screenshot and analysis
            const resultIndex = saveResult({
                url: formattedUrl,
                type: 'screenshot',
                dataUrl: imageUrl,
                analysis: analysisText,
                timestamp: new Date().toISOString()
            });
            
            // Update UI
            loadSavedResults();
            
            // Show success message
            showFlashMessage(`Screenshot and analysis of ${formattedUrl} completed!`, 'success');
        } catch (error) {
            showFlashMessage(`Error: ${error.message}`, 'error');
            console.error(error);
        }
    });
});
