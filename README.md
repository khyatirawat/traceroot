# Traceroot

A GitHub repository health dashboard that analyzes any public repo and returns a **0–100 score**, **ranked AI suggestions**, and a **report**.


## Overview

Traceroot evaluates repository health using multiple signals such as activity, issues, documentation, and security patterns. It then generates actionable recommendations using a rule-based AI suggestion engine.

The goal is simple: **turn raw repo data into clear decisions.**


## Quick Start

npm install          # installs deps + builds better-sqlite3
npm run dev          # start dev server

# open http://localhost:3000

## Tech Stack

| Layer     | Technology                                       |
| --------- | ------------------------------------------------ |
| Framework | Next.js 14 (App Router, Server Actions, caching) |
| Database  | better-sqlite3 + drizzle-orm                     |
| Styling   | Tailwind CSS                                     |
| Language  | TypeScript                                       |


## Core Features

### 1. Repository Score (0–100)

The score is calculated using six weighted factors:

* Documentation debt
* Security hotspots
* Stale pull requests
* Activity level
* Issue load
* Bug surface

Score bands:

* **Healthy:** ≥ 75
* **Watchlist:** 50–74
* **At Risk:** < 50


### 2. AI Suggestions Engine

Located in `lib/ai-suggest.ts`.

Analyzes both:

* Issue labels
* Title keywords

Categories include:

```
security, bugs, performance, docs, tests,
dependencies, breaking changes,
error handling, accessibility, types
```

Each suggestion contains:

* **Severity** — based on signal strength and recency
* **Confidence** — capped scoring model
* **Why** — explanation of detected signals
* **Action** — concrete fix guidance
* **Snippet** — example implementation
