# SafePay+: Real-Time P2P Transaction Monitoring

SafePay+ is a lightweight, peer-to-peer (P2P) transaction monitoring system designed to flag potentially fraudulent activity in real time. Developed as a collaborative group project for the Computer Science 344 module, the application enables users to securely interact through a functional payment interface while providing administrators with robust oversight via a dedicated dashboard.

---

## My Contributions (Frontend Team)

As a member of the frontend team, I worked on the following areas:

- **Component Engineering:** Developed reusable React components for the user dashboard and payment interfaces.
- **State Management:** Assisted in implementing React context providers for consistent state across the application.
- **Security Testing:** Contributed to the comprehensive security testing suite for the "Rob" chatbot, ensuring protection against prompt injection and social engineering attacks.
- **UI/UX Refinement:** Collaborated on implementing light/dark mode and responsive, mobile-first design.

---

## Core Features

### 1. Real-Time Fraud Monitoring

The system applies a heuristic-based rule engine to every outgoing transfer to detect risky behaviour instantly. The following rules are enforced:

| Rule | Condition |
|---|---|
| Large Transfer | Flagged if a single transfer exceeds R5,000 |
| High Frequency | Flagged if a sender initiates more than 3 transfers within 60 seconds |
| Balance Impact | Flagged if a transfer results in a zero or negative balance |
| Daily Limit | Flagged if total amount sent in a single day exceeds R10,000 |

Triggered rules generate an immediate inline alert for the user and are persisted for administrative review.

### 2. Administrative Oversight

The protected Admin Control Panel provides tools for fraud prevention:

- **Transaction Auditing:** View and filter transaction history by user or date.
- **Account Restrictions:** Admins can block a sender (preventing outgoing transfers) or block a recipient (preventing incoming transfers).
- **Data Export:** Export flagged transactions and active blocks as CSV files for offline analysis.

### 3. User Features

- **"Rob" AI Chatbot:** A security-first assistant designed to answer user-facing questions while defending against prompt injection attacks.
- **Beneficiaries Management:** Automated tracking of recipients with Quick Pay functionality and usage statistics.
- **Interactive Visualisations:** A canvas-based payment network graph to track transaction flows.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18+ (Vite), Tailwind CSS, Vitest |
| Backend | Python 3.10+, FastAPI |
| Database | PostgreSQL, SQLAlchemy (ORM), Alembic |
| DevOps | Docker, GitLab CI/CD (linting, testing, building) |

---

## Getting Started

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Update backend/.env with your PostgreSQL DATABASE_URL
alembic upgrade head
python3 main.py
```

The backend service will run at `http://localhost:8000`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend interface will be available at `http://localhost:5173`.

---

## Testing and Quality Assurance

The project implements a rigorous testing strategy to ensure maintainability and security:

- **Security Focus:** 20+ dedicated tests for the chatbot to guard against social engineering and prompt injection.
- **Component Testing:** Unit tests for modals, login forms, and transaction components using `@testing-library/react`.
- **Continuous Integration:** The GitLab CI/CD pipeline automatically enforces ESLint code quality checks and coverage thresholds on every push to the `main` or `dev` branches.

---
