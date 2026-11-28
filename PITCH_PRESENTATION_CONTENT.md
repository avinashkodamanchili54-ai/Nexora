# KRISHI SAKHI AI (NEXORA) — Pitch Presentation Content Guide 🌾📊

This document provides the exact, slide-by-slide text, bullet points, data references, diagrams, and speaking notes tailored to the 6 presentation template slides.

---

## Slide 1: PROBLEM STATEMENT

### 🎯 Slide Instructions Covered:
* Briefly describe understanding of the selected problem statement
* Target customers
* Size of the problem
* Impact of the problem
* References for data (Govt/industry body websites, think tanks, newspaper reports)

---

### 📝 Slide Content (What to put on the slide):

#### 1. Problem Understanding:
* Smallholder farmers face catastrophic crop loss from pests and diseases due to lack of timely, trustworthy advisory.
* **The "Blind Spraying" Trap:** Over-reliance on local chemical pesticide sellers leads to incorrect diagnoses, unscientific chemical mixtures (cocktails), and spraying when unnecessary or during rain.
* **Language & Usability Barrier:** Modern agritech apps fail on ground due to complex English/text-heavy interfaces, lack of voice interaction, and ignoring local agro-climatic conditions.

#### 2. Target Customers:
* **Primary:** 120+ Million Small & Marginal Farmers in India (owning < 2 hectares).
* **Secondary:** Farmer Producer Organizations (FPOs), Village Agriculture Assistants (Rythu Bharosa Kendras / Rythu Vedikas), and KVK field extension workers.

#### 3. Size & Economic Scale of Problem:
* **₹1.48 Lakh Crore (\$18–20 Billion USD)** lost annually in India alone due to pest attacks and crop diseases.
* **15% to 25%** average annual crop yield loss across major staples (Rice, Corn, Wheat, Vegetables).

#### 4. Real-World Impact:
* **Farmer Distress:** Severe debt cycles from wasted expenditure on expensive chemical fungicides and insecticides.
* **Soil & Health Crisis:** Ground water toxicity, pesticide resistance, and destruction of beneficial soil microbiomes.
* **Food Security:** Volatility in market supply and export rejections due to excessive chemical residue levels.

#### 5. Data References & Citations:
* **ICAR (Indian Council of Agricultural Research):** National crop loss assessments due to biotic stresses.
* **Ministry of Agriculture & Farmers Welfare, GoI:** Annual Report on Plant Protection, Quarantine, and Storage.
* **FAO (Food and Agriculture Organization):** Global plant disease and pest surveillance estimates (up to 40% global crop loss).
* **FICCI - Crop Protection Industry Report:** Economic impact of spurious and unverified chemical formulations in rural markets.

---

## Slide 2: COMPETITOR ANALYSIS

### 🎯 Slide Instructions Covered:
* Existing solutions already available; gaps and drawbacks identified
* References from existing solutions website

---

### 📝 Slide Content (What to put on the slide):

#### 1. Existing Market Solutions & Gaps:

| Competitor / Existing Solution | What They Offer | Critical Gaps & Drawbacks |
| :--- | :--- | :--- |
| **Plantix** *(PEAT GmbH)* | Image-based single-leaf disease identification | • Single blind prediction label without evidence explanation.<br>• No real-time satellite field boundary & farm GPS tracking.<br>• Heavy commercial bias pushing partner pesticide brands.<br>• Lacks dynamic clarifying questions when symptoms overlap. |
| **AgroStar / DeHaat** | Agritech e-commerce & general advisory | • Primarily an e-commerce marketplace incentivized to sell input chemicals.<br>• Generic advisory rather than automated multi-angle computer vision.<br>• Limited offline capabilities and no RootCause differential diagnostics. |
| **Kisan Call Center (1800-180-1551)** | Toll-free govt voice telephone support | • High wait times, cannot see leaf photo visually.<br>• Purely verbal, dependent on farmer accurately describing lesions over a call. |
| **Generic LLMs (ChatGPT / WhatsApp bots)** | Text/Audio QA | • Hallucinates pesticide dosages.<br>• No verified safety guardrails or IPM (Integrated Pest Management) protocols.<br>• No computer vision or foliage quality verification. |

