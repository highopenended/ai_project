/* global jest, describe, test, expect */
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ItemList from '../../../../components/pages/itemlist/ItemList';
import { AuthProvider } from '../../../../context/AuthContext';
import { setupTestSummary } from "../../../utils/test-summary";

// Setup test summary
setupTestSummary();

// Mock the item data
jest.mock('../../../../data/item-table.json', () => [
  {
    name: 'Test Item 1',
    price: '10 gp',
    bulk: '1',
    level: '1',
    url: 'https://example.com/item?ID=123',
    rarity: 'common',
    category: 'Weapon'
  },
  {
    name: 'Test Item 2',
    price: '20 gp',
    bulk: '2',
    level: '2',
    url: 'https://example.com/item?ID=456',
    rarity: 'uncommon',
    category: 'Armor'
  }
]);

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

describe('ItemList Component', () => {
  test('Component renders without crashing', () => {
    expect(() => render(
      <AuthProvider>
        <ItemList />
      </AuthProvider>
    )).not.toThrow();
  });
}); 