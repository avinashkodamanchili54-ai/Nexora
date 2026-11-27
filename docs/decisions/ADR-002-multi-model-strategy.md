# ADR-002: Separate Multi-Model Training Strategy (Rice, PlantDoc, PlantVillage)

## Status
Accepted

## Date
2026-11-27

## Context
We have three datasets with incompatible class taxonomies and image domains:
- **PlantVillage** (~54,305 images, 38 classes, controlled backgrounds)
- **PlantDoc** (~2,573 images, 28 classes, noisy real-world field backgrounds)
- **Rice Leaf Disease (UCI)** (120 images, 3 paddy classes)

Merging them directly would introduce label conflicts and domain imbalance.

## Decision
Train three independent MobileNetV2 classifiers (`rice_model.keras`, `plantdoc_model.keras`, `plantvillage_model.keras`) with shared `class_mapping.json`, and route inference at runtime via `crop_mode` (`paddy`, `general`, `field`). Keep recommendations decoupled in `RecommendationService` so pesticide/treatment advice always comes from a verified knowledge base rather than raw classifier labels.

## Consequences
- Clean separation between paddy specialist, general 38-class crops, and real-world field photos.
- Transparent per-dataset evaluation metrics (`results/evaluation_summary.json`).
- Safe, auditable treatment guidance independent of softmax outputs.