#### 2. Key Industry Drawbacks Identified (The Unsolved Gaps):
1. **"Single-Label Hallucination":** Existing AI models force an arbitrary prediction (e.g., claiming 99% early blight) even if lighting is poor or symptoms resemble nitrogen burn.
2. **Missing "Root Cause" Differentiation:** Failure to distinguish between pathogen disease, nutritional deficiency, and pest damage that look identical to a single camera shot.
3. **No Spray Safety Windows:** Traditional apps tell farmers what to spray, but not *when* (e.g., warning that rain in 2 hours will wash away a ₹1,200 fungicide).
4. **No Ecological Companion Guidance:** Existing tools ignore natural companion plants (good plants vs. bad plants) for biological pest deterrence.

#### 3. References:
* *Plantix.net* (Crop diagnostic app features and limitations)
* *AgroStar.in* & *DeHaat.co* (Input retail and advisory models)
* *ICAR Kisan Portal & KVK network analysis*

---

## Slide 3: POTENTIAL SOLUTION

### 🎯 Slide Instructions Covered:
* Explain proposed solution and how it solves the stated problem
* Highlight the main idea or key feature of solution
* Unique features compared to existing solutions, USP (Unique Selling Proposition)

---

### 📝 Slide Content (What to put on the slide):

#### 1. Proposed Solution: **KRISHI SAKHI AI (NEXORA)**
An uncertainty-aware, voice-first, multilingual crop health and predictive intelligence ecosystem that protects crops from pre-sowing to post-harvest. It bridges early climate risk prediction, multi-frame computer vision leaf scanning, root-cause differential diagnosis, and regional language guidance.

#### 2. Main Idea & Core Workflow:
* **Predictive Risk Radar:** Connects live micro-climate forecasts (Open-Meteo) with crop growth stages to issue early alerts before diseases strike.
* **Smart Quality-Gated Scanner:** Multi-frame inspection with automatic blur/lighting verification and multi-model consensus (MobileNetV2 across Rice UCI, PlantDoc Field, and PlantVillage).
* **RootCause AI Engine:** Investigates whether the issue is a Pathogen, Nutrient deficiency, or Pest, backed by interactive farmer interview questions.
* **Regional Voice Assistant:** Two-way voice and chat in Telugu, Hindi, Tamil, Kannada, and English with automatic weather and GPS location injection.

#### 3. Unique Selling Propositions (USPs):
* ⭐ **Zero-Seller Bias (Pure IPM Guardrails):** Recommends biological and organic controls first, verified university dosages second, and issues strict `Do NOT Do` alerts against dangerous pesticide cocktails.
* ⭐ **Differential Diagnosis (Hypothesis vs. Evidence):** We never guess a single blind label—we show top probabilities, explain supporting vs. conflicting evidence, and confirm via farmer interactive questions.
* ⭐ **Companion Planting Intelligence:** Integrates ecological data (Permapeople API) to suggest "good plants" that repel pests and fix nutrients vs. "bad competitor plants".
* ⭐ **5-Day Safe Spray Window:** Prevents wasted farmer capital by cross-referencing rainfall, wind speed, and humidity before spraying.
* ⭐ **Zero-Cost Accessibility:** Built on lightweight MobileNetV2, free satellite imagery, Open-Meteo, edge-tts, and browser Web Speech—making it accessible on any smartphone.

---

## Slide 4: TECHNICAL DETAILS

### 🎯 Slide Instructions Covered:
* Software Solutions:
  * Flow diagram for both user side and technical side
  * Front end images
  * Solution architecture including technical tools utilized
  * Data sources for ML models
  * Algorithm of ML models

---

### 📝 Slide Content (What to put on the slide):

