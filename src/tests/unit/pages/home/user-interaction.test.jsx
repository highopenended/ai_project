/* global jest, describe, beforeEach, test */

// eslint-disable-next-line no-unused-vars
import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../../../../components/pages/home/Home.jsx';
import { AuthProvider } from '../../../../context/AuthContext';
import { MemoryRouter } from 'react-router-dom';

// Capture console.error to debug issues
const originalConsoleError = console.error;
console.error = (...args) => {
  // Log the error for debugging
  console.log('Console Error:', ...args);
  // Call the original console.error
  originalConsoleError(...args);
};

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn()
}));

// Mock Firebase auth with a more controlled implementation
jest.mock('firebase/auth', () => {
  const mockUser = { email: 'test@test.com', uid: 'test-user-id' };
  
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
    currentUser: { email: 'test@test.com', uid: 'test-user-id' },
    onAuthStateChanged: jest.fn((callback) => {
      callback({ email: 'test@test.com', uid: 'test-user-id' });
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

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ answer: 'This is a mock AI response' }),
  })
);

// Mock useLocation and useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(() => ({ 
    state: null 
  })),
  useNavigate: jest.fn(() => jest.fn())
}));

describe('Home Component User Interactions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  // ✅ Debug what elements are rendered
  test('✅ Debug what elements are rendered', async () => {
    // Render the component
    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <Home initialMessages={[]} conversationId={null} />
          </AuthProvider>
        </MemoryRouter>
      );
      
      // Wait for any pending state updates
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Debug: log the rendered HTML
    // console.log('Rendered HTML:', document.body.innerHTML);
    
    // Debug: log all available elements by role
    // console.log('Available elements by role:');
    // console.log('Buttons:', screen.queryAllByRole('button').map(b => b.textContent));
    // console.log('Textareas:', screen.queryAllByRole('textbox').map(t => t.placeholder));
    
    // Debug: check if there are any elements with placeholder text
    const allElements = document.querySelectorAll('*');
    const elementsWithPlaceholder = Array.from(allElements).filter(el => el.placeholder);
    console.log('Elements with placeholder:', elementsWithPlaceholder.map(el => ({
      tag: el.tagName,
      placeholder: el.placeholder,
      id: el.id
    })));
  });
}); 