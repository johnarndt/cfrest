# Social Media Preview Generator

A Cloudflare Pages-based tool that generates social media share previews for any URL. It uses Cloudflare's Browser Rendering API to generate snapshot previews of websites, and Groq's API to suggest engaging, SEO-optimized social meta titles, descriptions, and hashtags.

## Features

- Generate preview images for Twitter, LinkedIn, and Facebook
- Capture website screenshots using Cloudflare's Browser Rendering API
- Generate SEO-optimized titles, descriptions, and hashtags using Groq's AI
- Modern, responsive UI with platform-specific preview cards
- Copy and download functionalities for easy sharing
- MCP server integration for AI assistant access (Claude, Cursor, etc.)

## Prerequisites

1. A Cloudflare account with access to the Browser Rendering API
2. A Groq account with an API key
3. Node.js and npm installed on your machine
4. Wrangler CLI (Cloudflare's command-line tool)
5. (Optional) Claude Desktop or another MCP-compatible client for AI assistant integration

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

## MCP Server Integration

This project includes Model Context Protocol (MCP) server integrations that allow AI assistants like Claude to interact directly with your Cloudflare resources and Groq models:

### Cloudflare MCP Server

The Cloudflare MCP Server allows Claude or other MCP clients to:
- Deploy and manage your Cloudflare Workers
- Interact with KV stores, R2 buckets, and D1 databases
- Fetch analytics data for your domain
- Manage all aspects of your Cloudflare resources using natural language

#### Setup:

1. The servers are already configured in this project. If you need to reinstall:
   ```
   npm install @cloudflare/mcp-server-cloudflare
   npx @cloudflare/mcp-server-cloudflare init
   ```

2. The MCP server configuration is stored in:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%/Claude/claude_desktop_config.json`

### Groq Integration

This project also includes an MCP server for interacting with Groq's AI models:

1. The Groq MCP server allows Claude to communicate with Groq's LLMs, enabling:
   - Multi-model conversations between different AI systems
   - Direct access to specialized Groq models like `llama-3.1-70b-versatile`
   - Parallel processing with both Claude and Groq models

2. Before using, update your Groq API key in the Claude Desktop configuration file:
   ```json
   "chat-groq": {
     "env": {
       "AI_CHAT_KEY": "YOUR_ACTUAL_GROQ_API_KEY",
       ...
     }
   }
   ```

### Using MCP Servers

1. Install Claude Desktop from [claude.ai/download](https://claude.ai/download)
2. Start Claude Desktop - you should see tool icons for both Cloudflare and Groq integrations
3. You can now ask Claude to:
   - "Deploy a new Worker for my social media preview generator"
   - "Check the analytics for my Cloudflare Pages site"
   - "Use Groq to generate optimized social media descriptions for my site"

For development without Claude Desktop, you can run the MCP servers directly:
```
# For Cloudflare MCP Server
node ./node_modules/@cloudflare/mcp-server-cloudflare/dist/index.js run YOUR_ACCOUNT_ID

# For Groq MCP Server
node ./any-chat-completions-mcp/build/index.js
```

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
