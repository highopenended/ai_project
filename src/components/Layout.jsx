// Layout.js
import { useState, useCallback } from 'react';
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import ChatHistory from "./ChatHistory";
import '../styles/Layout.css';

function Layout({ children }) {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [selectedConversationId, setSelectedConversationId] = useState(null);

    const handleSelectConversation = useCallback((messages, conversationId) => {
        if (selectedConversationId === conversationId) return;
        
        setSelectedConversationId(conversationId);
        navigate('/home', {
            state: {
                messages,
                conversationId
            },
            replace: true
        });
    }, [navigate, selectedConversationId]);

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
                    <Link to="/home" className="nav-link">
                        Home
                    </Link>
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
                            <ChatHistory 
                                onSelectConversation={handleSelectConversation}
                                selectedId={selectedConversationId}
                            />
                        </div>
                        <div className="content-area">
                            {children}
                        </div>
                    </div>
                )}
                {!currentUser && children}
            </main>
        </div>
    );
}

Layout.propTypes = {
    children: PropTypes.node.isRequired
};

export default Layout;
