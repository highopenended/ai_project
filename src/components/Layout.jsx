// Layout.js
import React from 'react';
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import ChatHistory from "./ChatHistory";
import { useState } from "react";

function Layout({ children }) {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);

    const handleSelectConversation = (messages, conversationId) => {
        setSelectedMessages(messages);
        setSelectedConversationId(conversationId);
    };

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
        <div className="min-h-screen w-full flex flex-col bg-gray-900">
            <nav className="w-full bg-gray-800 py-4 shadow-lg">
                <div className="max-w-4xl mx-auto flex justify-center space-x-8 font-medieval">
                    {!currentUser && (
                        <Link to="/" className="text-gray-300 hover:text-gray-100 transition duration-300 text-lg">
                            Login
                        </Link>
                    )}
                    <Link to="/home" className="text-gray-300 hover:text-gray-100 transition duration-300 text-lg">
                        Home
                    </Link>
                    {currentUser && (
                        <>
                            <button
                                onClick={handleLogout}
                                className="text-gray-300 hover:text-gray-100 transition duration-300 text-lg"
                            >
                                Log Out
                            </button>
                        </>
                    )}
                </div>
            </nav>

            <main className="flex-1 flex">
                {currentUser && (
                    <div className="flex w-full">
                        <div className="w-64 bg-gray-800 border-r border-gray-700">
                            <ChatHistory 
                                onSelectConversation={handleSelectConversation}
                            />
                        </div>
                        <div className="flex-1">
                            {React.cloneElement(children, {
                                initialMessages: selectedMessages,
                                conversationId: selectedConversationId
                            })}
                        </div>
                    </div>
                )}
                {!currentUser && (
                    <div className="flex items-center justify-center flex-1">
                        {children}
                    </div>
                )}
            </main>
        </div>
    );
}

Layout.propTypes = {
    children: PropTypes.node.isRequired
};

export default Layout;
