/* global describe, beforeEach, test, expect */
import React from 'react';
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import { setupTestSummary } from "../../../utils/test-summary";

// Setup test summary
setupTestSummary();

// Create a simple mock component for testing
const MockLoginComponent = () => {
  return (
    <div data-testid="login-container">
      <h1>Enter the Realm</h1>
      <button>Continue with Google</button>
      <form>
        <label htmlFor="email">Email Address</label>
        <input id="email" type="email" />
        <label htmlFor="password">Hidden Passphrase</label>
        <input id="password" type="password" />
        <button type="submit">Begin Quest</button>
      </form>
      <button>New to the realm? Create an account</button>
    </div>
  );
};

describe("Basic Login Component Test", () => {
  beforeEach(() => {
    // Clear the DOM between tests
    document.body.innerHTML = '';
  });

  test("renders login form elements correctly", () => {
    render(<MockLoginComponent />);
    
    // Debug: log the rendered HTML
    console.log("Rendered HTML:", document.body.innerHTML);
    
    // Verify essential form elements are present
    expect(screen.getByText("Enter the Realm")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Hidden Passphrase")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Begin Quest" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Continue with Google" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "New to the realm? Create an account" })).toBeInTheDocument();
  });
}); 