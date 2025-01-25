import { BrowserRouter as Router, Route, Routes, useLocation, useOutletContext } from "react-router-dom";
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

// Wrapper component to handle outlet context and location state
function HomeWrapper() {
    const location = useLocation();
    const { messages, selectedId, refreshHistory } = useOutletContext();
    
    return (
        <Home 
            initialMessages={messages} 
            conversationId={location.state?.conversationId || selectedId}
            refreshHistory={refreshHistory}
        />
    );
}

export default App;
