import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./components/pages/Login.jsx";
import Home from "./components/pages/Home.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

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

// Wrapper component to handle location state
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
