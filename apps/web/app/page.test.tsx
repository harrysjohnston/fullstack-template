import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders without crashing", () => {
    render(<HomePage />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("renders the valentine homepage iframe", () => {
    render(<HomePage />);
    const frame = screen.getByTitle("Valentine homepage");
    expect(frame).toBeInTheDocument();
    expect(frame).toHaveAttribute("src", "/valentine/index.html");
  });

  /*
  it("displays the app title", () => {
    render(<HomePage />);
    expect(screen.getByText("Your files,")).toBeInTheDocument();
    expect(screen.getByText("archived")).toBeInTheDocument();
  });

  it("displays the description text", () => {
    render(<HomePage />);
    expect(screen.getByText(/A minimal, secure space for your uploads/i)).toBeInTheDocument();
  });

  it("renders the auth buttons", () => {
    render(<HomePage />);
    expect(screen.getAllByText("Sign in").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Create account").length).toBeGreaterThan(0);
  });
  */
});
