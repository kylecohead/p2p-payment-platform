import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import LandingPage from "../../src/pages/LandingPage";

describe("LandingPage Component", () => {
  beforeEach(() => {
    // Mock canvas context methods
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      strokeStyle: "",
      fillStyle: "",
      lineWidth: 1,
      globalAlpha: 1,
    }));
  });

  const renderLandingPage = () => {
    return render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );
  };

  it("should render without crashing", () => {
    renderLandingPage();
    expect(document.body).toBeTruthy();
  });

  it("should display SafePay+ branding", () => {
    renderLandingPage();
    expect(screen.getByText(/SafePay\+/i)).toBeInTheDocument();
  });

  it("should have sign in button", () => {
    renderLandingPage();
    const signInButton = screen.getByRole("button", { name: /sign in/i });
    expect(signInButton).toBeInTheDocument();
  });

  it("should have open account button", () => {
    renderLandingPage();
    const openAccountButton = screen.getByRole("button", {
      name: /open account/i,
    });
    expect(openAccountButton).toBeInTheDocument();
  });

  it("should render payment network canvas", () => {
    renderLandingPage();
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });
});
