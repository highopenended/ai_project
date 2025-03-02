/**
 * Silent Jest Reporter
 * 
 * This reporter suppresses all output from Jest, allowing our custom test-summary.js
 * to handle the output formatting.
 */

class SilentReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  // These methods are called by Jest but we don't do anything with them
  onRunStart() {}
  onTestStart() {}
  onTestResult() {}
  onRunComplete() {}
  getLastError() {
    return null;
  }
}

module.exports = SilentReporter; 