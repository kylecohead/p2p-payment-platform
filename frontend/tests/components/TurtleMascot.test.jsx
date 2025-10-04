import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SafePayBot from "../../src/components/TurtleMascot";

describe("SafePayBot (TurtleMascot) Component", () => {
  it("should render without crashing", () => {
    render(<SafePayBot isPasswordFocused={false} showPassword={false} />);
    expect(document.querySelector(".safepay-bot")).toBeInTheDocument();
  });

  it("should display robot head with helmet", () => {
    render(<SafePayBot isPasswordFocused={false} showPassword={false} />);
    expect(document.querySelector(".bot-head")).toBeInTheDocument();
    expect(document.querySelector(".helmet")).toBeInTheDocument();
  });

  it("should display robot body with dollar logo", () => {
    render(<SafePayBot isPasswordFocused={false} showPassword={false} />);
    expect(document.querySelector(".bot-body")).toBeInTheDocument();
    expect(screen.getByText("$")).toBeInTheDocument();
  });

  it("should display construction roller", () => {
    render(<SafePayBot isPasswordFocused={false} showPassword={false} />);
    expect(document.querySelector(".construction-roller")).toBeInTheDocument();
  });

  it("should display both robot arms", () => {
    render(<SafePayBot isPasswordFocused={false} showPassword={false} />);
    const arms = document.querySelectorAll(".bot-arm");
    expect(arms.length).toBe(2);
  });

  it("should display robot eyes", () => {
    render(<SafePayBot isPasswordFocused={false} showPassword={false} />);
    const eyes = document.querySelectorAll(".bot-eye");
    expect(eyes.length).toBe(2);
  });

  it("should have visor open when password not focused", () => {
    render(<SafePayBot isPasswordFocused={false} showPassword={false} />);
    const visor = document.querySelector(".privacy-visor");
    expect(visor).toHaveClass("open");
  });

  it("should have visor closed when password is focused", () => {
    render(<SafePayBot isPasswordFocused={true} showPassword={false} />);
    const visor = document.querySelector(".privacy-visor");
    expect(visor).toHaveClass("closed");
  });

  it("should have transparent visor when password is visible", () => {
    render(<SafePayBot isPasswordFocused={true} showPassword={true} />);
    const visor = document.querySelector(".privacy-visor");
    expect(visor).toHaveClass("closed-transparent");
  });

  it("should display status lights on chest panel", () => {
    render(<SafePayBot isPasswordFocused={false} showPassword={false} />);
    const statusLights = document.querySelectorAll(".status-light");
    expect(statusLights.length).toBe(3);
  });
});
