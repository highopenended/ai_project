/* eslint-disable no-undef */
/* eslint-disable react/jsx-uses-react */
/* eslint-disable react/react-in-jsx-scope */
import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../../../../components/pages/home/Home.jsx';
import { AuthProvider } from '../../../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

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
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn()
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

// Mock the lib/firebase/chatHistory module
jest.mock('../../../../lib/firebase/chatHistory', () => ({
  saveConversation: jest.fn().mockResolvedValue('mock-conversation-id'),
  updateConversation: jest.fn().mockResolvedValue(true)
}));

describe('Home Component', () => {
  // ✅ Component renders without crashing
  test('✅ Component renders without crashing - should render the Home component without errors', async () => {
    // Create mock initial messages array
    const mockInitialMessages = [];
    let renderResult;
    
    // Use act to handle all state updates
    await act(async () => {
      renderResult = render(
        <BrowserRouter>
          <AuthProvider>
            <Home initialMessages={mockInitialMessages} conversationId={null} />
          </AuthProvider>
        </BrowserRouter>
      );
      
      // Wait for any pending state updates
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(renderResult).toBeDefined();
  });
}); 