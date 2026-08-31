# Trahi Emergency Response — Agent Instruction & Architecture Guide (`GEMINI.md`)

Welcome to the **Trahi Emergency Response** codebase. This file serves as the system instruction manual for the Antigravity Agent and human collaborators working on this full-stack project.

---

## 🎯 Project Overview & Mission

**Trahi** (Sanskrit for *"Deliver from distress / Rescue me"*) is a dual-sided emergency disaster response and donor relief ecosystem designed primarily for India.

1. **Citizen / Victim Portal (`/src/App.tsx`)**:
   - Panic-resistant interface with 2-second press-and-hold radial SOS trigger.
   - Live hardware vibration (`navigator.vibrate`) and Web Audio sound generation.
   - 10-second distress voice capture (`MediaRecorder`), live SpeechRecognition transcription in Indian English (`en-IN`), and a 3-second safety cancellation overlay.
   - Background audio upload via Cloudinary, automatic Gemini 3.7 Flash emergency categorization, and real-time Firestore logging (`sos_reports`).
   - One-touch emergency dialers for Indian national hotlines (112, 100, 108, 101, 1091, 1078).

2. **Donor & Relief Portal (`/src/components/donor/DonorPageShell.tsx`)**:
   - **Crisis Map (`DonorCrisisMapTab.tsx`)**: Full-screen interactive Leaflet map centered on India (`[20.5937, 78.9629]`). Visualizes active `sos_reports` (color-coded pins with category SVG glyphs + Voice SOS microphone badges) alongside verified USGS seismic feeds (dashed magnitude-scaled shockwave circles). Embedded audio player (`InlineVoicePlayer.tsx`) plays distress audio directly on the map.
   - **Direct Aid Campaigns (`DonorBrowseDonateTab.tsx`)**: Filterable disaster relief campaigns with funding progress bars and an interactive donation modal supporting UPI/Card simulation and 80G tax certificate generation.
   - **Fund Tracking & Transparency (`DonationsTracker.tsx`)**: Real-time fund allocation breakdown and verified ground NGO partner ledgers.
   - **Donor Impact & Profile (`DonorMyDonationsTab.tsx`, `DonorProfileTab.tsx`)**: Personal contribution history, giving badges, and digital 80G tax slips.

---

## 🏗️ Architecture & Technology Stack

- **Client Runtime**: React 18+ (Vite, TypeScript, Functional Components & Custom Hooks).
- **Styling & Design**: Tailwind CSS (Utility-first, `@import "tailwindcss";` in `src/index.css`), Lucide icons (`lucide-react`), and smooth physics animations via `motion/react`.
- **Geospatial Engine**: `leaflet` & `react-leaflet` with OpenStreetMap cartography tiles and custom HTML/SVG div-icons.
- **Server Runtime**: Express + Vite middleware in `server.ts` running on port `3000` with host `0.0.0.0`.
- **Database & Authentication**: Firebase Firestore and Firebase Auth (`src/services/firebase.ts`, `src/services/firestoreService.ts`).
- **AI Intelligence**: Google Gemini 3.7 Flash (`@google/genai`) for emergency transcript classification in `/api/classify-sos`.
- **Media & Audio Storage**: Cloudinary for voice distress recording CDN hosting (`/api/upload-audio`).
- **External Feeds**: USGS Earthquake Hazards Program API (`summary/2.5_week.geojson`) and Nominatim Reverse Geocoding.

---

## 🎨 Design & Category Semantic Guidelines

Always adhere to the established emergency category color codes:
- 🌊 **Flood**: Blue (`#2563EB`)
- 🔥 **Fire**: Orange (`#EA580C`)
- 🟤 **Earthquake**: Brown (`#854D0E`)
- 🩺 **Medical**: Red (`#DC2626`)
- 🛡️ **Crime / Violence**: Purple (`#9333EA`)
- 🏢 **Building Collapse**: Slate Gray (`#4B5563`)
- ⚠️ **Accident**: Yellow / Gold (`#CA8A04`)
- 🌐 **Other / General**: Teal (`#0F9D8F`)

---

## 📂 Core Directory Structure

