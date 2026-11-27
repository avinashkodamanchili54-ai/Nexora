# ADR-001: Local-First Storage and Inference Architecture

## Status
Accepted

## Date
2026-11-27

## Context
During the hackathon development phase, we need rapid iteration without incurring AWS cloud costs or managing cloud credentials while ML training and UI development are underway.

## Decision
Use local filesystem storage (`backend/uploads/`, `backend/local_data/*.json`), FastAPI, and local `.keras` model weights during development, behind clean service boundaries (`MLService`, `RecommendationService`, `TranslationService`, `WeatherService`) so AWS S3, DynamoDB, Cognito, and Lightsail can replace local adapters seamlessly at deployment.

## Consequences
- Zero cloud spend during development and testing.
- Full offline reproducibility via `pytest` and Vite dev server.
- Minimal code changes required when migrating `UPLOAD_DIR` -> S3 and `DATA_DIR` -> DynamoDB.
