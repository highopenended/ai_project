import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShopGenerator from '../../../../components/pages/shopgenerator/ShopGenerator';
import { AuthProvider } from '../../../../context/AuthContext';
import { ItemDataProvider } from '../../../../context/ItemDataProvider';

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn()
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { email: 'test@test.com' },
    onAuthStateChanged: jest.fn((callback) => {
      callback({ email: 'test@test.com' });
      return jest.fn(); // unsubscribe function
    })
  }))
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn()
}));

// Mock the firebaseConfig module
jest.mock('../../../../firebaseConfig', () => ({
  auth: {
    currentUser: { email: 'test@test.com' },
    onAuthStateChanged: jest.fn((callback) => {
      callback({ email: 'test@test.com' });
      return jest.fn(); // unsubscribe function
    })
  },
  db: {},
  isInitialized: Promise.resolve(true)
}));

describe('Initial Test Setup', () => {
  it('should pass this sanity check', () => {
    expect(true).toBe(true);
  });
});

describe('ShopGenerator Component', () => {
  it('should render without crashing', () => {
    expect(() => render(
      <AuthProvider>
        <ItemDataProvider>
          <ShopGenerator />
        </ItemDataProvider>
      </AuthProvider>
    )).not.toThrow();
  });
}); 