```
.
├── .env.example                     # Declares all required environment variables
├── index.html                       # HTML5 entry point & viewport meta
├── metadata.json                    # Platform capabilities and permissions
├── package.json                     # Scripts, dependencies, and esbuild pipeline
├── server.ts                        # Express backend, Vite middleware, & API endpoints
├── tsconfig.json                    # TypeScript compiler settings
├── vite.config.ts                   # Vite build configuration
│
└── src/
    ├── main.tsx                     # App bootstrap
    ├── App.tsx                      # Primary Citizen Dashboard & view router
    ├── index.css                    # Tailwind CSS, Leaflet popup styles, equalizer animations
    ├── types.ts                     # TypeScript data interfaces (SOSReport, UserProfile, etc.)
    │
    ├── context/
    │   ├── AuthContext.tsx          # Firebase authentication session & guest state
    │   └── LocationContext.tsx      # High-accuracy GPS tracking & address resolution
    │
    ├── services/
    │   ├── firebase.ts              # Firebase initialization & Firestore export
    │   ├── firestoreService.ts      # Reactive Firestore subscriptions & queries
    │   ├── earthquakeService.ts     # Live USGS earthquake feed fetcher & radius scaler
    │   └── sosSubmissionService.ts  # End-to-end SOS audio upload, AI classification & write
    │
    └── components/
        ├── Header.tsx               # Top navigation bar with portal switcher
        ├── BottomNav.tsx            # Mobile citizen navigation tray
        ├── SidebarNav.tsx           # Desktop collapsible sidebar
        ├── SOSButton.tsx            # Radial press-and-hold button with circular progress
        ├── LocationMapWidget.tsx    # Citizen mini-map widget with accuracy halos
        ├── AddressCard.tsx          # Formatted street address and GPS coordinate card
        ├── EmergencyPanel.tsx       # 112, 100, 108, 101 emergency hotline dialer pad
        ├── ProfileView.tsx          # Citizen profile, blood group, & emergency contacts
        ├── LoginScreen.tsx          # Auth modal with email/password and guest entry
        ├── DonationsTracker.tsx     # Relief transparency charts & NGO partners
        │
        ├── sos/
        │   ├── VoiceSOSRecorder.tsx # Equalizer audio recorder with transcript stream
        │   └── CancelSOSOverlay.tsx # 3-second safety countdown abort overlay
        │
        └── donor/
            ├── DonorPageShell.tsx       # Donor portal layout with top/bottom navigation
            ├── DonorCrisisMapTab.tsx    # Interactive crisis map (SOS pins + USGS circles)
            ├── DonorBrowseDonateTab.tsx # Categorized relief campaigns & funding cards
            ├── DonorMyDonationsTab.tsx  # Donation history & 80G tax receipt generator
            ├── DonorProfileTab.tsx      # Donor statistics & impact badges
            ├── CrisisDetailsModal.tsx   # Detailed crisis inspection sheet with aid triggers
            └── InlineVoicePlayer.tsx    # Audio waveform player for victim voice SOS
```

---

## 🗄️ Firestore Collections Schema

1. **`sos_reports`**:
   - `id` (`string`): Auto-generated Firestore ID.
   - `userId` (`string`): User UID or `"anonymous_victim"`.
   - `latitude` (`number`): WGS84 GPS latitude.
   - `longitude` (`number`): WGS84 GPS longitude.
   - `transcript` (`string`): Spoken voice distress transcription.
   - `category` (`string`): AI-classified emergency category.
   - `voiceUrl` (`string` | `null`): Cloudinary CDN link to distress audio.
   - `status` (`string`): `"active"` | `"resolved"` | `"dispatched"`.
   - `userAddress` (`string`): Reverse geocoded street address.
   - `timestamp` (`number`): Unix millisecond timestamp.

2. **`users`**:
   - `uid` (`string`): Firebase Auth UID.
   - `displayName` (`string`): Full name.
   - `phone` (`string`): Contact number.
   - `bloodGroup` (`string`): E.g., `"O+"`, `"A+"`, `"B+"`.
   - `medicalConditions` (`string`): Allergies or chronic conditions.
   - `emergencyContacts` (`Array<{ name: string, phone: string, relation: string }>`): Next of kin.
   - `address` (`string`): Home address.

3. **`donations`**:
   - `id` (`string`): Transaction ID.
   - `donorId` (`string`): User UID.
   - `campaignId` (`string`): Target relief campaign ID.
   - `amount` (`number`): Donation amount in INR (₹).
   - `paymentMethod` (`string`): `"upi"`, `"card"`, `"netbanking"`.
   - `panNumber` (`string` | `null`): 10-digit PAN for Indian 80G tax exemptions.
   - `is80GEligible` (`boolean`): Whether tax receipt was requested.
   - `timestamp` (`number`): Unix millisecond timestamp.

4. **`relief_campaigns`**:
   - `id` (`string`): Unique campaign key.
   - `title` (`string`): Disaster relief initiative title.
   - `category` (`string`): Disaster type (Flood, Fire, Medical, etc.).
   - `targetAmount` (`number`): Financial goal in INR.
   - `raisedAmount` (`number`): Total funds contributed.
   - `urgency` (`string`): `"critical"` | `"high"` | `"moderate"`.
   - `location` (`string`): Geographic focus area.
   - `ngoPartner` (`string`): Verified ground relief NGO.

---

## ⚙️ Development & Build Rules

1. **Port & Host Binding**: The application must run on port `3000` with host `0.0.0.0` inside `server.ts`.
2. **API Proxy Rule**: All requests requiring third-party secrets (Gemini API, Cloudinary secrets) must be routed through server endpoints (`/api/*`). Never expose secret keys to the browser bundle.
3. **Production Build Command**:
   - `npm run build`: Uses `vite build` to compile the frontend to `dist/`, then runs `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs` to produce a single self-contained server binary.
   - `npm run start`: Runs `node dist/server.cjs`.
4. **Firebase Setup**: When provisioning or modifying Firestore rules, reference the `firebase-integration` skill and keep `firebase-blueprint.json` and `firestore.rules` updated.
5. **No Mock Fallback for Real APIs**: Always maintain genuine API calls to Firebase, Cloudinary, Gemini, and USGS.