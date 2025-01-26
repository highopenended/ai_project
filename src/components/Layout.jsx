// Layout.js
import { Link, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import ChatHistory from "./ChatHistory";
import '../styles/Layout.css';

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
                        <Link to="/home" className="nav-link">
                            Home
                        </Link>
                    )}
                    {currentUser && (
                        <button
                            onClick={handleLogout}
                            className="nav-link"
                        >
                            Log Out
                        </button>
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
