# Elias Construction website

Simple, lightweight version to host for free on Vercel with serverless functions

## Contact form spam protection (Google reCAPTCHA)

This site uses a Vercel Serverless Function at `/api/contact` (Resend) and a contact form on `/contact`.

### 1) Create reCAPTCHA keys

- In Google reCAPTCHA Admin Console, create a **reCAPTCHA v3** key for your domain (e.g. `eliasremodel.com`).
- You will get:
 	- **Site key** (public) — used in the browser
 	- **Secret key** (private) — used on the server

### 2) Add your site key to the contact page

- Open `contact.html` and replace `YOUR_RECAPTCHA_SITE_KEY` in the script tag:
 	- `https://www.google.com/recaptcha/api.js?render=YOUR_RECAPTCHA_SITE_KEY`

### 3) Set server environment variables (Vercel)

Set these environment variables for your Vercel project:

- `RESEND_API_KEY` = your Resend API key
- `RECAPTCHA_SECRET_KEY` = your reCAPTCHA **secret** key

Optional:

- `RECAPTCHA_SCORE_THRESHOLD` = minimum v3 score (default: `0.5`)

After setting env vars, redeploy.