#### 1. Solution Architecture & Technical Tools Utilized:
* **Frontend:** React 19, Vite, Tailwind/Modern CSS Design System, Leaflet.js (Esri Satellite & OpenStreetMap tiles), `react-i18next` (Full UI localization in 5 Indian languages).
* **Backend API:** Python 3.14, FastAPI (Async high-performance REST endpoints), Pydantic v2 data contracts, Uvicorn ASGI server.
* **Computer Vision & ML:** TensorFlow / Keras, MobileNetV2 (Transfer learning), OpenCV / Pillow image quality verification (Laplacian variance for blur, luminance histogram for exposure).
* **LLM & Speech AI:** Google Gemini 2.5 Flash / Flash-Lite API (multimodal reasoning, follow-up interview questions, STT audio parsing), `edge-tts` (Microsoft Neural Regional TTS voices).
* **Climate & Geo APIs:** Open-Meteo Geocoding & Weather Forecast API (free real-time agro-meteorology), Permapeople REST API (companion planting).
* **Persistence:** Supabase Cloud PostgreSQL / Local JSON storage (`local_data/`, `uploads/`).

#### 2. Data Sources for ML Models:
1. **UCI Rice Leaf Dataset:** Real-world paddy disease samples (Bacterial Leaf Blight, Brown Spot, Leaf Smut).
2. **PlantDoc (Field Dataset):** In-field unconstrained photos taken under natural sunlight, varying backgrounds, and multi-leaf clutter.
3. **PlantVillage Dataset:** 54,000+ images spanning 38 crop-disease classes across 14 crops.

#### 3. ML Model Algorithm & Transfer Learning:
* **Architecture:** MobileNetV2 with depthwise separable convolutions (3.5M parameters, high efficiency for mobile edge deployment).
* **Training Pipeline:**
  * Pretrained on ImageNet.
  * Image Augmentation: Random rotations, zooms, horizontal/vertical flips, brightness adjustments to handle real field conditions.
  * Custom Classification Head: GlobalAveragePooling2D → Dropout(0.3) → Dense(128, ReLU) → Dense(Num_Classes, Softmax).
  * Quality Gating: Laplacian blur score check ($>100$) + green foliage presence check ($>15\%$ HSV green mask) before inference.
* **Explainability:** AI Lesion Attention Heatmap highlighting symptomatic pixels for farmer verification.

#### 4. Flow Diagram: User Side & Technical Side:

```
[User Side]
Farmer Opens App ➔ Selects Language (TE/HI/TA/KN/EN) ➔ Marks Farm Boundary on Satellite 
➔ Checks Risk Radar & Spray Window ➔ Takes Leaf Photo ➔ SmartScan Verifies Quality 
➔ Views Top 3 Diagnoses (100% total) ➔ Answers 2 LLM Follow-up Qs ➔ Gets Safe Organic & KVK Dosage ➔ Listens to Audio Guidance

[Technical Side]
Browser (React) ➔ REST Request ➔ FastAPI Gateway 
  ├── Geo/Weather Service ➔ Open-Meteo API ➔ Risk Probability Model
  ├── Image Processing ➔ Foliage & Laplacian Check ➔ Pass/Reject
  ├── Deep Learning ➔ MobileNetV2 Multi-Model Inference ➔ Top Probabilities
  ├── RootCause Engine ➔ Differential Rules + Gemini LLM Reasoning
  ├── Ecological API ➔ Permapeople Companion DB (Good vs. Bad Plants)
  └── Voice Synthesis ➔ edge-tts Regional Audio Stream ➔ Audio Playback
```

*(Note for Slide: Insert screenshots of the App: 1. Farm Satellite Map, 2. Field Risk Radar with 5-day spray window, 3. Leaf Scanner result with Heatmap, 4. Krishi Sakhi Voice Chat panel).*

---

## Slide 5: REVENUE MODEL & GO-TO-MARKET

### 🎯 Slide Instructions Covered:
* Business model, platform, channel, or approach to launch and grow
* Describe plan to reach target users or customers

---

### 📝 Slide Content (What to put on the slide):

#### 1. Business & Revenue Model (B2B2C & Freemium):
* **Core Farmer Tier (100% Free Forever):** 
  * Basic leaf scanning, Risk Radar, open voice advisory, and regional helplines remain free for smallholder farmers.
* **B2G (Government & Extension Services):**
  * Institutional dashboard licensing for State Agriculture Departments (e.g., Rythu Bharosa Kendras, Krishi Vigyan Kendras).
  * Real-time regional pest/disease outbreak heatmaps and geospatial surveillance.
