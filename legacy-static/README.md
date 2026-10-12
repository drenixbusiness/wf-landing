# Wildfire Express — 3D recruiting website

Static, multi-page site for **Wildfire Express LLC** (USDOT 3498707 · MC 1154036). One persistent three.js scene sits
behind every page; the camera moves between shots as you scroll. No framework, no bundler — deploy the folder to any
static host (Netlify, Vercel, Cloudflare Pages, S3, cPanel…).

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

Opening the HTML files directly from disk (`file://`) will not work — the 3D model and map need an HTTP server.

## Pages

| File | Page | Camera sequence |
| --- | --- | --- |
| `index.html` | Home (sticky 3-chapter hero, numbers, map, lanes, voices, FAQ) | hero → side → rear → top → map → mapLow → wheel → side2 → road |
| `about.html` | About | map → mapLow → top → side → road |
| `services.html` | Services | road → side → map → road |
| `company-drivers.html` | **Company driver offer** (replaces Fleet; draggable truck) | hero (drag) → wheel → rear → side → top → side2 → road |
| `owner-operators.html` | Owner-operators | side2 → top → map → mapLow → road |
| `careers.html` | Careers (`#owner`, `#company`, `#partner`) | road → side → map → road |
| `apply.html` | 3-step application (`?role=owner|company|partner` preselects) | rear → road |
| `contact.html` | Contact | map → mapLow → side → road |
| `privacy.html` | Privacy Policy (incl. SMS privacy) | top → road |
| `terms.html` | Terms & Conditions + SMS Terms (`#sms`) | top → road |

The camera shot for a section is set with `data-shot="<name>"`; `data-drag` enables the drag-to-orbit hero.

## Editing the header / footer

The header and footer live once in `partials/`. After editing them run:

```bash
npm run build
```

This rewrites the block between `<!-- @header -->…<!-- /@header -->` and `<!-- @footer -->…<!-- /@footer -->` in every
page and marks the active nav link.

## Before launch — checklist

1. **Business address.** Search the project for `[Business address — add before launch]` (contact, privacy, terms) and
   replace it with the exact address on your FMCSA / 10DLC brand registration.
2. **Governing law.** `terms.html` §13 uses the State of Ohio (inferred from the 513 area code). Change it if your LLC
   is organized elsewhere.
3. **Numbers and claims.** Pay ranges, percentages, statistics, benefits, requirements and the two driver quotes are
   placeholder copy. Replace them with real, verifiable figures and real testimonials (with the drivers' permission) —
   the FTC treats invented testimonials as deceptive.
4. **Form delivery.** Set `FORM_ENDPOINT` at the top of `js/site.js` to a URL that accepts JSON `POST`s (Formspree,
   Basin, your ATS, or a small serverless function). Until then, forms only show their success state.
   Each submission includes the SMS consent record: `sms_consent`, the exact `sms_consent_text`, `consent_timestamp`,
   `consent_page` and `user_agent`. Store these — they are your proof of opt-in.
5. **Legal review.** The Privacy Policy and Terms were written to be enforceable and to match carrier/TCR review
   expectations, but have a licensed attorney review them before publishing.

## RingCentral / A2P 10DLC notes

What reviewers check, and where it lives on this site:

| Requirement | Where |
| --- | --- |
| Opt-in checkbox is **optional and unchecked**, separate from Terms/Privacy acceptance | `apply.html`, `contact.html` (`[data-sms-consent]`) |
| Disclosure next to the checkbox: brand name, message types, "Msg frequency varies", "Msg & data rates may apply", HELP / STOP, links to Privacy & SMS Terms, "consent is not a condition…" | same |
| Privacy Policy states mobile info / opt-in data is **not shared with third parties or affiliates for marketing** | `privacy.html` callout + §5 + §6 |
| SMS Terms: program name & description, how to opt in, frequency, rates, STOP/HELP, carrier liability disclaimer, contact | `terms.html#sms` |
| Publicly reachable policy URLs | `/privacy.html`, `/terms.html#sms` |

When you register the campaign in RingCentral, use the same wording: brand **Wildfire Express LLC**, use case
"Account notifications / Customer care" (recruiting and application updates), the sample messages from `terms.html` §4.9,
the opt-in URL `https://<your-domain>/apply.html`, and the privacy/terms URLs above. The campaign description, sample
messages and the live opt-in page must match each other.

## 3D assets

- `assets/truck.glb` (6.5 MB, desktop) and `assets/truck-mobile.glb` (2.4 MB, phones) were produced from the 48.5 MB
  source with gltf-transform (meshopt geometry, WebP textures). Rebuild with `npm run build:model` after replacing
  `SOURCE.glb` in the script with your file path.
- The truck is repainted in code (`js/world.js`, `repaint()`): body → black clearcoat, trim → matte black, grille → dark
  metal, purple aluminium → neutral chrome.
- `assets/us-map.json` is generated from `us-atlas` with `topojson-client` (`npm run build:map`): lower-48 outline and the
  land dot grid, pre-projected to the ground plane.
- `assets/poster.jpg` / `poster-portrait.jpg` are shown instantly while the model loads and as the fallback without
  WebGL. To regenerate: run the dev server, open the home page, then in the console `await __wf.capture('poster.jpg')`.

### Credits / licenses

- "Volvo VNL 2025" 3D model by **gelber** (https://sketchfab.com/liebherr996litronic), CC BY 4.0, modified. The
  attribution is in `terms.html` §7 (CC BY requires it somewhere reasonable; it is intentionally not in the footer).
- three.js — MIT. us-atlas / topojson-client — ISC; map data from the U.S. Census Bureau.
- Fonts: Cormorant Garamond and Lora (SIL Open Font License) via Google Fonts.

## Performance & accessibility behaviour

- Phones (< 768 px) and low-end GPUs (≤ 4 cores or < 40 FPS in the first 2 s): no shadow map, ⅓ particles, coarser map
  dots, no large glow sprites; pixel ratio ≤ 1.5. The shadow map is rendered once (the scene is static).
- Rendering pauses when the tab is hidden; frame delta is capped at 50 ms.
- `prefers-reduced-motion`: no reveals, counters, ticker animation or camera easing — shots cut instantly.
- No WebGL: the poster image is shown behind the content.
