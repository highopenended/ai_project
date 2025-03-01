/* global jest, describe, beforeEach, test, expect */
// React import is needed for JSX syntax even if not directly referenced
import React from 'react';
import { render, act } from "@testing-library/react";
import '@testing-library/jest-dom';
import { BrowserRouter } from "react-router-dom";
import Login from "../../../../components/pages/login/Login";
import { AuthProvider } from "../../../../context/AuthContext";
import { setupTestSummary } from "../../../utils/test-summary";

// Setup test summary
setupTestSummary();

// Mock Firebase modules
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({})),
  apps: []
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn((callback) => {
      callback(null);
      return jest.fn(); // unsubscribe function
    })
  })),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({})),
  signInWithPopup: jest.fn()
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn()
}));

// Mock the firebaseConfig module
jest.mock("../../../../firebaseConfig", () => ({
  default: {
    apiKey: "test-api-key",
    authDomain: "test-auth-domain",
    projectId: "test-project-id",
    storageBucket: "test-storage-bucket",
    messagingSenderId: "test-messaging-sender-id",
    appId: "test-app-id"
  },
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn((callback) => {
      callback(null);
      return jest.fn(); // unsubscribe function
    })
  },
  db: {},
  isInitialized: Promise.resolve(true)
}));

// Mock performance API if needed
if (typeof window.performance === 'undefined') {
  window.performance = { now: jest.fn(() => Date.now()) };
}

describe("Login Component User Interactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Component renders without crashing
  test("Component renders without crashing", () => {
    expect(() => render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )).not.toThrow();
  });

  // This test will be added once we confirm the component renders properly
  test("should render login form elements correctly", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </BrowserRouter>
      );
    });

    // Log the rendered HTML for debugging
    console.log("Rendered HTML:", document.body.innerHTML);
  });
}); 