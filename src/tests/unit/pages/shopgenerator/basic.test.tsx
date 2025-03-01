/* global jest, describe, test, expect */
import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShopGenerator from '../../../../components/pages/shopgenerator/ShopGenerator';
import { AuthProvider } from '../../../../context/AuthContext';
import { ItemDataProvider } from '../../../../context/ItemDataProvider';
import { setupTestSummary } from "../../../utils/test-summary";

// Setup test summary
setupTestSummary();

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn()
}));

// Mock Firebase auth with a more controlled implementation
jest.mock('firebase/auth', () => {
  const mockUser = { email: 'test@test.com' };
  
  return {
    getAuth: jest.fn(() => ({
      currentUser: mockUser,
      onAuthStateChanged: jest.fn((callback) => {
        // Call the callback immediately with the mock user
        callback(mockUser);
        return jest.fn(); // unsubscribe function
      })
    }))
  };
});

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

describe('ShopGenerator Component', () => {
  test('Component renders without crashing', async () => {
    let renderResult;
    
    // Use act to handle all state updates
    await act(async () => {
      renderResult = render(
        <AuthProvider>
          <ItemDataProvider>
            <ShopGenerator />
          </ItemDataProvider>
        </AuthProvider>
      );
      
      // Wait for any pending state updates
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(renderResult).toBeDefined();
  });
}); 