import '@testing-library/jest-dom';

// Extend expect with custom matchers
expect.extend({});

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