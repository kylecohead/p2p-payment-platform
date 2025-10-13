# Waluigi-RW344 (SafePay+)

Student built demo project simulating a peer-to-peer payments application (**SafePay+**). [cite_start]This project's core feature is a **real-time transaction monitoring system** designed to flag potentially fraudulent activity[cite: 15]. [cite_start]The repo contains a **React + Vite frontend** and a **Python backend** that provides user authentication, payments, transaction history, and a robust admin control panel[cite: 17].

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

[cite_start]**SafePay+** is a lightweight **Peer-to-Peer (P2P) transaction monitoring system**[cite: 15]. [cite_start]It's a student-built web application that demonstrates a fully functional P2P payment interface coupled with a real-time fraud detection mechanism[cite: 17].

[cite_start]The system applies a simple, heuristic-based **rule engine** to every outgoing transfer, focusing on transfer amounts, frequency, recipient history, and balance impact[cite: 20]. [cite_start]If any rule is triggered, an immediate alert is generated and surfaced to both the user and the administrators[cite: 21].

[cite_start]For administrators, the project features a **protected control panel** for efficient oversight, alert management, and the ability to enforce actions like **blocking a sender or recipient** to immediately stop suspicious activity[cite: 17, 29].

The project also features a chatbot assistant named **Rob** with a security-first prompt and suggested questions, designed to only answer user-facing SafePay+ questions and to defend against prompt-injection and unsafe requests.

---

## Key features

The SafePay+ application is built around two core functional pillars: secure P2P payments and real-time fraud monitoring.

### 1. Real-Time Fraud Monitoring (Rule Engine) 🚨

[cite_start]The rule engine is designed to flag potentially unusual or risky transaction behavior in real time[cite: 19]. [cite_start]It applies five simple heuristics to each outgoing transfer[cite: 20]:

- [cite_start]**Large Transfers:** Flagged if the transfer amount exceeds **R5000**[cite: 23].
- [cite_start]**High Frequency:** Flagged for **more than 3 transfers** from the same sender within **60 seconds**[cite: 24].
- [cite_start]**Balance Impact:** Flagged for any transfer that would result in a **negative balance** [cite: 25] [cite_start]or a **0 balance**[cite: 26].
- [cite_start]**Daily Limit:** Flagged if the total amount sent for the day exceeds **R10000**[cite: 27].
- [cite_start]Alerts are displayed via an **inline banner** on the user dashboard and persisted in an `Alerts` table for administrative review[cite: 36].

### 2. Admin Control Panel (Protected Route) 🛡️

[cite_start]The dedicated admin panel supports efficient oversight and allows for immediate fraud prevention actions[cite: 17, 29]:

- [cite_start]**View & Filter** transactions by user/date and manage alerts[cite: 36].
- [cite_start]**Mark alerts "cleared"** for efficient workflow[cite: 36].
- [cite_start]**Block Sender:** Prevents the selected user from initiating any further transfers[cite: 30].
- [cite_start]**Block Recipient:** Prevents transfers from any user to the selected recipient[cite: 31].
- [cite_start]**Unblock:** Admin can revoke blocks once the user is cleared[cite: 32].
- [cite_start]All blocking actions are **immediately enforced** to stop suspicious transactions in real time and are logged for audit purposes[cite: 33].
- [cite_start]_Should:_ The admin panel can **Export alerts CSV** for analysis[cite: 36].

### 3. P2P Payment Interface & Tech

- [cite_start]**User Management:** User registration and login using **Email + password** with **bcrypt hashing**[cite: 36].
- [cite_start]**P2P Core:** A functional **Send Money UI** (with recipient autocomplete and notes) and automated **Receive Money** (auto-credit on sender confirmation)[cite: 36].
- [cite_start]**Dashboard:** Provides the user's **Current balance** and a sortable **Transaction history** (sent/received)[cite: 36].
- [cite_start]**Non-Functional:** The code is designed for **maintainability** (comments, unit tests) and **usability** (responsive web UI)[cite: 38, 39].

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
