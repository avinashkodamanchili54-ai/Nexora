from typing import Dict

MULTI_CROP_DISEASE_DB: Dict[str, dict] = {
    "tomato_early_blight": {
        "disease_id": "tomato_early_blight",
        "name": "Tomato Early Blight",
        "crop": "Tomato",
        "severity": "High",
        "symptoms": [
            "Dark brown circular spots with concentric 'target-board' rings on older lower leaves",
            "Yellowing halo around lesions leading to premature leaf drop",
        ],
        "causes": [
            "Fungus Alternaria solani",
            "Warm humid weather and overhead irrigation splashing soil onto lower leaves",
        ],
        "organic_controls": [
            "Prune and destroy infected lower leaves; mulch soil to prevent rain splash",
            "Spray Trichoderma viride @ 5 g/L or Neem oil (1500 ppm) @ 3 mL/L",
        ],
        "treatments": [
            "Spray Mancozeb 75% WP @ 2 g/L or Chlorothalonil 75% WP @ 2 g/L at 7-10 day intervals",
        ],
        "do_not_do": [
            "Do NOT use overhead sprinklers in the evening",
            "Do NOT mix multiple copper and sulfur sprays without label guidance",
        ],
        "preventions": [
            "Rotate tomato with non-solanaceous crops (cereals/legumes) for 2-3 years",
            "Stake plants for better airflow",
        ],
    },
    "tomato_late_blight": {
        "disease_id": "tomato_late_blight",
        "name": "Tomato Late Blight",
        "crop": "Tomato",
        "severity": "Critical",
        "symptoms": [
            "Irregular water-soaked greenish-black patches on leaves and stems",
            "White cottony fungal growth on leaf undersides during cool humid mornings",
        ],
        "causes": [
            "Oomycete Phytophthora infestans",
            "Cool, cloudy, wet weather (>85% humidity)",
        ],
        "organic_controls": [
            "Immediately remove and bury severely infected plants to protect neighboring rows",
            "Avoid dense canopy and improve field drainage",
        ],
        "treatments": [
            "Spray Metalaxyl + Mancozeb (Ridomil Gold) @ 2 g/L or Cymoxanil + Mancozeb @ 2 g/L",
        ],
        "do_not_do": [
            "Do NOT wait if cool wet weather persists—Late Blight can destroy a plot in days",
            "Do NOT compost blighted vines near the field",
        ],
        "preventions": [
            "Plant certified disease-free seedlings",
            "Avoid planting near infected potato fields",
        ],
    },
    "tomato_bacterial_spot": {
        "disease_id": "tomato_bacterial_spot",
        "name": "Tomato Bacterial Spot",
        "crop": "Tomato",
        "severity": "High",
        "symptoms": [
            "Small, dark, water-soaked greasy spots on leaves and green fruits",
            "Leaves turn yellow and drop, exposing fruits to sunscald",
        ],
        "causes": [
            "Xanthomonas spp. bacteria spread by wind-driven rain and infected seeds",
        ],
        "organic_controls": [
            "Avoid working in the field when foliage is wet",
            "Remove severely spotted lower leaves",
        ],
        "treatments": [
            "Spray Copper oxychloride 50% WP @ 2.5 g/L + Streptocycline @ 0.1 g/L",
        ],
        "do_not_do": [
            "Do NOT spray standard fungicides—they do not control bacterial spot",
        ],
        "preventions": [
            "Use hot-water or Streptocycline-treated seeds",
            "Follow 2-year crop rotation",
        ],
    },
    "tomato_tomato_yellowleaf_curl_virus": {
        "disease_id": "tomato_tomato_yellowleaf_curl_virus",
        "name": "Tomato Yellow Leaf Curl Virus (TYLCV)",
        "crop": "Tomato",
        "severity": "Critical",
        "symptoms": [
            "Upward curling and cupping of young leaves with yellow margins",
            "Severe stunting and flower drop",
        ],
        "causes": [
            "Begomovirus transmitted by Whitefly (Bemisia tabaci)",
        ],
        "organic_controls": [
            "Rogue out infected plants early and install yellow sticky traps (10/acre)",
            "Spray Neem oil (1500 ppm) @ 3 mL/L to deter whiteflies",
        ],
        "treatments": [
            "Manage whitefly vectors using Imidacloprid 17.8% SL @ 0.3 mL/L or Thiamethoxam 25% WG @ 0.2 g/L",
        ],
        "do_not_do": [
            "Do NOT spray fungicides—TYLCV is a viral disease",
        ],
        "preventions": [
            "Use insect-proof net nurseries and TYLCV-resistant hybrids",
        ],
    },
    "potato_early_blight": {
        "disease_id": "potato_early_blight",
        "name": "Potato Early Blight",
        "crop": "Potato",
        "severity": "Moderate-High",
        "symptoms": [
            "Brown-black lesions with concentric rings on older leaves",
            "Premature defoliation reducing tuber size",
        ],
        "causes": ["Fungus Alternaria solani favored by warm alternating wet/dry weather"],
        "organic_controls": [
            "Maintain adequate nitrogen and potassium nutrition",
            "Spray Trichoderma viride @ 5 g/L preventively",
        ],
        "treatments": [
            "Spray Mancozeb 75% WP @ 2 g/L or Azoxystrobin 23% SC @ 1 mL/L",
        ],
        "do_not_do": ["Do NOT under-fertilize—stressed potato plants suffer worse Early Blight"],
        "preventions": ["Use healthy seed tubers and 3-year crop rotation"],
    },
    "potato_late_blight": {
        "disease_id": "potato_late_blight",
        "name": "Potato Late Blight",
        "crop": "Potato",
        "severity": "Critical",
        "symptoms": [
            "Water-soaked dark lesions on leaf tips/margins with white mold underneath",
            "Rapid stem rot and tuber brown rot",
        ],
        "causes": ["Oomycete Phytophthora infestans in cool, humid, foggy weather"],
        "organic_controls": [
            "Hill up soil around tubers to block spore wash-down",
            "Destroy volunteer potato plants",
        ],
        "treatments": [
            "Spray Cymoxanil + Mancozeb @ 2 g/L or Dimethomorph + Mancozeb @ 2 g/L",
        ],
        "do_not_do": ["Do NOT harvest tubers while blighted foliage is still green and wet"],
        "preventions": ["Plant certified blight-free seed tubers and resistant varieties"],
    },
    "pepper_bell_bacterial_spot": {
        "disease_id": "pepper_bell_bacterial_spot",
        "name": "Chilli / Pepper Bacterial Spot",
        "crop": "Pepper / Chilli",
        "severity": "High",
        "symptoms": [
            "Small water-soaked spots on leaves turning dark brown with yellow halos",
            "Raised corky spots on pods",
        ],
        "causes": ["Xanthomonas campestris pv. vesicatoria spread by rain splash"],
        "organic_controls": ["Avoid overhead watering and prune heavily infected leaves"],
        "treatments": ["Spray Copper hydroxide or Copper oxychloride 50% WP @ 2.5 g/L"],
        "do_not_do": ["Do NOT use fungicides alone for bacterial spot"],
        "preventions": ["Use disease-free seeds and 2-3 year rotation"],
    },
    "corn_maize_common_rust": {
        "disease_id": "corn_maize_common_rust",
        "name": "Maize Common Rust",
        "crop": "Maize / Corn",
        "severity": "Moderate",
        "symptoms": [
            "Small cinnamon-brown powdery pustules on both upper and lower leaf surfaces",
        ],
        "causes": ["Fungus Puccinia sorghi favored by cool, humid nights (16-23 C)"],
        "organic_controls": ["Grow resistant maize hybrids; mild rust rarely needs chemical spray"],
        "treatments": ["Spray Mancozeb 75% WP @ 2 g/L or Propiconazole 25% EC @ 1 mL/L if severe before tasseling"],
        "do_not_do": ["Do NOT spray late after grain-filling is complete"],
        "preventions": ["Select rust-resistant hybrids and avoid late planting"],
    },
    "apple_apple_scab": {
        "disease_id": "apple_apple_scab",
        "name": "Apple Scab",
        "crop": "Apple",
        "severity": "High",
        "symptoms": ["Olive-green to dark velvety spots on leaves and scabby lesions on fruit"],
        "causes": ["Fungus Venturia inaequalis overwintering in fallen leaves"],
        "organic_controls": ["Rake and compost/burn fallen leaves in autumn to break the cycle"],
        "treatments": ["Spray Captan 50% WP @ 2 g/L or Dodine 65% WP @ 1 g/L at green-tip/petal-fall"],
        "do_not_do": ["Do NOT leave infected leaf litter under trees"],
        "preventions": ["Prune canopy for airflow and plant scab-resistant cultivars"],
    },
    "grape_black_rot": {
        "disease_id": "grape_black_rot",
        "name": "Grape Black Rot",
        "crop": "Grape",
        "severity": "High",
        "symptoms": ["Reddish-brown leaf spots with black fruiting bodies; shriveled black 'mummy' berries"],
        "causes": ["Fungus Guignardia bidwellii in warm, wet spring/summer weather"],
        "organic_controls": ["Remove mummified berries and prune canes for sun/air penetration"],
        "treatments": ["Spray Mancozeb 75% WP @ 2 g/L or Myclobutanil 10% WP @ 0.4 g/L"],
        "do_not_do": ["Do NOT leave mummified clusters hanging on vines"],
        "preventions": ["Sanitize vineyard floor and train vines on open trellises"],
    },
}
