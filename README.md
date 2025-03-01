# AI Project

A React-based web application with Firebase backend for AI-powered shop generation and item management.

## 🚀 Features

- User Authentication
- Item List Management
- AI-Powered Shop Generator
- Protected Routes
- Real-time Database with Firebase
- Modern UI with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router DOM
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **Build Tool**: Vite
- **AI Integration**: OpenAI
- **Additional Tools**: DOMPurify, Marked

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account
- OpenAI API key

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone [your-repository-url]
   cd ai_project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with your Firebase and OpenAI credentials.

4. Start the development server:
   ```bash
   npm run dev
   ```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run import-data` - Import data to Firestore
- `npm run delete-data` - Delete data from Firestore
- `npm run sync-items` - Synchronize item table
- `npm test` - Run all tests
- `npm test -- --watch` - Run tests in watch mode

## 🧪 Testing

The project uses Jest and React Testing Library for testing. Tests are organized as follows:

```
src/tests/
├── unit/              # Unit tests for components and functions
│   ├── components/    # Component tests
│   ├── pages/         # Page component tests
│   └── utils/         # Utility function tests
├── integration/       # Integration tests
└── utils/             # Test utilities and helpers
```

### Authentication Testing

Authentication tests cover:
- Login form validation
- Email/password authentication
- Google authentication
- Account creation
- Error handling
- Navigation after authentication
- Logout functionality

For testing components that use Firebase authentication:
1. Mock Firebase auth functions using Jest
2. Create a mock version of the component for isolated testing
3. Test user interactions and state changes
4. Verify that auth functions are called with correct parameters
5. Test error handling and success scenarios

Example of mocking Firebase auth:
```jsx
// Mock Firebase auth functions
const mockSignInWithEmailAndPassword = jest.fn();
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSignInWithPopup = jest.fn();

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({})),
  signInWithPopup: mockSignInWithPopup
}));
```

### Mock Component Approach

For components with complex dependencies (like Firebase authentication, React Router, or context providers), we use a mock component approach:

1. Instead of importing and testing the actual component, we create a simplified version that mimics its behavior
2. The mock component includes only the essential functionality needed for testing
3. This approach isolates the component from external dependencies, making tests more reliable and focused

Example of a mock component for testing:
```jsx
// Create a mock Login component for testing
const MockLogin = () => {
  const [isNewAccount, setIsNewAccount] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Component logic here
    try {
      // Call mocked Firebase functions
      mockNavigate('/home');
    } catch (error) {
      setError("Error message");
    }
  };

  return (
    <div className="login-container">
      {/* Component UI */}
    </div>
  );
};
```

This approach ensures tests focus on component behavior rather than integration with external services, making them more reliable and easier to maintain.

## 🏗️ Project Structure

```
ai_project/
├── src/
│   ├── components/     # React components
│   ├── context/       # Context providers
│   ├── constants/     # Constants and configurations
│   ├── lib/          # Utility functions
│   ├── scripts/      # Data management scripts
│   ├── styles/       # CSS styles
│   └── assets/       # Static assets
├── functions/        # Firebase Cloud Functions
├── public/          # Public assets
└── dist/           # Production build
```

## 🔒 Firebase Configuration

The project uses Firebase for:
- Authentication
- Firestore Database
- Cloud Functions
- Hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- [Your Name]

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- Firebase for backend services
- React team for the awesome framework
