import { render, screen } from "@testing-library/react";
import { LandingPage } from "../components/LandingPage";

describe("LandingPage", () => {
  it("renders hero headline and demo call CTA", () => {
    render(<LandingPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Managing your emails, calls, and workload/i);
    expect(screen.getByRole("link", { name: /demo call/i })).toBeInTheDocument();
  });

  it("renders all stat cards", () => {
    render(<LandingPage />);
    expect(screen.getByText("24/7")).toBeInTheDocument();
    expect(screen.getByText("< 1s")).toBeInTheDocument();
    expect(screen.getByText("100%"));
    expect(screen.getByText("0"));
  });

  it("renders all capability cards", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Custom AI Agents/i)).toBeInTheDocument();
    expect(screen.getByText(/Voice & Call Handling/i)).toBeInTheDocument();
    expect(screen.getByText(/Email & Message Automation/i)).toBeInTheDocument();
  });
});
