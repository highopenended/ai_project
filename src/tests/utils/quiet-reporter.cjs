/**
 * Quiet Jest Reporter
 * 
 * This reporter suppresses the RUNS output and only shows the test summary.
 */

class QuietReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunStart() {
    console.log('Running tests...');
  }

  onTestStart() {
    // Do nothing
  }

  onTestResult(test, testResult) {
    // Do nothing during test runs
  }

  onRunComplete(contexts, results) {
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

  getLastError() {
    return null;
  }
}

module.exports = QuietReporter; 