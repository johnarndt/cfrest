// Main application JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the UI
    loadSavedResults();

    // Form submit handlers
    document.getElementById('screenshot-form').addEventListener('submit', function(e) {
        e.preventDefault();
        takeScreenshot();
    });

    document.getElementById('pdf-form').addEventListener('submit', function(e) {
        e.preventDefault();
        generatePDF();
    });

    document.getElementById('scrape-form').addEventListener('submit', function(e) {
        e.preventDefault();
        scrapeElements();
    });

    document.getElementById('html-form').addEventListener('submit', function(e) {
        e.preventDefault();
        getHtmlContent();
    });
});

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
                width: 1280,
                height: 720
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

// Scrape elements
async function scrapeElements() {
    const url = document.getElementById('scrapeUrl').value;
    const selector = document.getElementById('selector').value;
    
    if (!url || !selector) {
        showFlashMessage('Please enter a URL and CSS selector', 'error');
        return;
    }

    try {
        // Show loading
        showFlashMessage('Scraping elements...', 'info');
        
        // Format URL if needed
        const formattedUrl = formatUrl(url);
        
        // Call the API
        const response = await fetch('/api/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: formattedUrl,
                selector: selector
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        // Get the JSON response
        const data = await response.json();
        
        // Create a dialog to show the elements
        const elementsHtml = data.elements.map(el => `<div class="border p-2 mb-2">${el}</div>`).join('');
        
        // Create and show modal with elements
        const modalHtml = `
            <div class="modal fade" id="elementsModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title">Scraped Elements</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p>Found ${data.elements.length} elements matching selector "${selector}" on ${formattedUrl}</p>
                            <div class="elements-container overflow-auto" style="max-height: 400px;">
                                ${elementsHtml}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('elementsModal'));
        modal.show();
        
        // Remove modal on hide
        document.getElementById('elementsModal').addEventListener('hidden.bs.modal', function() {
            document.body.removeChild(modalContainer);
        });
        
        // Show success message
        showFlashMessage(`Found ${data.elements.length} elements matching "${selector}"`, 'success');
    } catch (error) {
        showFlashMessage(`Error scraping elements: ${error.message}`, 'error');
        console.error(error);
    }
}

// Get HTML content
async function getHtmlContent() {
    const url = document.getElementById('htmlUrl').value;
    
    if (!url) {
        showFlashMessage('Please enter a URL', 'error');
        return;
    }

    try {
        // Show loading
        showFlashMessage('Fetching HTML content...', 'info');
        
        // Format URL if needed
        const formattedUrl = formatUrl(url);
        
        // Call the API
        const response = await fetch('/api/html', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: formattedUrl
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        // Get the text response
        const html = await response.text();
        
        // Create a dialog to show the HTML
        const modalHtml = `
            <div class="modal fade" id="htmlModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">HTML Content</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p>HTML content from ${formattedUrl}</p>
                            <div class="html-container bg-light p-3 overflow-auto" style="max-height: 400px;">
                                <pre>${escapeHtml(html)}</pre>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('htmlModal'));
        modal.show();
        
        // Remove modal on hide
        document.getElementById('htmlModal').addEventListener('hidden.bs.modal', function() {
            document.body.removeChild(modalContainer);
        });
        
        // Show success message
        showFlashMessage(`HTML content fetched successfully!`, 'success');
    } catch (error) {
        showFlashMessage(`Error fetching HTML: ${error.message}`, 'error');
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
    const results = JSON.parse(localStorage.getItem('cfRestResults') || '[]');
    results.push(result);
    localStorage.setItem('cfRestResults', JSON.stringify(results));
}

// Load results from localStorage
function loadSavedResults() {
    const results = JSON.parse(localStorage.getItem('cfRestResults') || '[]');
    const container = document.getElementById('results-container');
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-camera fa-4x text-muted mb-3"></i>
                <p class="lead">No screenshots or PDFs captured yet.</p>
                <p>Enter a URL above to create your first capture!</p>
            </div>
        `;
        return;
    }
    
    // Sort by timestamp (newest first)
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Create grid
    container.innerHTML = '<div class="row row-cols-1 row-cols-md-3 g-4" id="results-grid"></div>';
    const grid = document.getElementById('results-grid');
    
    // Add results
    results.forEach((result, index) => {
        const isImage = result.type === 'screenshot';
        const template = document.getElementById(isImage ? 'image-template' : 'pdf-template');
        const clone = document.importNode(template.content, true);
        
        // Set content
        if (isImage) {
            clone.querySelector('.result-img').src = result.dataUrl;
        }
        clone.querySelector('.result-url').textContent = result.url;
        clone.querySelector('.result-time').textContent = new Date(result.timestamp).toLocaleString();
        clone.querySelector('.result-type').textContent = result.type;
        clone.querySelector('.result-link').href = result.dataUrl;
        
        // Add delete handler
        clone.querySelector('.result-delete').addEventListener('click', function() {
            deleteResult(index);
        });
        
        // Add to grid
        grid.appendChild(clone);
    });
}

// Delete a result
function deleteResult(index) {
    if (confirm('Are you sure you want to delete this item?')) {
        const results = JSON.parse(localStorage.getItem('cfRestResults') || '[]');
        results.splice(index, 1);
        localStorage.setItem('cfRestResults', JSON.stringify(results));
        loadSavedResults();
        showFlashMessage('Item deleted successfully', 'success');
    }
}
