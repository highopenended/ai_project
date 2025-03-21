// Layout.js
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import ChatHistory from "./pages/home/history/ChatHistory";
import '../styles/Layout.css';
import { debug } from "../utils/debugUtils";

/**
 * Main layout component for the application
 * Provides navigation, header, footer, and content area
 */
function Layout() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Update this condition to include all pages that should show the chat history
    // This will show the sidebar on the home page and any path that includes 'oracle'
    const shouldShowSidebar = location.pathname === "/" || 
                             location.pathname === "/home";

    const handleLogout = async () => {
        try {
            await signOut(auth);
            debug("layout", "User logged out");
            navigate("/"); // Navigate to home page after logout
        } catch (error) {
            debug("layout", "Error logging out:", error);
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
                            <Link to="/shopgenerator" className="nav-link">
                                Shop Generator
                            </Link>
                            {/* <Link to="/item-list" className="nav-link">
                                Item List
                            </Link> */}
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
                {currentUser && shouldShowSidebar ? (
                    <div className="layout-with-sidebar">
                        <div className="sidebar">
                            <ChatHistory />
                        </div>
                        <div className="content-area">
                            <Outlet />
                        </div>
                    </div>
                ) : (
                    <div className="content-area">
                        <Outlet />
                    </div>
                )}
            </main>
        </div>
    );
}

export default Layout;
