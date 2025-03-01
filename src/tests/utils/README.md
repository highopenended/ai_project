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

## Test Suites

### Authentication Tests

The authentication test suite verifies user login, signup, and logout functionality.

#### Login Component Tests

Located in `src/tests/unit/pages/login/user-interaction.test.jsx`

##### Form Validation
- ✅ Should validate email format
- ✅ Should require password field
- ✅ Should disable submit button when fields are empty

##### Email/Password Login
- ✅ Should call signInWithEmailAndPassword with correct credentials
- ✅ Should navigate to home on successful login
- ✅ Should display error message on failed login

##### Google Authentication
- ✅ Should call signInWithPopup with Google provider
- ✅ Should navigate to home on successful Google login
- ✅ Should display error message on failed Google login

##### Account Creation
- ✅ Should toggle between login and signup modes
- ✅ Should call createUserWithEmailAndPassword with correct credentials
- ✅ Should navigate to home on successful account creation
- ✅ Should display error message on failed account creation

##### Logout Functionality
- ✅ Should call signOut when logout is triggered
- ✅ Should navigate to login page after logout
- ✅ Should clear user context after logout

## Best Practices

- Use the test summary utility in all test files for consistent output
- Keep test utilities DRY and reusable
- Document any new utilities in this README 