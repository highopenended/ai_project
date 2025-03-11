/* global jest, describe, beforeEach, test, expect */
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../../../context/AuthContext';
import { isInitialized } from '../../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { setupTestSummary } from "../../utils/test-summary";

// Setup test summary
setupTestSummary();

// Mock the firebase modules
jest.mock('../../../firebaseConfig', () => {
  // Create a mock implementation of isInitialized
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
    isInitialized: mockIsInitialized
  };
});

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn()
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { currentUser, loading, error } = useAuth();
  
  if (loading) {
    return <div data-testid="loading">Loading...</div>;
  }
  
  if (error) {
    return <div data-testid="error">Error: {error}</div>;
  }
  
  return (
    <div data-testid="auth-state">
      {currentUser ? `Logged in as ${currentUser.email}` : 'Not logged in'}
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should show loading state initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });
  
  test('should handle Firebase initialization correctly', async () => {
    // Setup the auth state changed callback
    let authCallback;
    onAuthStateChanged.mockImplementation((auth, callback) => {
      authCallback = callback;
      return jest.fn(); // Return unsubscribe function
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially in loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    // Resolve the isInitialized promise
    await act(async () => {
      isInitialized._resolve();
    });
    
    // Should have set up the auth state listener
    expect(onAuthStateChanged).toHaveBeenCalled();
    
    // Still in loading state until auth state is determined
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    // Simulate auth state change with no user
    await act(async () => {
      authCallback(null);
    });
    
    // Should now show not logged in
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Not logged in');
    
    // Simulate auth state change with a user
    await act(async () => {
      authCallback({ email: 'test@example.com' });
    });
    
    // Should now show logged in
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Logged in as test@example.com');
  });
  
  test('should handle Firebase initialization error', async () => {
    // Mock onAuthStateChanged to throw an error
    onAuthStateChanged.mockImplementation(() => {
      throw new Error('Firebase initialization failed');
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Resolve the isInitialized promise to trigger the error
    await act(async () => {
      isInitialized._resolve();
    });
    
    // Wait for the error state to appear
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
    
    // Should show the error message
    expect(screen.getByTestId('error')).toHaveTextContent('Failed to initialize authentication');
  });
  
  test('should handle auth state change error', async () => {
    // Setup the auth state changed callback to call the error handler
    let errorCallback;
    onAuthStateChanged.mockImplementation((auth, callback, errorHandler) => {
      errorCallback = errorHandler;
      return jest.fn(); // Return unsubscribe function
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Resolve the isInitialized promise
    await act(async () => {
      isInitialized._resolve();
    });
    
    // Simulate an auth state change error
    await act(async () => {
      errorCallback(new Error('Auth state change failed'));
    });
    
    // Should show the error message
    expect(screen.getByTestId('error')).toHaveTextContent('Auth state change failed');
  });
  
  test('should clean up auth listener on unmount', async () => {
    // Setup mock unsubscribe function
    const unsubscribe = jest.fn();
    onAuthStateChanged.mockReturnValue(unsubscribe);
    
    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Resolve the isInitialized promise
    await act(async () => {
      isInitialized._resolve();
    });
    
    // Unmount the component
    unmount();
    
    // Should have called the unsubscribe function
    expect(unsubscribe).toHaveBeenCalled();
  });
}); 