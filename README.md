# Trahi

**त्राहि — when just calling out is enough.**

Trahi is a mobile-first emergency response platform built for India. With a single press-and-hold gesture, anyone trapped in a disaster can broadcast a voice SOS, get AI-guided emergency help, receive live location-based disaster alerts, and let the community fund relief efforts through a fully transparent, trackable donation system.

Built for **CodeBuild 1.0** by Team **Mouse Potatoes**.

---

## Team

| Name | Role |
|---|---|
| Ghufran Fazal | Developer |
| Tanvi | Developer |
| Nishita Naman| Developer |

---

## The Problem

- **Emergency communication is broken.** Multi-step SOS forms waste precious seconds during a disaster. One-tap buttons are faster but risk being triggered by accident.
- **No unified access to critical help.** A person trapped in a disaster rarely knows which police station, disaster authority, or helpline to contact — and gets no advance warning of unfolding disasters nearby.
- **Donations don't reach the needy.** Donors have no way to verify that relief money actually reaches the affected person, leaving room for scams and misuse.

## Our Solution

Trahi combines four pillars into one platform:

1. **Voice SOS Broadcast** — Hold, speak, done. No forms, mistake-proof by design.
2. **TrahiGPT Assistant** — AI guidance grounded in the nearest police and disaster-authority contacts.
3. **Live Disaster Alerts** — Location-based warnings before, during, and after a disaster.
4. **Transparent Donations** — Milestone-tracked relief funding, verified by multiple independent parties, auditable rupee by rupee.

---

## Key Features

### 🎙️ Voice SOS Broadcast
- Press-and-hold gesture (2–3 sec) triggers audio recording — no accidental single-tap triggers.
- A 3-second cancel window prevents mistaken broadcasts.
- Recording is auto-transcribed and auto-categorized (Flood, Fire, Earthquake, Medical, Crime/Violence, Building Collapse, Accident, Other) using Gemini, with zero extra effort from the user.
- Broadcasts include voice clip, transcript, category, and exact GPS location.

### 🤖 TrahiGPT — AI Emergency Assistant
- Powered by the Gemini API.
- Uses a lightweight retrieval approach (local contact database + prompt injection) to surface the nearest police station, disaster authority, or helpline based on the user's location — no heavy RAG pipeline required.
- **Offline & Low-Latency Simulator Engine**: Built-in structured triage generator for critical disaster & first-aid scenarios (CPR & Cardiac Arrest, Severe Thermal Burns, Venomous Snakebites, Severe Hemorrhage, Earthquake Survival, Flood Rescue, Choking/Heimlich Maneuver). Renders color-coded urgency badges, step-by-step action plans, vital metrics, critical warning banners, and one-touch helpline dialers (`112`, `108`, `101`, `100`, `1078`, `1926`), with a universal fallback for any custom query.

### 📍 Location & Live Disaster Data
- Mandatory location permission (app is gated until granted) using the browser Geolocation API.
- Reverse geocoding via the free Nominatim (OpenStreetMap) API for city/state/pincode.
- A compact, faded map preview on the SOS screen shows the user's exact live location.
- USGS Earthquake API integrated for verified, official earthquake data as a supplementary trust layer.

### 🗺️ Crisis Map (Donor Section)
- Plots all community-reported SOS cases (color-coded by category) alongside verified USGS earthquake data (dashed boundary overlays).
- Filterable by disaster category.

### 💰 Transparent Donation System (Core USP)
- **Trust Score (0–100)** computed per case from location correlation with verified disasters, corroborating independent reports, and verifier votes — fully visible to donors, not a black box.
- **Multi-party verification** — no single admin can approve a case. Requires 2+ independent verifier votes plus a minimum trust score before funds are marked "Approved."
- **Delivery-style status tracking** (Donation Received → Verifying → Approved → Transferred → Utilization Proof Uploaded → Closed), modeled on e-commerce order tracking.
- **Public, login-free Transparency Ledger** — anyone can audit any case's full history, verifier decisions, and utilization proof, downloadable as a PDF report.
- Donation payments simulated via Razorpay Test Mode for the hackathon build.

