import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Popup from "../../src/components/Popup";

describe("Popup Component", () => {
  it("should render when showPopup is true", () => {
    const setShowPopup = vi.fn();
    render(
      <Popup
        showPopup={true}
        setShowPopup={setShowPopup}
        blackText="Test"
        greenText="Popup"
      />
    );
    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(screen.getByText("Popup")).toBeInTheDocument();
  });

  it("should not render when showPopup is false", () => {
    const setShowPopup = vi.fn();
    render(
      <Popup
        showPopup={false}
        setShowPopup={setShowPopup}
        blackText="Test"
        greenText="Popup"
      />
    );
    expect(screen.queryByText("Test")).not.toBeInTheDocument();
  });

  it("should display blackText and greenText", () => {
    const setShowPopup = vi.fn();
    render(
      <Popup
        showPopup={true}
        setShowPopup={setShowPopup}
        blackText="Transaction"
        greenText="Successful"
      />
    );
    expect(screen.getByText("Transaction")).toBeInTheDocument();
    expect(screen.getByText("Successful")).toBeInTheDocument();
  });

  it("should call setShowPopup when close button is clicked", async () => {
    const user = userEvent.setup();
    const setShowPopup = vi.fn();
    render(
      <Popup
        showPopup={true}
        setShowPopup={setShowPopup}
        blackText="Test"
        greenText="Message"
      />
    );
    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);
    expect(setShowPopup).toHaveBeenCalledWith(false);
  });
});
