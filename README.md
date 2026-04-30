# 🚀 NexStep — Neural Symbolic Math Platform

> A high-performance educational platform for automated step-by-step mathematical derivation and evaluation.  
> Implements a **Hybrid Neural-Symbolic architecture** combining **Large Language Models (LLMs)** with **Symbolic Computation** for rigorous verification and pedagogical coaching.

[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB)](https://react.dev)
[![SymPy](https://img.shields.io/badge/Math-SymPy--1.12-3B5526)](https://sympy.org)
[![NVIDIA](https://img.shields.io/badge/AI-NVIDIA--NIM-76B900)](https://build.nvidia.com)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](#)

---

## 📑 Table of Contents

1. [Project Description](#project-description)
2. [Architecture Diagram](#architecture-diagram)
3. [The Neural-Symbolic Engine](#the-neural-symbolic-engine)
4. [AI Stack — NVIDIA NIMs & Cerebras](#ai-stack--nvidia-nims--cerebras)
5. [Symbolic Validation Layer](#symbolic-validation-layer)
6. [Gamification & Dashboard](#gamification--dashboard)
7. [Project Structure](#project-structure)
8. [Setup & Run](#setup--run)
9. [Future Improvements](#future-improvements)

---

## 🎯 Project Description

**NexStep** is a "code-runner" style platform for mathematics. Unlike traditional math apps that only check the final answer, NexStep analyzes every intermediate step a student takes. It identifies logical leaps, sign errors, and missing constants, providing real-time "Professor-level" critiques.

### Core Capabilities

| Feature | Technical Implementation |
|---|---|
| **Step-by-Step Validation** | Symbolic differentiation & equivalence checking (SymPy/SymEngine) |
| **Neural Math Parsing** | LLM-based translation of natural language math to LaTeX/SymPy |
| **Pedagogical Feedback** | NVIDIA Nemotron-3 Nano for hints and coaching notes |
| **Expert Critic** | High-level logical checks via Llama 3.1 (Cerebras) |
| **Broad Domain Coverage** | Calculus, Fourier Series, Laplace, ODEs, and Linear Algebra |
| **Progress Tracking** | Neural Mapping & Conceptual Mastery Heatmaps |

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        REACT FRONTEND (Vite)                        │
│                                                                       │
│   MathEditor ─── StepList ─── MasteryHeatmap ─── PerformanceLedger   │
│                     ↕ Axios API Client                               │
└──────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       FASTAPI BACKEND (Python)                       │
│                                                                       │
│   main.py (App Entry)                                                │
│     │                                                                 │
│     ├── /api/validate ──► ValidationEngine.check_steps()              │
│     ├── /api/ai/hint  ──► AIEngine.get_hint()                         │
│     └── /api/dashboard──► DashboardService.get_stats()                │
│                                         │                             │
│                    ┌────────────────────┤                             │
│                    ▼                    ▼                             │
│            ┌──────────────┐    ┌─────────────────────────┐           │
│            │   AI ENGINE  │    │  SYMBOLIC ENGINE        │           │
│            │  ─────────── │    │  ─────────────────────  │           │
│            │  NVIDIA NIMs │    │  SymPy Parser           │           │
│            │  Cerebras    │    │  SymEngine (C++)        │           │
│            │  Hybrid Logic│    │  Equivalence Prover     │           │
│            └──────────────┘    └─────────────────────────┘           │
│                                                                       │
│   ┌─────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│   │ Models / DB │  │ Syllabus Engine │  │ Validation Strategies   │  │
│   │ (SQLAlchemy)│  │ (Concept Tags)  │  │ (Integral, Matrix, ODE) │  │
│   └──────┬──────┘  └────────────────-┘  └─────────────────────────┘  │
│          ▼                                                           │
│    PostgreSQL / SQLite                                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 The Neural-Symbolic Engine

The "magic" of NexStep lies in its **Hybrid Validation Strategy**. AI is great at understanding intent, but bad at rigorous calculation. Symbolic math is perfect at calculation, but bad at understanding messy human input.

1.  **Neural Parsing**: LLMs convert natural language steps (e.g., *"let u = x^2"*) into valid mathematical tokens.
2.  **Symbolic Proof**: The backend uses **SymEngine** (a C++ implementation of SymPy) to mathematically prove that Step N+1 follows logically from Step N.
3.  **Pedagogical Layer**: If the proof fails, the AI analyzes the error to provide a human-readable hint instead of just saying "Wrong".

---

## 🤖 AI Stack — NVIDIA NIMs & Cerebras

NexStep uses a high-speed, multi-provider AI architecture:

- **Primary (NVIDIA NIMs)**: Utilizes `nvidia/nemotron-3-nano-30b-a3b` for ultra-fast, low-latency math parsing and step analysis.
- **Expert Fallback (Cerebras)**: Leverages Llama 3.1 (70B/405B) via Cerebras for high-level pedagogical critiques and "Expert Professor" reviews of complex derivations.

---

## 🔢 Symbolic Validation Layer

The platform implements specialized strategies for different mathematical domains:

| Domain | Validation Technique |
|---|---|
| **Integral Calculus** | Differentiation-based antiderivative verification |
| **Laplace/Fourier** | Domain-specific transform equivalence proofs |
| **Linear Algebra** | Symbolic determinant expansion and Eigenvalue verification |
| **ODEs** | Substitution-based solution verification |

---

## 🎮 Gamification & Dashboard

NexStep treats learning like an RPG (Role Playing Game):
- **XP & Levels**: Students earn experience points for "Stable" (correct) proofs.
- **Mastery Heatmap**: A neural-style visualization of conceptual stability across different topics.
- **Performance Ledger**: A synchronized log of all mathematical "transmissions" (submissions).

---

## 📁 Project Structure

```
Maths_platform/
├── backend/
│   ├── ai_engine.py          # NVIDIA/Cerebras LLM integration
│   ├── validation_engine.py  # Massive 3,000+ line SymPy/SymEngine logic
│   ├── syllabus_engine.py    # Concept mapping and difficulty scaling
│   ├── main.py               # FastAPI entry point
│   ├── models.py             # Database schemas
│   ├── routes/               # API endpoints (Auth, Dashboard, Validation)
│   └── database.py           # SQLAlchemy configuration
├── frontend/
│   ├── src/
│   │   ├── pages/            # Dashboard, Solver, Report views
│   │   ├── components/       # Math components, Mastery Heatmap
│   │   └── api.js            # Axios configuration
│   └── vite.config.js        # Build configuration
└── README.md                 # This file
```

---

## 🛠️ Setup & Run

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
*Note: Ensure `.env` contains your `NVIDIA_API_KEY` or `CEREBRAS_API_KEY`.*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 Future Improvements

- [ ] **Wolfram Alpha Integration**: Fallback for extremely complex symbolic identities.
- [ ] **Handwriting Recognition**: Allow students to upload photos of handwritten steps for neural analysis.
- [ ] **Collaborative Solving**: Real-time shared math whiteboards with AI observation.
- [ ] **Voice-to-Math**: dictating steps using the `voice_routes` already in architecture.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
