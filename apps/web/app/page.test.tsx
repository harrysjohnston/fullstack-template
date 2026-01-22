import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders without crashing", () => {
    render(<HomePage />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("displays the app title", () => {
    render(<HomePage />);
    expect(screen.getByText("fullstack-template")).toBeInTheDocument();
  });

  it("displays the description text", () => {
    render(<HomePage />);
    expect(screen.getByText(/Next.js \+ TypeScript scaffold/i)).toBeInTheDocument();
  });

  it("renders the buttons", () => {
    render(<HomePage />);
    expect(screen.getByText("Get started")).toBeInTheDocument();
    expect(screen.getByText("View docs")).toBeInTheDocument();
  });
});
