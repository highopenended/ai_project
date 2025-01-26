import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./components/pages/Login.jsx";
import Home from "./components/pages/Home.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

/**
 * App Component
 * 
 * Root component that sets up routing and authentication context.
 * Defines the main application structure and protected routes.
 * 
 * Features:
 * - Router setup with protected routes
 * - Authentication context provider
 * - Basic route structure (login, home)
 */
function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Login />} />
                        <Route path="home" element={
                            <ProtectedRoute>
                                <HomeWrapper />
                            </ProtectedRoute>
                        } />
                    </Route>
                </Routes>
            </AuthProvider>
        </Router>
    );
}

/**
 * HomeWrapper Component
 * 
 * Wrapper component that handles passing URL state to Home component.
 * Ensures proper initialization of Home with route state.
 * 
 * Features:
 * - Extracts messages and conversation ID from route state
 * - Provides defaults for new conversations
 */
function HomeWrapper() {
    const location = useLocation();
    
    return (
        <Home 
            initialMessages={location.state?.messages || []} 
            conversationId={location.state?.conversationId}
        />
    );
}

export default App;
