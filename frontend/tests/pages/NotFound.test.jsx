import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "../../src/pages/NotFound";

describe("NotFound Component", () => {
  it("should render without crashing", () => {
    render(<NotFound />);
    expect(document.body).toBeTruthy();
  });

  it('should display "Page Not Found" title', () => {
    render(<NotFound />);
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });

  it("should display error message", () => {
    render(<NotFound />);
    expect(
      screen.getByText(/the page you are looking for does not exist/i)
    ).toBeInTheDocument();
  });

  it("should render the notfound container", () => {
    const { container } = render(<NotFound />);
    expect(container.querySelector(".notfound-container")).toBeInTheDocument();
  });
});
