/* global jest, describe, beforeEach, test, expect */
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
// eslint-disable-next-line no-unused-vars
import { BrowserRouter, Routes, Route, MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { isInitialized } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { setupTestSummary } from "../utils/test-summary";
import PropTypes from 'prop-types';

// Setup test summary
setupTestSummary();

// Mock the firebase modules with a more realistic implementation
jest.mock('../../firebaseConfig', () => {
  // Create a mock implementation of isInitialized that can be controlled in tests
  const mockIsInitialized = {
    then: jest.fn(callback => {
      // Store the callback to control when it's called
      mockIsInitialized._callback = callback;
      return mockIsInitialized;
    }),
    // Method to manually resolve the promise in tests
    _resolve: () => {
      if (mockIsInitialized._callback) {
        mockIsInitialized._callback(true);
      }
    }
  };

  return {
    auth: {
      currentUser: null,
      onAuthStateChanged: jest.fn()
    },
    isInitialized: mockIsInitialized,
    db: {}
  };
});

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
  getAuth: jest.fn(() => ({
    currentUser: null
  }))
}));

// Mock Layout component to avoid TypeScript dependencies
jest.mock('../../components/Layout', () => {
  return {
    __esModule: true,
    default: ({ children }) => <div data-testid="layout">{children}</div>
  };
});

// Test component for protected routes
const ProtectedContent = () => <div data-testid="protected-content">Protected Content</div>;
const HomePage = () => <div data-testid="home-page">Home Page</div>;

// Simple app structure for testing with MemoryRouter for better route control
const TestApp = ({ initialRoute = '/' }) => (
  <MemoryRouter initialEntries={[initialRoute]}>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/protected" 
          element={
            <ProtectedRoute>
              <ProtectedContent />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </AuthProvider>
  </MemoryRouter>
);

// Add PropTypes validation
TestApp.propTypes = {
  initialRoute: PropTypes.string
};

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should handle the complete authentication flow', async () => {
    // Setup the auth state changed callback
    let authCallback;
    onAuthStateChanged.mockImplementation((auth, callback) => {
      authCallback = callback;
      return jest.fn(); // Return unsubscribe function
    });
    
    // Render the test app with protected route
    const { unmount } = render(<TestApp initialRoute="/protected" />);
    
    // Initially should show loading
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    // Resolve the isInitialized promise
    await act(async () => {
      isInitialized._resolve();
    });
    
    // Should have set up the auth state listener
    expect(onAuthStateChanged).toHaveBeenCalled();
    
    // Simulate auth state change with no user (not logged in)
    await act(async () => {
      authCallback(null);
    });
    
    // Should not show protected content (should redirect to home)
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    
    // Clean up the first render to avoid test interference
    unmount();
    
    // Create a new test instance with a logged-in user
    onAuthStateChanged.mockImplementation((auth, callback) => {
      // Immediately call with a user
      setTimeout(() => callback({ email: 'test@example.com', uid: 'test-uid' }), 0);
      return jest.fn(); // Return unsubscribe function
    });
    
    // Render a new instance with the protected route
    render(<TestApp initialRoute="/protected" />);
    
    // Now should show protected content after auth is resolved
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
  
  test('should handle Firebase initialization failure', async () => {
    // Mock onAuthStateChanged to throw an error during initialization
    onAuthStateChanged.mockImplementation(() => {
      throw new Error('Firebase initialization failed');
    });
    
    // Render the test app with protected route
    render(<TestApp initialRoute="/protected" />);
    
    // Resolve the isInitialized promise
    await act(async () => {
      isInitialized._resolve();
    });
    
    // Should show error state
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
    
    // Should not show protected content
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
  
  test('should handle delayed Firebase initialization', async () => {
    // Setup the auth state changed callback
    let authCallback;
    onAuthStateChanged.mockImplementation((auth, callback) => {
      authCallback = callback;
      return jest.fn(); // Return unsubscribe function
    });
    
    // Render the test app with protected route
    render(<TestApp initialRoute="/protected" />);
    
    // Initially should show loading
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    // Wait a bit before resolving isInitialized (simulating slow initialization)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      isInitialized._resolve();
    });
    
    // Should have set up the auth state listener
    expect(onAuthStateChanged).toHaveBeenCalled();
    
    // Simulate auth state change with a user after a delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      authCallback({ email: 'test@example.com', uid: 'test-uid' });
    });
    
    // Now should show protected content
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
}); 