# Messente Messaging Launch Planner

A free, static Next.js tool that generates country-specific messaging launch plans for SMS, WhatsApp, and RCS.

## What it does

Users select:
1. Their use case (marketing, OTP, alerts, support)
2. Their target countries (up to 8 from 15 covered)

They receive:
- Recommended channel per country with reasoning
- Step-by-step launch plan with timeline (weeks + owners)
- Country-specific gotchas that competitors don't document
- Compliance checklist per country
- Recommended launch order (easiest first)
- Lead capture for PDF + expert call

## Tech stack

- **Next.js 14** (static export — no server needed)
- **TypeScript** — full type safety on all country/plan data
- **Tailwind CSS** — utility-first styling
- **Pure JS plan generator** — no external APIs, works offline
- **GitHub Pages** — free hosting with custom domain support

## Project structure

```
src/
  app/
    page.tsx          # Main interactive planner UI
    layout.tsx        # Root layout + metadata
    globals.css       # Base styles
  data/
    countries.json    # Knowledge base: 15 countries × 3 channels
    use-cases.json    # 4 use case definitions with channel preferences
  lib/
    planner.ts        # Pure plan generator logic (no dependencies)
.github/
  workflows/
    deploy.yml        # Auto-deploy to GitHub Pages on push to main
```

## Local development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Deploy to GitHub Pages

1. Push this repo to GitHub
2. Go to Settings → Pages → Source: **GitHub Actions**
3. Push to `main` — the workflow auto-builds and deploys
4. Your site is live at `https://yourusername.github.io/messaging-planner/`

## Custom domain (e.g. planner.messente.com)

1. Add a `CNAME` file to `/public/` containing your domain:
   ```
   planner.messente.com
   ```
2. In GitHub: Settings → Pages → Custom domain → enter `planner.messente.com`
3. In your DNS: add a CNAME record pointing `planner` → `yourusername.github.io`
4. Wait 10–60 minutes for DNS propagation

## Adding/updating countries

Edit `src/data/countries.json`. Each country follows this structure:

```json
{
  "XX": {
    "name": "Country Name",
    "flag": "🏳️",
    "region": "Europe",
    "channels": {
      "sms": {
        "available": true,
        "registration_required": true,
        "registration_body": "Regulator Name",
        "registration_timeline_days": [7, 21],
        "cost_per_message_usd": [0.05, 0.08],
        "gotchas": ["Important thing to know"],
        "notes": ["Context note"]
      },
      "whatsapp": { ... },
      "rcs": { ... }
    },
    "compliance": {
      "framework": "GDPR + local law",
      "opt_in_required": true,
      "opt_out_keyword": "STOP",
      "regulator": "Regulator name"
    },
    "market_notes": "One paragraph summary of the market."
  }
}
```

Push to main — GitHub Actions deploys automatically.

## Lead capture

The email form at the bottom of each generated plan captures leads. Currently logs to console. To connect to your CRM:

1. Replace the `handleSubmit` function in `src/app/page.tsx`
2. POST to your endpoint (Mailchimp, HubSpot, Resend, or custom)

Example with a simple webhook:
```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  await fetch('https://your-endpoint.com/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, countries: selectedCountries, useCase: selectedUseCase })
  })
  setSubmitted(true)
}
```

## Countries covered

🇩🇪 Germany · 🇫🇷 France · 🇵🇱 Poland · 🇬🇧 UK · 🇺🇸 USA · 🇮🇳 India · 🇧🇷 Brazil · 🇪🇸 Spain · 🇸🇪 Sweden · 🇳🇱 Netherlands · 🇦🇺 Australia · 🇸🇬 Singapore · 🇫🇮 Finland · 🇮🇹 Italy · 🇩🇰 Denmark
