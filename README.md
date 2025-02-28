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

### 1. Clone this repository

```bash
git clone <repository-url>
cd social-media-preview-generator
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory with the following variables:

```
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
GROQ_API_KEY=your_groq_api_key
```

To get these values:

- **Cloudflare API Token**: Create a token with the "Browser Rendering:Edit" permission in your Cloudflare dashboard.
- **Cloudflare Account ID**: Found in your Cloudflare dashboard URL: `https://dash.cloudflare.com/` followed by your account ID.
- **Groq API Key**: Create one in your Groq account dashboard.

### 4. Local development

Run the development server:

```bash
npm run dev
```

This will start a local server, typically at `http://localhost:8788`.

### 5. Deploy to Cloudflare Pages

```bash
npm run deploy
```

You'll need to be logged in to Wrangler CLI:

```bash
npx wrangler login
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

## Further Customization

- Modify the UI in `public/css/styles.css` and `public/index.html`
- Add more social platforms by extending the platform-specific code in `public/js/app.js`
- Adjust the Groq prompt in `functions/generateSEO.js` to tailor the AI output

## License

MIT
