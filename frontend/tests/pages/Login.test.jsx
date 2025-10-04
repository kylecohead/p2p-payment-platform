import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Login from "../../src/pages/Login";

// Mock the API service
vi.mock("../../src/services/api", () => ({
  default: {
    login: vi.fn(),
    signup: vi.fn(),
  },
}));

describe("Login Component", () => {
  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  it("should render login form", () => {
    renderLogin();
    expect(
      screen.getByRole("heading", { name: /sign in/i })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/email@example.com/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/enter at least 8 characters/i)
    ).toBeInTheDocument();
  });

  it("should show SafePay bot mascot on login form", () => {
    renderLogin();
    expect(document.querySelector(".safepay-bot")).toBeInTheDocument();
  });

  it("should have password visibility toggle button", () => {
    renderLogin();
    const toggleButton = screen.getByRole("button", { name: /show password/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it("should toggle password visibility when eye icon is clicked", () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText(
      /enter at least 8 characters/i
    );
    const toggleButton = screen.getByRole("button", { name: /show password/i });

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute("type", "password");

    // Click the toggle button
    fireEvent.click(toggleButton);

    // Password should now be visible
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: /hide password/i })
    ).toBeInTheDocument();
  });

  it("should allow user input in form fields", () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText(/email@example.com/i);
    const passwordInput = screen.getByPlaceholderText(
      /enter at least 8 characters/i
    );

    // Enter values
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123" } });

    // Check values are set
    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("Password123");
  });
});
