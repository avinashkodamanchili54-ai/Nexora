from typing import Dict
from app.data.multi_crop_db import MULTI_CROP_DISEASE_DB

DISEASE_DB: Dict[str, dict] = {
    "bacterial_leaf_blight": {
        "disease_id": "bacterial_leaf_blight",
        "name": "Bacterial Leaf Blight",
        "crop": "Paddy (Rice)",
        "severity": "High",
        "symptoms": [
            "Water-soaked yellowish stripes on leaf margins",
            "Leaves turn yellow-white and dry up from the tip downward",
            "Milky or opaque bacterial ooze on young lesions in the morning",
        ],
        "causes": [
            "Bacterium Xanthomonas oryzae pv. oryzae",
            "High humidity, heavy rain, and strong winds",
            "Excessive nitrogen fertilizer application",
        ],
        "organic_controls": [
            "Drain standing water from the field for 3-4 days to halt bacterial spread",
            "Spray fresh cow dung slurry (20 g/L filtered) or Pseudomonas fluorescens @ 10 g/L as preventive bio-control",
        ],
        "treatments": [
            "Apply copper-based bactericide ONLY if spread >10%: Copper oxychloride 50% WP @ 2.5 g/L + Streptocycline @ 0.1 g/L",
            "Avoid spraying during strong winds or rain",
        ],
        "do_not_do": [
            "Do NOT apply extra urea/nitrogen fertilizer—it accelerates bacterial blight",
            "Do NOT use fungal sprays or unverified cocktail mixtures from local shops; fungicides do not kill bacteria",
        ],
        "preventions": [
            "Use resistant paddy varieties (e.g., Improved Samba Mahsuri)",
            "Apply balanced nitrogen fertilizer in split doses",
            "Treat seeds with Streptocycline before sowing",
        ],
    },
    "brown_spot": {
        "disease_id": "brown_spot",
        "name": "Brown Spot",
        "crop": "Paddy (Rice)",
        "severity": "Moderate",
        "symptoms": [
            "Oval or circular brown spots with a yellow halo on leaves",
            "Spots may coalesce and cause leaves to wither",
            "Dark brown discoloration on rice grains",
        ],
        "causes": [
            "Fungus Bipolaris oryzae",
            "Nutrient-deficient or poorly drained soils",
            "High humidity and warm temperatures (25-30 C)",
        ],
        "organic_controls": [
            "Correct potassium/zinc soil deficiency first—Brown Spot is strongly linked to poor soil nutrition",
            "Spray Trichoderma viride or Pseudomonas fluorescens @ 10 g/L at early symptom stage",
        ],
        "treatments": [
            "Spray Mancozeb 75% WP @ 2 g/L or Carbendazim 50% WP @ 1 g/L only if spots cover >5-10% leaf area",
            "Correct soil potassium and silicon deficiencies",
        ],
        "do_not_do": [
            "Do NOT spray antibiotics or insecticides for Brown Spot (it is fungal + nutritional)",
            "Do NOT exceed recommended label dosage",
        ],
        "preventions": [
            "Use certified, disease-free seeds",
            "Apply balanced NPK fertilizers",
            "Maintain proper field drainage",
        ],
    },
    "leaf_smut": {
        "disease_id": "leaf_smut",
        "name": "Leaf Smut",
        "crop": "Paddy (Rice)",
        "severity": "Low-Moderate",
        "symptoms": [
            "Small, slightly raised black linear spots on both sides of leaves",
            "Leaves may turn yellow and senesce prematurely in severe cases",
        ],
        "causes": [
            "Fungus Entyloma oryzae",
            "High nitrogen levels and late-season humidity",
        ],
        "organic_controls": [
            "Remove heavily spotted lower leaves manually and maintain clean bunds",
            "Skip chemical spraying in mild cases—Leaf Smut rarely reduces yield on its own",
        ],
        "treatments": [
            "Usually minor; apply Propiconazole 25% EC @ 1 mL/L ONLY if widespread across upper flag leaves",
        ],
        "do_not_do": [
            "Do NOT buy expensive broad-spectrum chemical cocktails for minor Leaf Smut",
        ],
        "preventions": [
            "Avoid excessive nitrogen application",
            "Practice clean field sanitation and compost infected stubble after harvest",
        ],
    },
    "blast": {
        "disease_id": "blast",
        "name": "Rice Blast",
        "crop": "Paddy (Rice)",
        "severity": "Critical",
        "symptoms": [
            "Diamond-shaped or spindle-shaped lesions with gray centers and brown margins",
            "Neck rot causing panicles to break or turn white (chaffy grains)",
            "Rapid drying of foliage in severe infections",
        ],
        "causes": [
            "Fungus Magnaporthe oryzae",
            "Cool nights, high humidity, and prolonged leaf wetness",
            "Excessive nitrogen fertilization",
        ],
        "organic_controls": [
            "Maintain shallow flooding (avoid drying/cracking stress) and stop nitrogen top-dressing immediately",
            "Preventive spray of Pseudomonas fluorescens @ 10 g/L during tillering",
        ],
        "treatments": [
            "Spray Tricyclazole 75% WP @ 0.6 g/L or Isoprothiolane 40% EC @ 1.5 mL/L",
            "Repeat spray after 10-12 days ONLY if active lesions persist",
        ],
        "do_not_do": [
            "Do NOT spray in strong midday heat or before heavy rain",
            "Do NOT mix multiple unverified fungicides together",
        ],
        "preventions": [
            "Plant blast-resistant rice varieties",
            "Avoid dense planting and excessive nitrogen",
            "Remove infected crop residues after harvest",
        ],
    },
    "tungro": {
        "disease_id": "tungro",
        "name": "Rice Tungro Virus",
        "crop": "Paddy (Rice)",
        "severity": "High",
        "symptoms": [
            "Yellow-orange discoloration starting from leaf tips",
            "Stunted plant growth and reduced tillering",
            "Delayed flowering and incomplete panicle exertion",
        ],
        "causes": [
            "Rice tungro bacilliform and spherical viruses",
            "Transmitted by Green Leafhopper (Nephotettix virescens)",
        ],
        "organic_controls": [
            "Uproot and bury infected plants early before leafhoppers spread the virus",
            "Install yellow sticky traps (8-10/acre) to monitor Green Leafhoppers",
        ],
        "treatments": [
            "Control green leafhopper vectors using Imidacloprid 17.8% SL @ 0.3 mL/L only when hopper threshold is exceeded",
        ],
        "do_not_do": [
            "Do NOT spray fungicides—Tungro is a viral disease and fungicides have zero effect",
        ],
        "preventions": [
            "Practice synchronous planting across neighboring fields",
            "Use tungro-resistant varieties",
            "Keep bunds free of grassy weeds",
        ],
    },
    "normal": {
        "disease_id": "normal",
        "name": "Healthy Paddy Leaf",
        "crop": "Paddy (Rice)",
        "severity": "None",
        "symptoms": [
            "Uniform vibrant green leaf blade with no lesions or spots",
            "Healthy tillering and upright leaf posture",
        ],
        "causes": ["Optimal water, nutrient, and pest management"],
        "organic_controls": ["Continue balanced organic/compost nutrition and natural predator conservation"],
        "treatments": ["No chemical treatment required"],
        "do_not_do": ["Do NOT apply preventive chemical pesticides on a healthy crop"],
        "preventions": [
            "Continue regular field monitoring twice a week",
            "Maintain balanced irrigation and fertilization",
        ],
    },
    **MULTI_CROP_DISEASE_DB,
}