### 📶 Offline-First Resilience & PWA Capabilities
- Built as a Progressive Web App (PWA) with a Service Worker (`sw.js`) — app shell, cached alerts, and emergency contacts remain accessible without internet.
- **Web App Manifest & Brand Icon Suite**: `manifest.json` configured with `display: "standalone"`, `theme_color: "#0F9D8F"`, and custom high-resolution PNG brand icons (`pwa-512x512.png`, `pwa-192x192.png`, `apple-touch-icon.png`, `favicon.png`).
- **Header Three-Dot Options Menu**: Integrated `⋮` options menu in the header with an **"Install App"** button that invokes browser PWA installation or provides visual instructions for Android (Chrome/Edge) and iOS (Safari).
- SOS recordings are queued locally (IndexedDB) when offline and auto-sync the moment connectivity returns.
- SMS fallback for zero-data situations — a native SMS intent sends location and an emergency message using only cellular signal, no internet required.

### 📱 Mobile View & Profile Features
- **Smart Bottom Navigation Tray**: Auto-hides when launching TrahiGPT to provide an unobstructed, full-screen conversational view and voice input bar on mobile devices.
- **Victim SOS Profile View**: Reusable profile modal component displaying synced Firestore contact, blood group, medical conditions, and next-of-kin emergency details across SOS displays.

---

## User Journey

```
Hold the SOS button (2–3 sec)
        ↓
Speak — situation is recorded
        ↓
Auto-broadcast: voice + location + transcript + AI-classified category
        ↓
TrahiGPT gives guidance + nearest emergency contacts
        ↓
Authority dashboard & community are alerted
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend-as-a-Service | Firebase (Authentication, Firestore) |
| Media Storage | Cloudinary (voice SOS clips, unsigned upload) |
| AI Assistant | Google Gemini API |
| Maps & Geolocation | Leaflet + OpenStreetMap, Nominatim reverse geocoding |
| Disaster Data | USGS Earthquake API |
| Payments (Demo) | Razorpay Test Mode |
| Build Tool | Google AI Studio (Build mode) |
| Deployment | Vercel |
| Version Control | GitHub |

This is a **frontend-only architecture** — no custom backend server. All data and auth needs are handled through Firebase and Cloudinary as managed backend services, called directly from the client.

---

## Data Model (Firestore)

**`users`**
```
{ userId, name, age, gender, bloodGroup, profilePictureUrl, location: { latitude, longitude, district, block, pincode, state }, profileCompleted, createdAt }
```

**`sos_reports`**
```
{ userId, voiceUrl, transcript, category, latitude, longitude, timestamp, status }
```

**`donors`**
```
{ userId, name, email, phone, city, state, preferredCauses, createdAt }
```

**`donations`**
```
{ sosReportId, donorName, amount, status, timestamp }
```

**`verifications`** (append-only)
```
{ caseId, verifierId, verifierName, vote, note, timestamp }
```

---

## Setup

### Prerequisites
- Node.js and npm
- A Firebase project (Firestore + Authentication enabled)
- A Cloudinary account (unsigned upload preset)
- A Gemini API key (no billing linked, to stay on the free tier)
- Razorpay test-mode API keys (optional, for the donation demo)

### Environment Variables
Create a `.env` file in the project root:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_GEMINI_API_KEY=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```
Add `.env` to `.gitignore` — never commit real keys.

### Install & Run
```bash
npm install
npm run dev
```

### Deploy
Push to GitHub, then import the repository into Vercel. Add the same environment variables under Vercel's **Settings → Environment Variables**, then deploy.

---

## What's Built vs. Roadmap

### Hackathon Build (Current)
- Working SOS voice broadcast with auto-categorization
- TrahiGPT assistant via Gemini API & offline triage simulation engine with rich protocol UI cards
- Mandatory location + live map preview
- Full Progressive Web App (PWA) with manifest, custom brand icons, offline Service Worker, and Three-Dot "Install App" header menu
- Mobile view UX optimizations (Tray auto-hide on TrahiGPT view, victim profile inspection modal)
- Mock police/authority routing dashboard
- Donation tracking UI with dummy/test-mode data
- Offline PWA support with SMS fallback

### Future / Production Roadmap
- **Phase 2:** Live payment gateway with escrow (Razorpay Route), phone OTP verification, verified NGO/volunteer partner network for on-ground fund verification.
- **Phase 3:** Official integration with NDMA/state disaster authorities, direct routing to police, fire, and ambulance services, government/smart-city partnerships.
- **Phase 4:** Fully offline on-device AI assistant (e.g. Gemma/Phi-4-mini via WebLLM) for zero-connectivity disaster zones, multi-language voice support nationwide.

---

## License

TBD.