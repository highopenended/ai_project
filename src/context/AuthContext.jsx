// src/context/AuthContext.js
// eslint-disable-next-line no-unused-vars
import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isInitialized } from "../firebaseConfig";

const AuthContext = createContext();

// Simple debug logger
const log = (area, message, data = '') => {
    const prefix = '🔐 [Auth]';
    performance.mark(`${area}-start`);
    
    // Always log to console
    console.log(`${prefix} [${area}] ${message}`, data);
    
    performance.mark(`${area}-end`);
    performance.measure(`Auth ${area}`, `${area}-start`, `${area}-end`);
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

// eslint-disable-next-line react/prop-types
export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        currentUser: null,
        loading: true,
        initialized: false,
        error: null,
        debugMessages: [] // Store debug messages for display
    });

    // Add debug message to state
    const addDebugMessage = (message) => {
        setAuthState(prev => ({
            ...prev,
            debugMessages: [...prev.debugMessages, {
                time: new Date().toLocaleTimeString(),
                message
            }].slice(-5) // Keep last 5 messages
        }));
    };

    useEffect(() => {
        // log('Init', '🚀 Starting auth initialization');
        addDebugMessage('Starting auth initialization');
        
        let isMounted = true;
        let unsubscribeAuth = null;

        const initializeAuth = async () => {
            try {
                // log('Init', '⌛ Waiting for Firebase');
                addDebugMessage('Waiting for Firebase');
                await isInitialized;
                
                if (!isMounted) {
                    // log('Cleanup', '🛑 Unmounted during init');
                    return;
                }

                // log('Init', '√ Firebase ready');
                addDebugMessage('Firebase initialized');
                setAuthState(prev => ({ ...prev, initialized: true }));

                unsubscribeAuth = onAuthStateChanged(auth, 
                    (user) => {
                        if (!isMounted) return;
                        const status = user ? '👤 User logged in' : '❌ No user';
                        // log('Auth', status, user?.email);
                        addDebugMessage(status + (user ? `: ${user.email}` : ''));
                        
                        setAuthState(prev => ({
                            ...prev,
                            currentUser: user,
                            loading: false,
                            error: null
                        }));
                    },
                    (error) => {
                        if (!isMounted) return;
                        // log('Error', '💥 Auth error:', error);
                        // addDebugMessage(`Error: ${error.message}`);
                        
                        setAuthState(prev => ({
                            ...prev,
                            error: error.message,
                            loading: false
                        }));
                    }
                );
            } catch (error) {
                // log('Error', '💥 Init error:', error);
                addDebugMessage(`Init error: ${error.message}`);
                
                if (isMounted) {
                    setAuthState(prev => ({
                        ...prev,
                        error: "Failed to initialize authentication",
                        loading: false
                    }));
                }
            }
        };

        initializeAuth();

        return () => {
            // log('Cleanup', '🧹 Cleaning up');
            // addDebugMessage('Cleaning up auth');
            isMounted = false;
            if (unsubscribeAuth) {
                unsubscribeAuth();
            }
        };
    }, []);



    if (authState.loading && !authState.error) {
        // log('State', '⌛ Loading...');
        return (
            <>
                {/* <div>Loading...</div>
                <div style={debugStyle}>
                    <div>🔄 Auth Status: Loading</div>
                    {authState.debugMessages.map((msg, i) => (
                        <div key={i}>{msg.time}: {msg.message}</div>
                    ))}
                </div> */}
            </>
        );
    }
    

    if (authState.error) {
        // log('Error', '🚨 Error state:', authState.error);
        return (
            <>
                {/* <div>Authentication Error: {authState.error}</div>
                <div style={debugStyle}>
                    <div>❌ Auth Status: Error</div>
                    {authState.debugMessages.map((msg, i) => (
                        <div key={i}>{msg.time}: {msg.message}</div>
                    ))}
                </div> */}
            </>
        );
    }

    return (
        <>
            <AuthContext.Provider value={{
                currentUser: authState.currentUser,
                loading: authState.loading || !authState.initialized
            }}>
                {children}
            </AuthContext.Provider>
            {/* <div style={debugStyle}>
                <div>√ Auth Status: Ready</div>
                {authState.debugMessages.map((msg, i) => (
                    <div key={i}>{msg.time}: {msg.message}</div>
                ))}
            </div> */}
        </>
    );
};
