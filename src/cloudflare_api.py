"""
Module for interacting with the Cloudflare Browser Rendering REST API.
"""
import os
import json
import time
import requests
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class CloudflareAPI:
    """Class for interacting with Cloudflare Browser Rendering REST API"""
    
    def __init__(self):
        """Initialize with API credentials from environment variables"""
        self.api_token = os.environ.get('CLOUDFLARE_API_TOKEN')
        self.account_id = os.environ.get('CLOUDFLARE_ACCOUNT_ID')
        
        if not self.api_token or not self.account_id:
            raise ValueError("CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set in .env file")
        
        self.base_url = f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/browser-rendering"
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
    
    def take_screenshot(self, url=None, html=None, options=None):
        """
        Take a screenshot using Cloudflare Browser Rendering API.
        
        Args:
            url: The URL to capture
            html: Raw HTML content to render (alternative to URL)
            options: Dictionary of additional options
            
        Returns:
            Binary data of the screenshot image
        """
        if not url and not html:
            raise ValueError("Either URL or HTML must be provided")
        
        endpoint = f"{self.base_url}/screenshot"
        
        # Set up default options
        payload = {}
        if url:
            payload["url"] = url
        if html:
            payload["html"] = html
            
        # Default screenshot options
        payload["screenshotOptions"] = {
            "fullPage": True,
            "omitBackground": False
        }
        
        # Default viewport
        payload["viewport"] = {
            "width": 1280,
            "height": 720
        }
        
        # Default navigation options
        payload["gotoOptions"] = {
            "waitUntil": "networkidle0",
            "timeout": 30000  # 30 seconds
        }
        
        # Override with custom options if provided
        if options:
            payload.update(options)
        
        # Make the API request
        print(f"DEBUG: Making API request to: {endpoint}")
        print(f"DEBUG: Using account ID: {self.account_id}")
        print(f"DEBUG: Headers: {self.headers}")
        print(f"DEBUG: Payload: {json.dumps(payload)}")
        
        response = requests.post(endpoint, headers=self.headers, data=json.dumps(payload))
        
        if response.status_code != 200:
            error_message = f"API request failed with status code: {response.status_code}"
            try:
                error_json = response.json()
                error_message = f"{error_message}, details: {json.dumps(error_json)}"
            except:
                error_message = f"{error_message}, response: {response.text}"
            print(f"DEBUG: {error_message}")
            raise Exception(error_message)
            
        return response.content
    
    def fetch_html(self, url, options=None):
        """
        Fetch rendered HTML content of a webpage.
        
        Args:
            url: The URL to fetch HTML from
            options: Dictionary of additional options
            
        Returns:
            String containing the rendered HTML
        """
        endpoint = f"{self.base_url}/content"
        
        # Set up default options
        payload = {"url": url}
        
        # Default navigation options
        payload["gotoOptions"] = {
            "waitUntil": "networkidle0",
            "timeout": 30000  # 30 seconds
        }
        
        # Override with custom options if provided
        if options:
            payload.update(options)
        
        # Make the API request
        print(f"DEBUG: Making API request to: {endpoint}")
        print(f"DEBUG: Using account ID: {self.account_id}")
        print(f"DEBUG: Headers: {self.headers}")
        print(f"DEBUG: Payload: {json.dumps(payload)}")
        
        response = requests.post(endpoint, headers=self.headers, data=json.dumps(payload))
        
        if response.status_code != 200:
            error_message = f"API request failed with status code: {response.status_code}"
            try:
                error_json = response.json()
                error_message = f"{error_message}, details: {json.dumps(error_json)}"
            except:
                error_message = f"{error_message}, response: {response.text}"
            print(f"DEBUG: {error_message}")
            raise Exception(error_message)
            
        return response.text
    
    def render_pdf(self, url=None, html=None, options=None):
        """
        Generate a PDF of a webpage.
        
        Args:
            url: The URL to capture
            html: Raw HTML content to render (alternative to URL)
            options: Dictionary of additional options
            
        Returns:
            Binary data of the PDF document
        """
        if not url and not html:
            raise ValueError("Either URL or HTML must be provided")
        
        endpoint = f"{self.base_url}/pdf"
        
        # Set up default options - simplified approach
        payload = {}
        if url:
            payload["url"] = url
        if html:
            payload["html"] = html
            
        # Default PDF options - using the simpler approach without printOptions
        # We can optionally disable images and CSS to make it lighter
        payload["rejectResourceTypes"] = ["image"]  # Uncomment to disable images
        payload["rejectRequestPattern"] = ["/^.*\\.(css)"]  # Uncomment to disable CSS
        
        # Default navigation options
        payload["gotoOptions"] = {
            "waitUntil": "networkidle0",
            "timeout": 30000  # 30 seconds
        }
        
        # Override with custom options if provided
        if options:
            payload.update(options)
        
        # Make the API request
        print(f"DEBUG: Making API request to: {endpoint}")
        print(f"DEBUG: Using account ID: {self.account_id}")
        print(f"DEBUG: Headers: {self.headers}")
        print(f"DEBUG: Payload: {json.dumps(payload)}")
        
        response = requests.post(endpoint, headers=self.headers, data=json.dumps(payload))
        
        if response.status_code != 200:
            error_message = f"API request failed with status code: {response.status_code}"
            try:
                error_json = response.json()
                error_message = f"{error_message}, details: {json.dumps(error_json)}"
            except:
                error_message = f"{error_message}, response: {response.text}"
            print(f"DEBUG: {error_message}")
            raise Exception(error_message)
            
        return response.content
    
    def scrape_elements(self, url, selector, options=None):
        """
        Scrape HTML elements matching a selector from a webpage.
        
        Args:
            url: The URL to scrape
            selector: CSS selector to extract elements
            options: Dictionary of additional options
            
        Returns:
            List of elements matching the selector
        """
        endpoint = f"{self.base_url}/scrape"
        
        # Set up default options
        payload = {
            "url": url,
            "selectors": [selector]
        }
        
        # Default navigation options
        payload["gotoOptions"] = {
            "waitUntil": "networkidle0",
            "timeout": 30000  # 30 seconds
        }
        
        # Override with custom options if provided
        if options:
            payload.update(options)
        
        # Make the API request
        print(f"DEBUG: Making API request to: {endpoint}")
        print(f"DEBUG: Using account ID: {self.account_id}")
        print(f"DEBUG: Headers: {self.headers}")
        print(f"DEBUG: Payload: {json.dumps(payload)}")
        
        response = requests.post(endpoint, headers=self.headers, data=json.dumps(payload))
        
        if response.status_code != 200:
            error_message = f"API request failed with status code: {response.status_code}"
            try:
                error_json = response.json()
                error_message = f"{error_message}, details: {json.dumps(error_json)}"
            except:
                error_message = f"{error_message}, response: {response.text}"
            print(f"DEBUG: {error_message}")
            raise Exception(error_message)
            
        return response.json()
