# Social Media Preview Generator

A Cloudflare Pages-based tool that generates social media share previews for any URL. It uses Cloudflare's Browser Rendering API to generate snapshot previews of websites, and Groq's API to suggest engaging, SEO-optimized social meta titles, descriptions, and hashtags.

## Features

- Generate preview images for Twitter, LinkedIn, and Facebook
- Capture website screenshots using Cloudflare's Browser Rendering API
- Generate SEO-optimized titles, descriptions, and hashtags using Groq's AI
- Modern, responsive UI with platform-specific preview cards
- Copy and download functionalities for easy sharing

## Prerequisites

1. A Cloudflare account with access to the Browser Rendering API
2. A Groq account with an API key
3. Node.js and npm installed on your machine
4. Wrangler CLI (Cloudflare's command-line tool)

## Setup Instructions

1. Clone this repository
2. Set up your environment variables in the Cloudflare dashboard or in a local `.env` file:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Browser Rendering access
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
   - `GROQ_API_KEY`: Your Groq API key

3. Install dependencies:
   ```
   npm install
   ```

4. For local development:
   ```
   npx wrangler pages dev public --functions-dir functions --compatibility-flag=nodejs_compat
   ```

## Deployment

### Deploying to Cloudflare Pages

1. **Connect your GitHub repository**:
   - Log in to the Cloudflare dashboard
   - Navigate to Pages
   - Click "Create a project"
   - Connect your GitHub account and select this repository

2. **Configure your build settings**:
   - Build command: `npm install`
   - Build output directory: `public`
   - Root directory: `/`

3. **Add environment variables**:
   - Go to Settings > Environment variables
   - Add your `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `GROQ_API_KEY`
   - Set each variable to be available in both production and preview environments

4. **Deploy**:
   - Cloudflare will automatically deploy your application
   - Each push to your main branch will trigger a new deployment

### Manual Deployment via Wrangler

To deploy directly from your local machine:

1. Login to Cloudflare from the CLI:
   ```
   npx wrangler login
   ```

2. Deploy your project:
   ```
   npx wrangler pages deploy public
   ```

## Usage

1. Enter any URL in the input field
2. Click "Generate Previews" button
3. Wait for the previews to generate (this may take a few seconds)
4. Switch between Twitter, LinkedIn, and Facebook tabs to see the different previews
5. Copy the text or download the images for each platform

## Project Structure

```
project/
├── functions/                # Cloudflare Functions
│   ├── renderSite.js         # Browser Rendering API integration
│   ├── generateSEO.js        # Groq API integration for SEO content
│   └── fetchMetadata.js      # URL metadata extraction
├── public/                   # Static assets served by Cloudflare Pages
│   ├── index.html            # Main HTML file
│   ├── css/                  # CSS files
│   │   └── styles.css        # Main styles
│   └── js/                   # JavaScript files
│       └── app.js            # Frontend application logic
├── .env                      # Environment variables (not committed to Git)
├── package.json              # Project dependencies and scripts
└── README.md                 # This file
```

## Common Issues and Troubleshooting

- **API Keys**: Make sure your Cloudflare API token has the correct permissions for Browser Rendering.
- **CORS Issues**: If you encounter CORS errors, make sure you're using Cloudflare Functions as they handle CORS automatically.
- **Content Security Policy**: Some websites may block screenshots due to CSP. You may need to adjust settings for specific sites.
- **Rate Limits**: Be aware of the rate limits for both Cloudflare Browser Rendering API and Groq API.

## Troubleshooting

If you encounter issues with button clicks or event handlers:
- Check the browser console for errors
- Verify that the DOM elements have the expected IDs and classes
- Make sure all event listeners are properly attached

## Further Customization

- Modify the UI in `public/css/styles.css` and `public/index.html`
- Add more social platforms by extending the platform-specific code in `public/js/app.js`
- Adjust the Groq prompt in `functions/generateSEO.js` to tailor the AI output

## License

MIT
