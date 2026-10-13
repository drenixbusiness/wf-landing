# Wildfire Express — 3D recruiting website (Next.js)

Next.js 16 (App Router) + TypeScript + three.js site for **Wildfire Express LLC** (USDOT 3498707 · MC 1154036).
One persistent WebGL scene lives in the root layout, so it survives client-side navigation: moving between pages, the
camera glides from the current shot to the new page's first shot instead of reloading the 3D world.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Deploy to Vercel (or any Node host). The `/api/lead` route needs a server runtime.

## Structure

```
app/
  layout.tsx            fonts (next/font), header, footer, 3D canvas, poster, vignette, loader
  globals.css           design tokens + all styles
  page.tsx              Home                      /
  about/ services/ company-drivers/ owner-operators/ careers/ apply/ contact/ privacy/ terms/
  api/lead/route.ts     receives applications + contact messages
  sitemap.ts robots.ts
components/
  World.tsx             mounts the canvas once, refreshes camera keys on route change
  Header.tsx            nav + accessible mobile menu (focus trap, Esc, scroll lock)
  Footer.tsx            closing CTA (road shot) + links
  PageEffects.tsx       reveals, counters, row borders, sticky home-hero chapters (re-runs per route)
  ApplyForm.tsx         3-step application (React state, ?role=owner|company|partner preselects)
  ContactForm.tsx       topic chips + message
  OfficeMap.tsx         MapLibre + CARTO office map (Contact), lazy-loaded when scrolled near
  SmsConsent.tsx        optional, unchecked SMS opt-in (A2P 10DLC)
lib/
  world.ts              the three.js world: truck repaint, road, embers, US map network, camera choreography
  site.ts               company facts (phone, email, USDOT/MC, address) and nav
  leads.ts              phone/email validation, consent wording, client submit helper
public/assets/          truck.glb (desktop 6.5 MB), truck-mobile.glb (2.4 MB), us-map.json, posters, logo
legacy-static/          the earlier plain-HTML version, kept for reference only
```

Camera shots are chosen in the markup: any element with `data-shot="hero|side|side2|rear|wheel|top|road|map|mapLow"`
becomes a key; `data-drag` on a section enables drag-to-orbit (company-drivers hero).

## Before launch

1. **Address** — `COMPANY.address` / `COMPANY.geo` in `lib/site.ts` (8113 W Mill St, Cleves, OH 45002, from the FMCSA MCS-150 record). Shown on Contact (map), footer, Privacy and Terms.
2. **Governing law** — `app/terms/page.tsx` §13 uses Ohio (from the 513 area code). Change if the LLC is elsewhere.
3. **Leads** — every application and contact message is posted to the Telegram group: set `TG_BOT_TOKEN` and `TG_GROUP_ID`
   (the bot must be a member of the group). Optionally also set `LEAD_WEBHOOK_URL` (Zapier/Make, ATS, CRM) to receive the JSON.
   **Map** — `NEXT_PUBLIC_CARTO_KEY` (CARTO basemap, recoloured in `components/OfficeMap.tsx`).
   Each lead includes a `consent` object: SMS opt-in yes/no, the exact wording (server-side copy), timestamp, page,
   IP and user agent — store it as proof of opt-in.
4. **Site URL** — set `NEXT_PUBLIC_SITE_URL` (e.g. `https://wildfireexpress.com`) for canonical URLs and the sitemap.
5. **Copy** — pay ranges, statistics, benefits, requirements and the two driver quotes are placeholders. Replace them
   with real, verifiable figures and real testimonials (with permission).
6. **Legal review** — have an attorney review the Privacy Policy and Terms before publishing.

## RingCentral / A2P 10DLC

| Requirement | Where |
| --- | --- |
| Opt-in checkbox never pre-checked, separate from Terms/Privacy. On `/apply` it is **required** (owner's decision; a phone application path is offered instead) — reviewers may flag mandatory opt-in | `components/ApplyForm.tsx`, enforced again in `app/api/lead/route.ts` |
| Disclosure: brand, message types, frequency, msg & data rates, HELP/STOP, links, "not a condition…" | same |
| Privacy: mobile info / opt-in data not shared with third parties or affiliates for marketing | `/privacy` callout, §5, §6 |
| SMS Terms: program, opt-in, frequency, rates, STOP/HELP, carrier disclaimer, samples, contact | `/terms#sms` |

Campaign registration: brand **Wildfire Express LLC**; opt-in URL `https://<domain>/apply`; privacy
`https://<domain>/privacy`; terms `https://<domain>/terms#sms`; sample messages from Terms §4.9.
If you change the consent wording, update both `SmsConsent.tsx` and `SMS_CONSENT` in `lib/leads.ts`.

## Assets

- Rebuild the models: `npm run build:model -- path/to/volvo_vnl_2025.glb` → truck.glb (desktop, ~3 MB), truck-mobile.glb (~1.7 MB), truck-lite.glb (weak devices, ~1.1 MB). Textures of repainted materials are stripped. Preview the low-end path with `?quality=lite`.
- Rebuild the map: `npm run build:map` (us-atlas + topojson-client → `public/assets/us-map.json`).
- 3D model "Volvo VNL 2025" by gelber (sketchfab.com/liebherr996litronic), CC BY 4.0, modified — credited in Terms §7.
