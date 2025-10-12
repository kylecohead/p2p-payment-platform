import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
import PaymentNetwork from "../../src/components/PaymentNetwork";

describe("PaymentNetwork Component", () => {
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

  it("should render without crashing", () => {
    const { container } = render(<PaymentNetwork />);
    expect(container).toBeTruthy();
  });

  it("should render canvas element", () => {
    render(<PaymentNetwork />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("should have payment-network-canvas class", () => {
    const { container } = render(<PaymentNetwork />);
    const paymentNetworkCanvas = container.querySelector(
      ".payment-network-canvas"
    );
    expect(paymentNetworkCanvas).toBeInTheDocument();
  });

  it("should set canvas dimensions", () => {
    render(<PaymentNetwork />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toHaveAttribute("width");
    expect(canvas).toHaveAttribute("height");
  });
});
