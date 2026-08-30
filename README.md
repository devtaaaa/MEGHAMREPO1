# MEGHAM AI Review Assistant

A mobile-first MVP to help customers easily generate and post Google Reviews using AI. Built with React (Vite), Tailwind CSS, and Cloudflare Workers.

## Requirements

- Node.js (v18+)
- [Cloudflare Account](https://dash.cloudflare.com/sign-up)
- [Groq API Key](https://console.groq.com/keys)

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Wrangler (Cloudflare CLI)
Wrangler is already included in the `devDependencies`. If you prefer to have it globally:
```bash
npm install -g wrangler
```

### 3. Create a Groq API Key
Get a Groq API key from [Groq Console](https://console.groq.com/keys).

### 4. Configure Local Environment Variables
Create a local `.env` file for testing:
```bash
cp .env.example .env
```
Open `.env` and add your Groq API Key:
```env
GROQ_API_KEY=your_actual_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
```
*Note: `.env` is ignored by Git. NEVER commit your API key.*

### 5. Run Locally
Start the development server using Wrangler (which will serve both the Vite frontend and the Worker backend):
```bash
npm run build
npx wrangler dev
```
Open the provided local URL (usually `http://localhost:8787`).

## Production Deployment (Cloudflare)

### 6. Login to Cloudflare
Authenticate Wrangler with your Cloudflare account:
```bash
npx wrangler login
```

### 7. Add Production Secret
The `GROQ_API_KEY` MUST be stored securely in Cloudflare, not in your source code. Run this command to add the secret to your Cloudflare Worker:
```bash
npx wrangler secret put GROQ_API_KEY
```
When prompted, paste your Groq API key.

### 8. Deploy
Deploy the full stack (Frontend + Worker API) to Cloudflare:
```bash
npm run build
npx wrangler deploy
```

### 9. Connect a Custom Domain
1. Log in to the Cloudflare Dashboard.
2. Go to **Workers & Pages** -> Select `megham-review`.
3. Go to **Settings** -> **Domains & Routes**.
4. Click **Add Custom Domain** and enter your desired domain (e.g., `reviews.megham.com`).

### 10. Generate the QR Code
This application includes a built-in QR generator utility for your customers to scan.
Once deployed (or running locally), append `?qr=true` to the URL.
For example: `https://megham-review.your-subdomain.workers.dev/?qr=true`

Scan or save this QR code and print it for your restaurant tables!

## Security Notes
- The Groq API key is never exposed to the browser.
- The `POST /api/generate-review` endpoint securely proxies the request to Groq.
- The user must manually paste and submit the review on Google (no automated submission or DOM manipulation is attempted, respecting Google's terms of service).
