# Web Screenshot Tool

A web application that leverages the Cloudflare Browser Rendering REST API to capture screenshots, generate PDFs, scrape elements, and fetch HTML content from websites.

![Web Screenshot Tool](https://i.imgur.com/placeholder.png)

## Features

- **Capture Screenshots**: Take full-page screenshots of any website.
- **Generate PDFs**: Create PDF documents from web pages.
- **Scrape Elements**: Extract specific HTML elements using CSS selectors.
- **Fetch HTML**: Get the fully rendered HTML content of a webpage.
- **Gallery View**: Browse, view, and manage your captured screenshots and PDFs.

## Requirements

- Python 3.8+
- Flask
- Cloudflare account with Browser Rendering API access

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/web-screenshot-tool.git
   cd web-screenshot-tool
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the project root with your Cloudflare API credentials:
   ```
   CLOUDFLARE_API_TOKEN=your_api_token_here
   CLOUDFLARE_ACCOUNT_ID=your_account_id_here
   FLASK_SECRET_KEY=your_secret_key_here
   ```

   To get your Cloudflare API token, you need to:
   - Go to the [Cloudflare dashboard](https://dash.cloudflare.com)
   - Navigate to "My Profile" > "API Tokens"
   - Create a new token with the "Browser Rendering - Edit" permission

5. Run the application:
   ```bash
   cd src
   python app.py
   ```

6. Open your browser and navigate to `http://127.0.0.1:5000/`

## API Endpoints

The application provides the following API endpoints:

- `POST /screenshot`: Capture a screenshot of a URL
- `POST /pdf`: Generate a PDF of a URL
- `POST /scrape`: Scrape HTML elements from a URL
- `POST /html`: Fetch rendered HTML from a URL

## Cloudflare Browser Rendering API

This application uses the [Cloudflare Browser Rendering REST API](https://developers.cloudflare.com/browser-rendering/rest-api/), which provides endpoints for common browser actions like capturing screenshots, extracting HTML content, generating PDFs, and more.

## Deployment to Cloudflare Pages

This project can be deployed using Cloudflare Pages, allowing you to host it on your own custom domain like `cfrest.johnarndt.net`.

### Deployment Steps

1. Push the project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/cfrest-app.git
   git push -u origin main
   ```

2. Connect to Cloudflare Pages:
   - Log in to your Cloudflare dashboard
   - Navigate to "Pages"
   - Click "Create a project" and select "Connect to Git"
   - Select your GitHub repository
   - Configure your build settings:
     - Build command: (leave empty)
     - Build output directory: `public`

3. Configure Environment Variables:
   - In your Cloudflare Pages project settings, add the following environment variables:
     - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Browser Rendering permissions
     - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

4. Set up Custom Domain:
   - In your Cloudflare Pages project, go to "Custom domains"
   - Add your custom domain (e.g., `cfrest.johnarndt.net`)
   - Follow the instructions to verify domain ownership if needed

5. Deploy Your Site:
   - Cloudflare will automatically deploy your site
   - Any future pushes to your GitHub repository will trigger new deployments

### How It Works

The deployment uses Cloudflare Pages Functions to handle the API requests, which are proxied to the Cloudflare Browser Rendering API. The static frontend is served from the `public` directory, and all user data is stored in the browser's localStorage.

## Local Development (Previous Flask Version)

For local development, you can still use the Flask version in the `src` directory:

```bash
cd src
python app.py
```

The Flask app will run on http://127.0.0.1:5001.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
