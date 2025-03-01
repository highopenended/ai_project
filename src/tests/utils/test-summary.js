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
    
    // Print a clean summary of test results
    console.log("\n=== TEST SUMMARY ===");
    
    // Count passed and failed tests
    const passed = testResults.filter(r => r.passed).length;
    const failed = testResults.filter(r => !r.passed).length;
    const total = testResults.length;
    const totalDuration = testResults.reduce((sum, test) => sum + test.duration, 0);
    
    // Print test results
    testResults.forEach(result => {
      const icon = result.passed ? "✅" : "❌";
      const duration = result.duration.toFixed(0);
      console.log(`${icon} ${result.name} (${duration}ms)`);
    });
    
    // Print summary statistics
    console.log("\nResults: " + 
      (passed === total ? "✅ ALL TESTS PASSED" : `✅ ${passed} passed, ❌ ${failed} failed`) + 
      ` (${total} total)`);
    console.log(`Total time: ${totalDuration.toFixed(0)}ms`);
    console.log("===================\n");
    
    // Restore original test function
    global.test = originalTest;
  });
} 