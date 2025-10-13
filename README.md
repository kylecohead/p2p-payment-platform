# Waluigi-RW344 (SafePay+)

Student built demo project simulating a peer-to-peer payments application (**SafePay+**). This project's core feature is a **real-time transaction monitoring system** designed to flag potentially fraudulent activity. The repo contains a **React + Vite frontend** and a **Python backend** that provides user authentication, payments, transaction history, and a robust admin control panel.

This README describes the product, how to run it locally, testing and CI details, and group contributions.

---

## Table of Contents

- [Project description](#project-description)
- [Key features](#key-features)
- [Repo layout](#repo-layout)
- [Requirements](#requirements)
- [Install and run locally](#install-and-run-locally)
- [Frontend scripts](#frontend-scripts)
- [Backend quick start](#backend-quick-start)
- [Testing](#testing)
- [CI / CD notes](#ci--cd-notes)
- [Environment variables](#environment-variables)
- [Coding style & linting](#coding-style--linting)
- [Contributing](#contributing)
- [Troubleshooting & tips](#troubleshooting--tips)
- [License & authorship](#license--authorship)

---

## Project description

**SafePay+** is a lightweight **Peer-to-Peer (P2P) transaction monitoring system**. It's a student-built web application that demonstrates a fully functional P2P payment interface coupled with a real-time fraud detection mechanism.

The system applies a simple, heuristic-based **rule engine** to every outgoing transfer, focusing on transfer amounts, frequency, recipient history, and balance impact. If any rule is triggered, an immediate alert is generated and surfaced to both the user and the administrators.

For administrators, the project features a **protected control panel** for efficient oversight, alert management, and the ability to enforce actions like **blocking a sender or recipient** to immediately stop suspicious activity.

The project also features a chatbot assistant named **Rob** with a security-first prompt and suggested questions, designed to only answer user-facing SafePay+ questions and to defend against prompt-injection and unsafe requests.

---

## Key features

The SafePay+ application is built around two core functional pillars: secure P2P payments and real-time fraud monitoring.

### 1. Real-Time Fraud Monitoring (Rule Engine)

The rule engine is designed to flag potentially unusual or risky transaction behavior in real time. It applies five simple heuristics to each outgoing transfer:

- **Large Transfers:** Flagged if the transfer amount exceeds **R5000**.
- **High Frequency:** Flagged for **more than 3 transfers** from the same sender within **60 seconds**.
- **Balance Impact:** Flagged for any transfer that would result in a **negative balance** or a **0 balance**.
- **Daily Limit:** Flagged if the total amount sent for the day exceeds **R10000**.
- Alerts are displayed via an **inline banner** on the user dashboard and persisted in an `Alerts` table for administrative review.

### 2. Admin Control Panel (Protected Route)

The dedicated admin panel supports efficient oversight and allows for immediate fraud prevention actions:

- **View & Filter** transactions by user/date and manage alerts.
- **Mark alerts "cleared"** for efficient workflow.
- **Block Sender:** Prevents the selected user from initiating any further transfers.
- **Block Recipient:** Prevents transfers from any user to the selected recipient.
- **Unblock:** Admin can revoke blocks once the user is cleared.
- All blocking actions are **immediately enforced** to stop suspicious transactions in real time and are logged for audit purposes.
- The admin panel can **Export alerts CSV** for analysis.

### 3. P2P Payment Interface & Tech

- **User Management:** User registration and login using **Email + password** with **bcrypt hashing**.
- **P2P Core:** A functional **Send Money UI** (with recipient autocomplete and notes) and automated **Receive Money** (auto-credit on sender confirmation).
- **Dashboard:** Provides the user's **Current balance** and a sortable **Transaction history** (sent/received).
- **Non-Functional:** The code is designed for **maintainability** (comments, unit tests) and **usability** (responsive web UI).

---

## Repo layout

- `frontend/` — React app (components, pages, services, tests)
- `backend/` — Python backend, Alembic migrations, scripts

## Requirements

- Node.js (recommended v20 LTS)
- npm
- Python 3.10+ (or as listed in `backend/requirements.txt`)
- Optional: Docker for containerized runs

## Install and run locally

1. Clone the repository and install dependencies

```bash
git clone <repo-url>
cd Waluigi-RW344

# Frontend
cd frontend
npm ci

# Backend (in a second terminal)
cd ../backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
