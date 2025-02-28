// DOM Elements
const scrapeForm = document.getElementById('scrapeForm');
const scrapeResults = document.getElementById('scrapeResults');
const scrapeOutput = document.getElementById('scrapeOutput');

const htmlForm = document.getElementById('htmlForm');
const htmlResults = document.getElementById('htmlResults');
const htmlOutput = document.getElementById('htmlOutput');

// Create loading spinner
function createSpinner(message = 'Processing...') {
    const spinnerOverlay = document.createElement('div');
    spinnerOverlay.className = 'spinner-overlay';
    
    const spinnerContainer = document.createElement('div');
    spinnerContainer.className = 'spinner-container';
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner-border text-primary mb-3';
    spinner.setAttribute('role', 'status');
    
    const spinnerText = document.createElement('span');
    spinnerText.className = 'visually-hidden';
    spinnerText.textContent = 'Loading...';
    
    const messageText = document.createElement('div');
    messageText.textContent = message;
    
    spinner.appendChild(spinnerText);
    spinnerContainer.appendChild(spinner);
    spinnerContainer.appendChild(messageText);
    spinnerOverlay.appendChild(spinnerContainer);
    
    document.body.appendChild(spinnerOverlay);
    
    return spinnerOverlay;
}

// Remove spinner
function removeSpinner(spinner) {
    if (spinner && spinner.parentNode) {
        spinner.parentNode.removeChild(spinner);
    }
}

// Format JSON for display
function formatJSON(json) {
    return JSON.stringify(json, null, 2);
}

// Escape HTML for display
function escapeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

// Handle scrape form submission
if (scrapeForm) {
    scrapeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(scrapeForm);
        const url = formData.get('url');
        const selector = formData.get('selector');
        
        if (!url || !selector) {
            alert('Please enter both URL and CSS selector');
            return;
        }
        
        // Show loading spinner
        const spinner = createSpinner('Scraping elements...');
        
        try {
            const response = await fetch('/scrape', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            // Show results
            scrapeResults.classList.remove('d-none');
            
            if (data.success) {
                scrapeOutput.textContent = formatJSON(data.data);
            } else {
                scrapeOutput.textContent = `Error: ${data.error}`;
            }
        } catch (error) {
            scrapeResults.classList.remove('d-none');
            scrapeOutput.textContent = `Error: ${error.message}`;
        } finally {
            // Remove spinner
            removeSpinner(spinner);
        }
    });
}

// Handle HTML form submission
if (htmlForm) {
    htmlForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(htmlForm);
        const url = formData.get('url');
        
        if (!url) {
            alert('Please enter a URL');
            return;
        }
        
        // Show loading spinner
        const spinner = createSpinner('Fetching HTML content...');
        
        try {
            const response = await fetch('/html', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            // Show results
            htmlResults.classList.remove('d-none');
            
            if (data.success) {
                // Safely display HTML as text
                htmlOutput.textContent = data.html;
            } else {
                htmlOutput.textContent = `Error: ${data.error}`;
            }
        } catch (error) {
            htmlResults.classList.remove('d-none');
            htmlOutput.textContent = `Error: ${error.message}`;
        } finally {
            // Remove spinner
            removeSpinner(spinner);
        }
    });
}

// Add loading spinner for form submissions
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        // Skip the forms that are handled with JavaScript
        if (form.id === 'scrapeForm' || form.id === 'htmlForm') {
            return;
        }
        
        form.addEventListener('submit', () => {
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                
                // Store original button content
                const originalContent = submitButton.innerHTML;
                
                // Add spinner to button
                submitButton.innerHTML = `
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Loading...
                `;
                
                // Re-enable after 10 seconds (in case of error)
                setTimeout(() => {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalContent;
                }, 10000);
            }
            
            // Show global spinner for longer operations
            createSpinner('Processing your request...');
        });
    });
});
