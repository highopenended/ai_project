/**
 * Test Runner Script
 * 
 * This script runs all tests in the project and displays a clean summary of the results.
 * It can be run with `node src/tests/run-tests.js` or added to package.json scripts.
 */

import { spawnSync } from 'child_process';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
};

// Run all tests and display a clean summary
function runTests() {
  console.log(`${colors.bright}${colors.blue}=== Running All Tests ===${colors.reset}\n`);
  
  // Run all tests with npm test
  const result = spawnSync('npm', ['test'], {
    stdio: 'inherit', // Show output directly
    shell: true
  });
  
  // Print summary
  console.log(`\n${colors.bright}${colors.blue}=== Test Summary ===${colors.reset}\n`);
  
  if (result.status === 0) {
    console.log(`${colors.bgGreen}${colors.white} ALL TESTS PASSED ${colors.reset}\n`);
  } else {
    console.log(`${colors.bgRed}${colors.white} SOME TESTS FAILED ${colors.reset}\n`);
  }
  
  console.log(`${colors.blue}====================${colors.reset}\n`);
  
  return result.status === 0;
}

// Run the tests
const success = runTests();
process.exit(success ? 0 : 1); 