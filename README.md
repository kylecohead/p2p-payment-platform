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
- [Beneficiaries management](#beneficiaries-management)
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

### 3. Beneficiaries Management

Automated beneficiary tracking to improve user experience:

- **Auto-Add Beneficiaries:** When users send money to someone for the first time, they are automatically added as a beneficiary.
- **Beneficiaries List:** Dedicated page showing all past recipients with usage statistics.
- **Quick Pay:** Click any beneficiary to instantly open the payment panel with their details pre-filled.
- **Usage Tracking:** Displays last payment date and total payment count for each beneficiary.

### 4. P2P Payment Interface & Tech

- **User Management:** User registration and login using **Email + password** with **bcrypt hashing**.
- **P2P Core:** A functional **Send Money UI** (with recipient autocomplete and notes) and automated **Receive Money** (auto-credit on sender confirmation).
- **Dashboard:** Provides the user's **Current balance** and a sortable **Transaction history** (sent/received).
- **Non-Functional:** The code is designed for **maintainability** (comments, unit tests) and **usability** (responsive web UI).

---

## Repo layout

```
├── frontend/           # React + Vite frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Main application pages
│   │   ├── services/   # API communication
│   │   └── contexts/   # React context providers
│   └── tests/          # Frontend unit tests
├── backend/            # FastAPI Python backend
│   ├── src/
│   │   ├── models/     # SQLAlchemy database models
│   │   ├── services/   # Business logic services
│   │   └── config/     # Database configuration
│   ├── alembic/        # Database migrations
│   └── scripts/        # Utility scripts and seeders
└── README.md
```

## Requirements

- Node.js (recommended v20 LTS)
- npm
- Python 3.10+ (or as listed in `backend/requirements.txt`)
- Optional: Docker for containerized runs

## Install and run locally

### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up database (PostgreSQL required)
# Update backend/.env with your database URL
alembic upgrade head

# Run the server
python3 main.py
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://your-ip-here:5173`

## Environment variables

### Backend (.env file)

Create a `backend/.env` file with:

```bash
DATABASE_URL="postgresql+psycopg2://user:password@host:port/database"
API_HOST=0.0.0.0
API_PORT=8000
```

### Frontend

Update `frontend/src/services/api.js` with your backend URL:

```javascript
const API_BASE_URL = 'http://your-ip-here:8000'; // Update for production
```

## Frontend scripts

```bash
npm test                 # Watch mode
npm run test:ci          # Run once with coverage
npm run test:ui          # Visual UI
npm run test:watch       # Watch mode (alias)
npm run coverage:check   # Run coverage and enforce thresholds
```

### GitLab CI/CD Pipeline

The pipeline automatically runs on push to `main`, `dev-frontend`, `dev-sprint3`, and merge requests:

1. **Install**: Installs dependencies with npm caching
2. **Lint**: Runs ESLint code quality checks (parallel)
3. **Test**: Executes unit tests with coverage reports (parallel)
4. **Build**: Builds production-ready application

**Coverage Reports**: Available as CI/CD artifacts for 30 days in Cobertura, HTML, and JSON formats.

## API Endpoints

### User Authentication
- `POST /api/login` - User login
- `POST /api/signup` - User registration
- `GET /api/client/{id}` - Get user details

### Payments
- `POST /api/send/{client_id}` - Send money to another user
- `POST /api/topup/{client_id}` - Add money to account
- `GET /api/payment-history/{client_id}` - Get transaction history

### Beneficiaries
- `GET /api/beneficiaries/{client_id}` - List user's beneficiaries

### Admin (requires admin privileges)
- `GET /api/admin/alerts` - List all alerts
- `POST /api/admin/alerts/{id}/clear` - Clear an alert
- `POST /api/admin/block` - Block a user account
- `GET /api/admin/export-flagged-payments` - Export flagged transactions as CSV
- `GET /api/admin/export-active-blocks` - Export active blocks as CSV

### Test Files

- `tests/components/Chatbot.security.test.jsx` - **🔒 Security Tests** (20 tests)
  - Prompt injection attacks
  - Admin feature disclosure protection
  - Social engineering defenses
  - Malicious code injection protection
  - API safety response handling
  - Input validation & sanitization
  - Configuration security
- `tests/pages/Login.test.jsx` - Login form, mascot, password visibility
- `tests/pages/LandingPage.test.jsx` - Branding, buttons, navigation
- `tests/pages/NotFound.test.jsx` - 404 error page
- `tests/components/TurtleMascot.test.jsx` - Robot mascot, visor states
- `tests/components/Popup.test.jsx` - Modal component
- `tests/components/PaymentNetwork.test.jsx` - Canvas visualization

### Writing Tests

Test files: `*.test.jsx` alongside components

```javascript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyComponent from "./MyComponent";

describe("MyComponent", () => {
  it("should render and handle interactions", async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    const button = screen.getByRole("button", { name: /click me/i });
    await user.click(button);

    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```
