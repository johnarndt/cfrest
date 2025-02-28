"""
Web Screenshot and Analysis Tool using Cloudflare Browser Rendering REST API.
"""
import os
import uuid
import time
from datetime import datetime
from urllib.parse import urlparse
from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory, jsonify
from werkzeug.utils import secure_filename
from cloudflare_api import CloudflareAPI

# Debug: Print environment variables
print("API Token:", os.environ.get('CLOUDFLARE_API_TOKEN'))
print("Account ID:", os.environ.get('CLOUDFLARE_ACCOUNT_ID'))

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key')
app.config['SCREENSHOT_FOLDER'] = os.path.join(os.path.dirname(__file__), 'screenshots')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload size

# Ensure screenshot directory exists
os.makedirs(app.config['SCREENSHOT_FOLDER'], exist_ok=True)

# Initialize Cloudflare API client
cf_api = CloudflareAPI()

@app.route('/')
def index():
    """Render the home page."""
    # Get list of screenshots
    screenshots = []
    for filename in os.listdir(app.config['SCREENSHOT_FOLDER']):
        if filename.endswith(('.png', '.jpg', '.jpeg', '.webp', '.pdf')) and not filename.startswith('.'):
            file_path = os.path.join(app.config['SCREENSHOT_FOLDER'], filename)
            file_stats = os.stat(file_path)
            screenshots.append({
                'filename': filename,
                'created': datetime.fromtimestamp(file_stats.st_ctime),
                'size': file_stats.st_size,
                'url': filename.split('__')[0] if '__' in filename else 'Unknown',
                'type': 'pdf' if filename.endswith('.pdf') else 'image'
            })
    
    # Sort by creation time (newest first)
    screenshots.sort(key=lambda x: x['created'], reverse=True)
    
    return render_template('index.html', screenshots=screenshots)

@app.route('/screenshot', methods=['POST'])
def take_screenshot():
    """Take a screenshot of a URL."""
    url = request.form.get('url')
    
    if not url:
        flash('Please enter a URL', 'error')
        return redirect(url_for('index'))
    
    # Add https:// if not present
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    try:
        # Parse domain from URL
        domain = urlparse(url).netloc
        
        # Generate unique filename
        timestamp = int(time.time())
        filename = f"{domain}__{timestamp}.webp"
        filepath = os.path.join(app.config['SCREENSHOT_FOLDER'], secure_filename(filename))
        
        # Take screenshot
        screenshot_data = cf_api.take_screenshot(
            url=url,
            options={
                "screenshotOptions": {
                    "fullPage": True,
                    "omitBackground": False
                },
                "viewport": {
                    "width": 1280,
                    "height": 720
                }
            }
        )
        
        # Save screenshot
        with open(filepath, 'wb') as f:
            f.write(screenshot_data)
        
        flash(f'Screenshot of {url} taken successfully!', 'success')
    except Exception as e:
        flash(f'Error taking screenshot: {str(e)}', 'error')
    
    return redirect(url_for('index'))

@app.route('/pdf', methods=['POST'])
def generate_pdf():
    """Generate a PDF of a URL."""
    url = request.form.get('url')
    
    if not url:
        flash('Please enter a URL', 'error')
        return redirect(url_for('index'))
    
    # Add https:// if not present
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    try:
        # Parse domain from URL
        domain = urlparse(url).netloc
        
        # Generate unique filename
        timestamp = int(time.time())
        filename = f"{domain}__{timestamp}.pdf"
        filepath = os.path.join(app.config['SCREENSHOT_FOLDER'], secure_filename(filename))
        
        # Generate PDF
        pdf_data = cf_api.render_pdf(
            url=url
        )
        
        # Save PDF
        with open(filepath, 'wb') as f:
            f.write(pdf_data)
        
        flash(f'PDF of {url} generated successfully!', 'success')
    except Exception as e:
        flash(f'Error generating PDF: {str(e)}', 'error')
    
    return redirect(url_for('index'))

@app.route('/scrape', methods=['POST'])
def scrape_elements():
    """Scrape elements from a URL."""
    url = request.form.get('url')
    selector = request.form.get('selector')
    
    if not url or not selector:
        flash('Please enter both URL and CSS selector', 'error')
        return redirect(url_for('index'))
    
    # Add https:// if not present
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    try:
        # Scrape elements
        scraped_data = cf_api.scrape_elements(url, selector)
        
        # Return JSON response
        return jsonify({
            'success': True,
            'data': scraped_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/html', methods=['POST'])
def fetch_html():
    """Fetch rendered HTML from a URL."""
    url = request.form.get('url')
    
    if not url:
        flash('Please enter a URL', 'error')
        return redirect(url_for('index'))
    
    # Add https:// if not present
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    try:
        # Fetch HTML
        html_content = cf_api.fetch_html(url)
        
        # Return HTML response
        return jsonify({
            'success': True,
            'html': html_content
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/screenshots/<filename>')
def serve_screenshot(filename):
    """Serve a screenshot file."""
    return send_from_directory(app.config['SCREENSHOT_FOLDER'], filename)

@app.route('/delete/<filename>', methods=['POST'])
def delete_screenshot(filename):
    """Delete a screenshot file."""
    try:
        filepath = os.path.join(app.config['SCREENSHOT_FOLDER'], filename)
        if os.path.exists(filepath):
            os.remove(filepath)
            flash(f'File {filename} deleted successfully!', 'success')
        else:
            flash(f'File {filename} not found', 'error')
    except Exception as e:
        flash(f'Error deleting file: {str(e)}', 'error')
    
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True, port=5001)