* **B2B (FPOs, Agribusinesses & Crop Insurers):**
  * **FPO Fleet Management:** Farm cluster health monitoring and collective harvest quality tracking.
  * **Crop Insurance Verification:** Immutable before-and-after photo history and satellite coordinates to expedite claim assessments and reduce fraud.
  * **Input Companies & Seed Breeders:** Anonymized epidemiological crop health trend analytics (strictly no predatory pesticide advertising).

#### 2. Go-To-Market (GTM) & Distribution Channels:
* **Channel 1: Village Agriculture Assistants & KVK Hubs:**
  * Partner with Krishi Vigyan Kendras (KVKs) and local agriculture university extension officers for physical field demonstrations.
* **Channel 2: FPO & Primary Agricultural Credit Societies (PACS):**
  * Onboard Farmer Producer Organizations with group training sessions; each FPO lead brings 500–2,000 connected farmers.
* **Channel 3: WhatsApp & Regional Voice Micro-Campaigns:**
  * Zero-friction onboarding via voice clips in Telugu, Hindi, Tamil, and Kannada explaining local pest warnings and sharing direct app links.
* **Channel 4: Agritech Rural Kiosks:**
  * Deployment at rural input kiosks and CSCs (Common Service Centers) for assisted digital scanning.

---

## Slide 6: FUTURE PLAN & MILESTONES

### 🎯 Slide Instructions Covered:
* Timeline and milestones for the next stages of development and launch
* 4 distinct phased milestones (01, 02, 03, 04)

---

### 📝 Slide Content (What to put on the slide):

```
       01                   02                   03                   04
[PILOT & ACCURACY]   [EDGE OFFLINE & IOT]    [FPO PLATFORM]    [NATIONAL SCALE-UP]
     Months 1-3           Months 4-6           Months 7-9          Months 10-12
```

#### Milestone 01 (Months 1–3): Field Pilot & Model Ground-Truthing
* Deploy pilot across 5 districts in Andhra Pradesh & Telangana (focus on Paddy, Cotton, Corn, Chilli).
* Validate MobileNetV2 accuracy against ground diagnoses from KVK agricultural scientists.
* Optimize regional voice accuracy for rural Telugu and Hindi dialects.

#### Milestone 02 (Months 4–6): On-Device Edge AI & Drone/Soil Sensor Integration
* Quantize models to TensorFlow Lite (TFLite) for 100% offline scanning on budget Android devices with zero internet.
* Integrate multispectral drone imagery analysis and low-cost soil moisture/NPK IoT telemetry into the Risk Radar.

#### Milestone 03 (Months 7–9): Enterprise FPO & Outbreak Geospatial Engine
* Launch the B2B FPO Management Dashboard: multi-farm satellite monitoring, collective chemical requirement planner, and automated disease outbreak geo-fencing.
* Integrate direct one-click video consultation with certified agronomists and KVK experts.

#### Milestone 04 (Months 10–12): Multi-State Pan-India Expansion & Export Traceability
* Expand language models to 12 Indian regional languages (Marathi, Bengali, Punjabi, Gujarati, Odia, etc.).
* Integrate farm-to-fork pesticide residue compliance tracking to support organic farming certification and agricultural exports.

---

## 💡 Quick Presentation Tips for the Speaker:
1. **Hook the Judges Early (Slide 1):** Mention that farmers spend up to 20% of their total crop investment on wrong chemicals simply because they take advice from shopkeepers who want to sell inventory.
2. **Emphasize What Makes You Different (Slide 2 & 3):** Stress that Krishi Sakhi AI doesn't just give an AI label; it explains *why*, considers *nutrients vs. disease*, warns against harmful mixtures, and speaks in their mother tongue.
3. **Showcase Real Engineering (Slide 4):** Point to the multi-dataset consensus, Laplacian blur gate, and Open-Meteo microclimate integration.
4. **Be Confident on Scalability (Slide 5 & 6):** Reiterate the B2B2C model—serving small farmers for free while monetizing institutional insights and crop surveillance for government bodies and FPOs.
