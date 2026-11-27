# ADR-003: Free Public Maps (Leaflet + Esri Satellite) and Weather (Open-Meteo)

## Status
Accepted

## Date
2026-11-27

## Context
KRISHI SAKHI AI requires interactive satellite field boundary selection (with acreage calculation) and real-time district weather data (temperature, humidity, rainfall, wind) for the Field Risk Radar without incurring AWS Location Service charges or requiring API keys during hackathon evaluation.

## Decision
1. Use **Leaflet** with **Esri World Imagery** satellite tiles (`server.arcgisonline.com`) and **OpenStreetMap** toggle for interactive field polygon drawing and acreage calculation.
2. Use **Open-Meteo** Geocoding + Forecast APIs (`api.open-meteo.com`) for live weather and crop-stage risk prediction, with deterministic climatology fallback if offline.

## Consequences
- Zero cloud cost and zero API key configuration required.
- Immediate satellite field boundary drawing and live weather risk scoring anywhere in India.
