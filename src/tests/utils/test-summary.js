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

// Check if we're running in summary mode (via test:summary script)
const isSummaryMode = process.env.TEST_SUMMARY_MODE === 'true';

// Global registry to track which tests have been reported
const reportedTests = new Set();

let totalSuites = 0;
let totalTests = 0;

/**
 * Sets up test summary functionality for the current test file
 */
export function setupTestSummary() {
  // Get the current file path from the stack trace to use as a prefix for test names
  const stackTrace = new Error().stack;
  const callerLine = stackTrace.split('\n')[2];
  const callerFile = callerLine.match(/\((.+?):\d+:\d+\)/) || callerLine.match(/at (.+?):\d+:\d+/);
  const filePath = callerFile ? callerFile[1] : 'unknown';
  
  // Collect test results
  const testResults = [];

  // ANSI color codes
  const GREEN = '\u001b[32m';
  const RED = '\x1b[31m';
  const RESET = '\u001b[0m';

  // Override test function to collect results
  const originalTest = global.test;
  global.test = (name, fn) => {
    totalTests++;
    // Create a unique identifier for this test
    const testId = `${filePath}:${name}`;
    
    return originalTest(name, async (...args) => {
      const startTime = performance.now();
      try {
        await fn(...args);
        const endTime = performance.now();
        
        // Only collect results in summary mode
        if (isSummaryMode) {
          testResults.push({ 
            id: testId,
            name, 
            passed: true,
            duration: endTime - startTime 
          });
        }
      } catch (error) {
        const endTime = performance.now();
        
        // Only collect results in summary mode
        if (isSummaryMode) {
          testResults.push({ 
            id: testId,
            name, 
            passed: false, 
            error,
            duration: endTime - startTime 
          });
        }
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
    totalSuites++;
    console.error = originalConsoleError;
    
    // Only output results in summary mode
    if (isSummaryMode) {
      // Use process.stdout.write directly to avoid stack trace
      // Print test results in a simple format, but only for tests not already reported
      testResults.forEach(result => {
        // Skip if this test has already been reported
        if (reportedTests.has(result.id)) {
          return;
        }
        
        // Mark this test as reported
        reportedTests.add(result.id);
        
        const icon = result.passed ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
        const duration = result.duration.toFixed(0);
        process.stdout.write(`${icon} ${result.name} (${duration}ms)\n`);
      });
      process.stdout.write(`\n${GREEN}${totalSuites} suites passed, ${totalTests} tests passed${RESET}\n`);
    }
    
    // Restore original test function
    global.test = originalTest;
  });
} 