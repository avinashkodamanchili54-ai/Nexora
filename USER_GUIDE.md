# KRISHI SAKHI AI — Complete User Guide 🌾📖

Welcome to **Krishi Sakhi AI** (कृषि सखी / కృషి సఖి / கிருஷி சகி / ಕೃಷಿ ಸಖಿ), your intelligent farming companion designed for predictive crop health, root-cause investigation, and localized agricultural advisory.

This guide walks you through every feature and module of the platform step-by-step.

---

## 📑 Table of Contents
1. [Getting Started & Setup](#1-getting-started--setup)
2. [Language Selection & Multilingual Support](#2-language-selection--multilingual-support)
3. [Farmer Profile & Authentication](#3-farmer-profile--authentication)
4. [Module 1: Farm & Satellite Field Selector](#4-module-1-farm--satellite-field-selector)
5. [Module 2: Field Risk Radar & Weather Forecasting](#5-module-2-field-risk-radar--weather-forecasting)
6. [Module 3: Smart Multi-Frame Leaf Scanner](#6-module-3-smart-multi-frame-leaf-scanner)
7. [Module 4: RootCause Investigation AI](#7-module-4-rootcause-investigation-ai)
8. [Module 5: Krishi Sakhi Voice & Chatbot (with Location & Climate Context)](#8-module-5-krishi-sakhi-voice--chatbot)
9. [Module 6: Crop Health History & Record Keeping](#9-module-6-crop-health-history--record-keeping)
10. [Companion Planting & Permapeople Ecological Guidance](#10-companion-planting--permapeople-ecological-guidance)
11. [Emergency Helplines & KVK Support](#11-emergency-helplines--kvk-support)
12. [Frequently Asked Questions (FAQ)](#12-frequently-asked-questions-faq)

---

## 1. Getting Started & Setup

### Accessing the Platform
* **Web Portal:** Access via `http://localhost:5173` on desktop or mobile browser.
* **Backend API:** Available at `http://localhost:8000/docs` (Swagger Interactive API).

---

## 2. Language Selection & Multilingual Support 🌐

Krishi Sakhi AI supports **5 languages** across the entire UI and conversational AI:
* **English** (`en`)
* **తెలుగు (Telugu)** (`te`)
* **हिन्दी (Hindi)** (`hi`)
* **தமிழ் (Tamil)** (`ta`)
* **ಕನ್ನಡ (Kannada)** (`kn`)

### How to Switch Language:
1. Locate the language pill group at the top right of the navigation header (`EN`, `తె`, `हि`, `த`, `ಕ`).
2. Click on your preferred regional language.
3. The entire interface, navigation tabs, labels, forms, and alerts update instantly.
4. Your choice is saved automatically in your browser profile so it persists on future visits.

---

## 3. Farmer Profile & Authentication 👤

1. **Registration / Login:**
   - Enter your mobile number / email and set a secure password.
   - Enter your full name, preferred regional language, and primary crop.
2. **Farm Profile Screen:**
   - Located under **Profile** in the top navigation.
   - Saves your farm location, GPS coordinates, current crop stage, and soil attributes.
   - Integrates with Supabase / secure local storage for persistent profile management.

---

## 4. Module 1: Farm & Satellite Field Selector 🛰️

1. Navigate to **"1. Farm & Satellite"** or open it directly from the Profile screen.
2. **Search Location or GPS:**
   - Click **"Use My Location"** to automatically position the satellite view over your current field coordinates.
   - Or type your village/district name in the location search bar.
3. **Draw Field Boundary:**
   - Use the Leaflet-powered satellite map (Esri World Imagery).
   - Draw your field polygon to calculate exact acreage.
4. **Save Farm Field:**
   - Click **"Save Farm & Update Risk Radar"**.
   - Your coordinates and field geometry are stored to feed real-time weather and satellite indices into the Risk Radar.

---

## 5. Module 2: Field Risk Radar & Weather Forecasting 🌦️

1. Navigate to **"2. Risk Radar"**.
2. **Current Climate & Forecast:**
   - View temperature, humidity, rainfall probability, and wind speed pulled live from Open-Meteo.
   - Click the **"Weather & Climate Forecast"** button to load the full 7-day outlook, daily rain timing estimates, and climate summary.
3. **AI Climate & Risk Summary:**
   - The embedded Gemini AI evaluates weekly weather risks (e.g., fungal spore germination conditions from high humidity or pest surge post-rainfall).
4. **5-Day Safe Spray Window:**
   - Evaluates whether chemical or bio-spray is safe today or if rain/wind will wash it away.
5. **Crop-Stage Threat Breakdown:**
   - Evaluates threats specific to your crop's current stage (e.g., Vegetative, Flowering, Grain Fill).

---

## 6. Module 3: Smart Multi-Frame Leaf Scanner 📸

1. Navigate to **"3. Leaf Scanner"**.
2. **Upload Photos:**
   - Upload 1 to 3 leaf photos (top view, close-up lesion, underside).
3. **Smart Quality Verification:**
   - The system checks lighting, blurriness, resolution, and verifies leaf presence.
4. **Multi-Model Disease Diagnosis:**
   - Employs deep-learning classifiers (Rice UCI, PlantDoc Field, and PlantVillage 38-class models).
   - Displays top 3 matching diagnoses with full probability percentages (e.g., *95% Corn Common Rust, 3% Gray Leaf Spot, 2% Northern Leaf Blight* summing to 100%).
   - Generates an AI Lesion Attention Heatmap highlighting infection zones.
5. **Interactive Diagnostic Interview:**
   - If symptoms are ambiguous, an interactive LLM questionnaire asks distinguishing questions (e.g., *"Are pustules powdery and reddish-brown, or water-soaked lesions?"*) to help pinpoint the exact condition.
   - Updates the farm disease record with the confirmed diagnosis and updates the Risk Radar.

---

## 7. Module 4: RootCause Investigation AI 🔍

1. Navigate to **"4. RootCause AI"**.
2. **Differential Diagnosis:**
   - Compares 3 hypotheses simultaneously:
     * **Pathogen Disease** (fungal, bacterial, viral)
     * **Nutrient Deficiency** (Nitrogen, Potassium, Zinc, Iron, etc.)
     * **Pest / Environmental Stress** (Mites, thrips, salinity, waterlogging)
3. **Evidence Weighting:**
   - Weighs supporting vs. conflicting evidence.
   - Recommends IPM (Integrated Pest Management) steps and explicit **"Do Not Do"** warnings to prevent toxic, wasteful pesticide tank-mixes.

---

## 8. Module 5: Krishi Sakhi Voice & Chatbot 💬🎙️

1. Navigate to **"5. Sakhi Chat"**.
2. **Automatic Session Initialization:**
   - At the beginning of each chat session, your GPS location, current weather, and 7-day climate outlook are automatically loaded into the AI context.
3. **Multilingual Voice & Text:**
   - Type in Telugu, Hindi, Tamil, Kannada, or English.
   - Or click the **Microphone** icon to speak directly using regional voice recognition.
   - Listen to spoken audio responses powered by natural neural voice models (`edge-tts`).
4. **Image Sharing in Chat:**
   - Attach leaf or field photos directly in the chat for immediate AI visual review and diagnosis.

---

## 9. Module 6: Crop Health History & Record Keeping 📊

1. Navigate to **"6. Crop History"**.
2. **Historical Timeline:**
   - Review all past scans, dates, GPS locations, and diagnosed diseases.
   - Compare before-and-after recovery photos.
3. **Expert Verification:**
   - Track KVK agricultural officer validation notes and follow-up schedules.

---

## 10. Companion Planting & Permapeople Ecological Guidance 🌱

1. **Beneficial vs. Harmful Plant Insights:**
   - Integrated with the **Permapeople** open plant database via `/permapeople/classify`.
   - Recommends beneficial companion plants that:
     * Repel target pests naturally (e.g., Marigold, Basil, Neem).
     * Fix nitrogen and enrich soil nutrients (e.g., Legumes, Clover).
     * Attract predatory insects to control pest outbreaks.
   - Warns against bad companion plants that share diseases or compete excessively for water and root space.

---

## 11. Emergency Helplines & KVK Support 📞

* **Kisan Call Center (National):** `1800-180-1551` (Toll-Free, 6 AM - 10 PM)
* **Andhra Pradesh / Telangana:** Rythu Bharosa Kendra (RBK) / Rythu Vedika & ANGRAU/PJTSAU KVKs
* **Tamil Nadu:** TNAU Agritech Portal & Uzhavan Helpline
* **Karnataka:** Raitha Samparka Kendra (RSK) & UAS Dharwad/Bangalore

---

## 12. Frequently Asked Questions (FAQ) ❓

**Q: Can I use Krishi Sakhi AI without an internet connection?**  
A: Offline cached modes are supported for viewing past scan records, basic disease symptom cards, and field profiles via `localStorage`. Real-time AI chat, live weather, and scanning require an internet connection.

**Q: How does the AI get my location?**  
A: Location is acquired either via browser HTML5 Geolocation API (when permission is granted) or from your saved farm district in your profile.

**Q: Is chemical advice safe?**  
A: Yes. All chemical suggestions follow verified university/KVK package-of-practices dosages and emphasize organic/cultural IPM methods first. Unsafe tank-mixing is strictly warned against.
