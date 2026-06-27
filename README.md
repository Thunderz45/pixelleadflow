# LeadFlow | B2B Lead Generation & Browser Automation SaaS

LeadFlow is a production-ready SaaS application designed for sales teams and marketing agencies. It automates Google Maps business lead collection securely through your local browser sessions, saving you thousands of dollars in third-party API keys or scraping fees.

The system is fully modular and composed of three main elements:
1. **Next.js Dashboard:** Built with App Router, React, Tailwind CSS, and Shadcn UI. Interacts with Firebase clients to manage projects, filter business databases, view scrape run history, and download leads in Excel, CSV, or JSON formats.
2. **Chrome Extension (Manifest V3):** Built in pure JavaScript/TypeScript. Hooks into active Google Maps windows to auto-scroll, click list items, scrape phone/website details, and sync progress real-time with the Dashboard.
3. **Puppeteer Automation Engine:** Standalone Node/TypeScript scraper for headless/headful server automation runs.

---

## Folder Structure

```
pixel leadflow/
├── README.md               # Master documentation and installation guide
├── dashboard/              # Next.js web application
│   ├── public/             # Static logos and assets
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/        # REST Endpoints for Extension integrations
│   │   │   │   ├── leads/save/route.ts
│   │   │   │   ├── projects/route.ts
│   │   │   │   └── scrape/history/route.ts
│   │   │   ├── dashboard/   # Secure Views: Overview, Projects, Saved, History, Exports, Settings, Profile
│   │   │   ├── globals.css  # CSS Custom gradients and premium glassmorphism layouts
│   │   │   ├── layout.tsx   # Global font config (Outfit) and Auth wrapping
│   │   │   └── page.tsx     # Landing landing page with Google OAuth CTA
│   │   ├── context/
│   │   │   └── auth-context.tsx  # React Firebase Auth session provider & cookie synchronizer
│   │   └── lib/
│   │       ├── auth-verify.ts   # Backend JWT validation engine
│   │       └── firebase.ts      # Server-safe Firebase SDK initialization
│   ├── package.json
│   └── tsconfig.json
├── extension/              # Manifest V3 Chrome Extension
│   ├── icons/              # Glowing compass logo branding in various sizes
│   ├── background.js       # Service worker handles auth synchronization and state broadcasts
│   ├── content.js          # Google Maps DOM scroller and field parser
│   ├── popup.html          # Popup settings selector and control console
│   ├── popup.js            # Inputs listeners and tab messaging triggers
│   └── manifest.json       # Extension configurations
└── automation/             # Standalone Puppeteer Scraper Server
    ├── scraper.ts          # Automated maps search scraper script
    ├── package.json
    └── tsconfig.json
```

---

## Installation Guide

### Prerequisites
- Node.js version `18.0.0` or higher
- Google Chrome browser (for Chrome Extension scraping)
- Firebase Account (free tier is fully compatible)

### Step 1: Install Dashboard Dependencies
```bash
cd dashboard
npm install
```

### Step 2: Install Scraper Automation Dependencies
```bash
cd ../automation
npm install
```

---

## Firebase Console Setup

To hook your database backend successfully, configure Firestore database rules:

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Create or select a project named `pixel-leadflow`.
3. Go to **Authentication** -> **Sign-in method** -> Enable **Google Sign-In**.
4. Go to **Firestore Database** -> **Create Database** (Start in production or test mode).
5. In the **Rules** tab, replace the default security rules with the following rules to secure user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profiles
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can access only their own campaigns
    match /projects/{projectId} {
      allow read, write: if request.auth != null && resource == null || resource.data.userId == request.auth.uid;
    }
    
    // Users can access only their own collected business leads
    match /businesses/{businessId} {
      allow read, write: if request.auth != null && resource == null || resource.data.userId == request.auth.uid;
    }
    
    // Users can read/write their own scrape logs
    match /history/{historyId} {
      allow read, write: if request.auth != null && resource == null || resource.data.userId == request.auth.uid;
    }
    
    // Users can read/write their own exports logs
    match /exports/{exportId} {
      allow read, write: if request.auth != null && resource == null || resource.data.userId == request.auth.uid;
    }
    
    // Users can access their own configurations
    match /settings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Chrome Extension Setup

1. Open Google Chrome and navigate to the extensions page by entering `chrome://extensions/` in the URL bar.
2. In the top-right corner, toggle the **"Developer mode"** switch on.
3. Click the **"Load unpacked"** button in the top-left corner.
4. Select the `extension/` folder located inside the LeadFlow directory.
5. The **LeadFlow Agent** will now appear inside your Chrome extension taskbar.

---

## Running the Scraper Scripts

### Option A: Using the Companion Chrome Extension (Recommended)
1. Boot up the Dashboard locally:
   ```bash
   cd dashboard
   npm run dev
   ```
2. Navigate to `http://localhost:3000` and click **"Continue with Google"** to log in.
3. Open a new Chrome tab and go to [Google Maps](https://www.google.com/maps).
4. Click on the LeadFlow Extension icon. The popup will automatically recognize your dashboard authentication session.
5. Select a project folder, enter your target **Keyword** and **Location** (e.g. `Gyms`, `Los Angeles`), and hit **Start Scrape**.
6. The extension will automatically scroll, open cards, and compile your leads directory in real-time.

### Option B: Headless Puppeteer Automation (Server/CLI Runs)
If you want to run the automated collection headlessly from a terminal:
1. Export the authenticated user details from the dashboard console as environment variables:
   ```bash
   export AUTH_TOKEN="YOUR_FIREBASE_ID_TOKEN"
   export KEYWORD="Dentists"
   export LOCATION="Chicago"
   export MAX_RESULTS="20"
   export PROJECT_ID="YOUR_PROJECT_ID_FIRESTORE_KEY"
   ```
2. Run the automated process script:
   ```bash
   cd automation
   npm start
   ```

---

## Deployment Guide

### Next.js Dashboard
The Next.js Dashboard can be deployed directly to Vercel, Netlify, or a VPS:
- Ensure the environment variables for Firebase match the configuration in [firebase.ts](file:///Users/bhushanpadghan/Desktop/agent/pixel%20leadflow/dashboard/src/lib/firebase.ts).
- For staging or production URLs, adjust the extension host permissions in `manifest.json` from `http://localhost/*` to `https://your-domain.vercel.app/*` to enable authentication cookie synchronization.

### Puppeteer Automation Server
If running Puppeteer on a cloud container (e.g., Render, Railway, Heroku, Docker VPS):
- Make sure to use a Buildpack for Puppeteer that installs the required chrome binaries (e.g. `puppeteer/puppeteer`).
- Add the `--no-sandbox` flag to the launch arguments inside `scraper.ts` to prevent container access privileges conflicts.
