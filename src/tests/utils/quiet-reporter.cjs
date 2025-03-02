/**
 * Quiet Jest Reporter
 * 
 * This reporter suppresses the RUNS output and only shows the test summary.
 */

// Consolidated Jest Reporter
// 
// This reporter can operate in both silent and quiet modes.
// - Silent Mode: Suppresses all output, using test-summary.js for summary.
// - Quiet Mode: Displays a brief summary of test results.

class ConsolidatedReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this._isQuietMode = process.env.QUIET_MODE === 'true';
  }

  onRunStart() {
    if (this._isQuietMode) {
      console.log('Running tests...');
    }
  }

  onTestStart() {
    // Do nothing
  }

  onTestResult(test, testResult) {
    // Do nothing during test runs
  }

  onRunComplete(contexts, results) {
    if (this._isQuietMode) {
      // Print a clean summary
      const { numFailedTests, numPassedTests, numTotalTests, testResults } = results;
      
      console.log('\nTest Results:');
      console.log(`${numPassedTests} passed, ${numFailedTests} failed, ${numTotalTests} total`);
      
      // Print test suite results
      testResults.forEach(suite => {
        console.log(`\n${suite.testFilePath.replace(process.cwd(), '')}`);
        
        // Print test results
        suite.testResults.forEach(test => {
          const icon = test.status === 'passed' ? '✓' : '✗';
          const time = test.duration ? `(${Math.round(test.duration)}ms)` : '';
          console.log(`  ${icon} ${test.title} ${time}`);
        });
      });
      
      console.log(`\nTime: ${(results.startTime ? (Date.now() - results.startTime) / 1000 : 0).toFixed(1)}s`);
    }
  }

  getLastError() {
    return null;
  }
}

module.exports = ConsolidatedReporter; 