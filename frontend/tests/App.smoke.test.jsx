import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";

describe("App smoke", () => {
  it("renders landing page by default", () => {
    // Mock canvas getContext used by PaymentNetwork to avoid installing canvas package
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function () {
      // Minimal 2D context mock
      return {
        clearRect: () => {},
        createRadialGradient: () => ({ addColorStop: () => {} }),
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        moveTo: () => {},
        lineTo: () => {},
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 1,
      };
    };

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    // LandingPage contains text 'Welcome' in the student demo; assert something stable
    expect(screen.getByText(/SafePay|Welcome|Top up/i)).toBeTruthy();
    // Restore original
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });
});
