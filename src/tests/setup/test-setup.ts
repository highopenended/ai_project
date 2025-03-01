import '@testing-library/jest-dom';

// Extend expect with custom matchers
expect.extend({});

// Mock performance API with a simpler approach
if (!window.performance) {
  // @ts-ignore - Ignore TypeScript errors for the mock implementation
  window.performance = {
    mark: jest.fn(),
    measure: jest.fn(),
    now: jest.fn(() => Date.now()),
  };
}

// Create a mock for firebase/auth that properly handles state changes
// This approach avoids using act() directly in the mock
jest.mock('firebase/auth', () => {
  // Use a variable to store the callback
  let authStateCallback = null;
  
  return {
    getAuth: jest.fn(() => ({
      currentUser: { email: 'test@test.com' },
      onAuthStateChanged: jest.fn((auth, callback) => {
        // Store the callback for later use
        authStateCallback = callback;
        
        // Immediately call the callback with a mock user
        // Use setTimeout to make it asynchronous but predictable
        setTimeout(() => {
          if (authStateCallback) {
            authStateCallback({ email: 'test@test.com' });
          }
        }, 0);
        
        // Return unsubscribe function
        return jest.fn();
      })
    })),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    GoogleAuthProvider: jest.fn().mockImplementation(() => ({})),
    signInWithPopup: jest.fn()
  };
});

// Global test setup
beforeAll(() => {
  // Add any global setup here
});

// Global test teardown
afterAll(() => {
  // Add any global cleanup here
});

// Reset any mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
}); 