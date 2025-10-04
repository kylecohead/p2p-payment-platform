# Waluigi-RW344

## Frontend Testing & CI/CD

### Test Suite Status

✅ **All 32 tests passing** across 6 test files

### Test Coverage

| Component      | Tests    | Coverage |
| -------------- | -------- | -------- |
| Mascot         | 10 tests | 100%     |
| NotFound       | 4 tests  | 100%     |
| LandingPage    | 5 tests  | 95%      |
| Popup          | 4 tests  | 92%      |
| PaymentNetwork | 4 tests  | 69%      |
| Login          | 5 tests  | 48%      |

### Running Tests Locally

```bash
cd frontend
npm test              # Watch mode
npm run test:ci       # Run once with coverage
npm run test:ui       # Visual UI
npm run test:watch    # Watch mode (alias)
```

### GitLab CI/CD Pipeline

The pipeline automatically runs on push to `main`, `dev-frontend`, `dev-sprint3`, and merge requests:

1. **Install**: Installs dependencies with npm caching
2. **Lint**: Runs ESLint code quality checks (parallel)
3. **Test**: Executes unit tests with coverage reports (parallel)
4. **Build**: Builds production-ready application

**Coverage Reports**: Available as CI/CD artifacts for 30 days in Cobertura, HTML, and JSON formats.

### Test Files

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
