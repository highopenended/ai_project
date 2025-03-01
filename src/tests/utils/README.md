# Test Utilities

This directory contains utility functions to enhance the testing experience in the project.

## Available Utilities

### Test Summary

The `test-summary.js` utility provides a clean summary of test results and suppresses noisy `act()` warnings.

#### Features

- Suppresses React `act()` warnings that clutter the test output
- Collects test results and displays them in a clean, readable format
- Shows a summary of passed/failed tests with checkmarks and X marks
- Displays timing information for each test and total execution time
- Works with any Jest test file

#### Usage

1. Import the utility in your test file:

```javascript
import { setupTestSummary } from '../utils/test-summary';
```

2. Call the setup function at the top of your test file:

```javascript
setupTestSummary();
```

3. Write your tests as usual. The summary will be displayed after all tests are complete:

```
=== TEST SUMMARY ===
✅ Component renders without crashing (66ms)
✅ should render login form elements correctly (27ms)

Results: ✅ ALL TESTS PASSED (2 total)
Total time: 93ms
===================
```

#### Example

```javascript
/* global jest, describe, beforeEach, test, expect */
import React from 'react';
import { render } from "@testing-library/react";
import { setupTestSummary } from "../utils/test-summary";
import MyComponent from "../components/MyComponent";

// Setup test summary
setupTestSummary();

describe("MyComponent Tests", () => {
  test("renders without crashing", () => {
    expect(() => render(<MyComponent />)).not.toThrow();
  });
  
  test("displays correct text", () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText("Hello World")).toBeInTheDocument();
  });
});
```

## Best Practices

- Use the test summary utility in all test files for consistent output
- Keep test utilities DRY and reusable
- Document any new utilities in this README 