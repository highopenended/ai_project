import '@testing-library/jest-dom';

// Extend expect with custom matchers
expect.extend({});

// Mock performance API
if (!window.performance) {
  window.performance = {
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(),
    getEntriesByType: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    now: jest.fn(() => Date.now()),
    timeOrigin: Date.now(),
    timing: {},
    navigation: {},
    memory: {},
    eventCounts: {},
    onresourcetimingbufferfull: null,
    setResourceTimingBufferSize: jest.fn(),
    clearResourceTimings: jest.fn(),
    toJSON: jest.fn()
  };
}

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