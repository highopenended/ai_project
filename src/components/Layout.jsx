// Layout.js
import { Link, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import ChatHistory from "./pages/home/history/ChatHistory";
import '../styles/Layout.css';

/**
 * Layout Component
 * 
 * Main layout component that provides the application structure.
 * Handles the top navigation bar and sidebar layout when authenticated.
 * 
 * Features:
 * - Conditional rendering based on authentication state
 * - Navigation links for Login/Home/Shop Generator
 * - Logout functionality
 * - Chat history sidebar for authenticated users
 */
function Layout() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log("User logged out");
            navigate("/")
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    return (
        <div className="layout">
            <nav className="nav">
                <div className="nav-container">
                    {!currentUser && (
                        <Link to="/" className="nav-link">
                            Login
                        </Link>
                    )}
                    {currentUser && (
                        <>
                            <Link to="/home" className="nav-link">
                                Home
                            </Link>
                            <Link to="/shop-generator" className="nav-link">
                                Shop Generator
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="nav-link"
                            >
                                Log Out
                            </button>
                            <div className="user-status-nav">
                                Logged in as {currentUser.email}
                            </div>
                        </>
                    )}
                </div>
            </nav>

            <main className="main-content">
                {currentUser && (
                    <div className="layout-with-sidebar">
                        <div className="sidebar">
                            <ChatHistory />
                        </div>
                        <div className="content-area">
                            <Outlet />
                        </div>
                    </div>
                )}
                {!currentUser && <Outlet />}
            </main>
        </div>
    );
}

export default Layout;
