/* global beforeAll, afterAll */
/**
 * Test Summary Utility
 * 
 * This utility provides a clean summary of test results that can be used in any test file.
 * It suppresses act() warnings and collects test results for a clean summary output.
 * 
 * Usage:
 * 1. Import this utility in your test file:
 *    import { setupTestSummary } from '../utils/test-summary';
 * 
 * 2. Call setupTestSummary() at the top of your test file:
 *    setupTestSummary();
 * 
 * 3. Write your tests as usual. The summary will be displayed after all tests are complete.
 */

/**
 * Sets up test summary functionality for the current test file
 */
export function setupTestSummary() {
  // Collect test results
  const testResults = [];

  // ANSI color codes
  const GREEN = '\x1b[32m';
  const RED = '\x1b[31m';
  const RESET = '\x1b[0m';

  // Override test function to collect results
  const originalTest = global.test;
  global.test = (name, fn) => {
    return originalTest(name, async (...args) => {
      const startTime = performance.now();
      try {
        await fn(...args);
        const endTime = performance.now();
        testResults.push({ 
          name, 
          passed: true,
          duration: endTime - startTime 
        });
      } catch (error) {
        const endTime = performance.now();
        testResults.push({ 
          name, 
          passed: false, 
          error,
          duration: endTime - startTime 
        });
        throw error;
      }
    });
  };

  // Suppress act() warnings
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = (...args) => {
      if (/Warning.*not wrapped in act/.test(args[0])) {
        return;
      }
      originalConsoleError(...args);
    };
  });

  afterAll(() => {
    console.error = originalConsoleError;
    
    // Use process.stdout.write directly to avoid stack trace
    // Print test results in a simple format
    testResults.forEach(result => {
      const color = result.passed ? GREEN : RED;
      const icon = result.passed ? "✓" : "✗";
      const duration = result.duration.toFixed(0);
      process.stdout.write(`${color}${icon}${RESET} ${result.name} (${duration}ms)\n`);
    });
    
    // Restore original test function
    global.test = originalTest;
  });
} 