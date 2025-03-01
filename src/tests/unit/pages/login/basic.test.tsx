import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from '../../../../components/pages/login/Login';
import { AuthProvider } from '../../../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn()
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null, // No user for login page
    onAuthStateChanged: jest.fn((callback) => {
      callback(null); // No user for login page
      return jest.fn(); // unsubscribe function
    })
  })),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({})),
  signInWithPopup: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn()
}));

// Mock the firebaseConfig module
jest.mock('../../../../firebaseConfig', () => ({
  auth: {
    currentUser: null, // No user for login page
    onAuthStateChanged: jest.fn((callback) => {
      callback(null); // No user for login page
      return jest.fn(); // unsubscribe function
    })
  },
  db: {},
  isInitialized: Promise.resolve(true)
}));

describe('Login Component', () => {
  // √ Component renders without crashing
  test('√ Component renders without crashing - should render the Login component without errors', () => {
    expect(() => render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )).not.toThrow();
  });
}); 