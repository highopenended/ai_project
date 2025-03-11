// src/context/AuthContext.js
// eslint-disable-next-line no-unused-vars
import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isInitialized } from "../firebaseConfig";
import { clearShopCache } from "../components/pages/shopgenerator/utils/shopCacheUtils";
import { debug, configureDebug } from "../utils/debugUtils";

const AuthContext = createContext();

// Configure debug for auth module
configureDebug({
    areas: {
        auth: false, // Set to true to enable debugging for auth
    }
});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

// eslint-disable-next-line react/prop-types
export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        currentUser: null,
        loading: true,
        initialized: false,
        error: null,
        debugMessages: []
    });

    // Add a debug message to the state
    const addDebugMessage = (message) => {
        setAuthState(prev => ({
            ...prev,
            debugMessages: [...prev.debugMessages, {
                timestamp: new Date().toISOString(),
                message
            }].slice(-5) // Keep last 5 messages
        }));
    };

    useEffect(() => {
        debug('auth', '🚀 Starting auth initialization');
        addDebugMessage('Starting auth initialization');
        
        let isMounted = true;
        let unsubscribeAuth = null;
        let previousUser = null;

        const initializeAuth = async () => {
            try {
                debug('auth', '⌛ Waiting for Firebase');
                addDebugMessage('Waiting for Firebase');
                
                // Wait for Firebase to initialize
                if (!isInitialized) {
                    setTimeout(initializeAuth, 100);
                    return;
                }
                
                if (!isMounted) {
                    debug('auth', '🛑 Unmounted during init');
                    return;
                }

                debug('auth', '√ Firebase ready');
                addDebugMessage('Firebase initialized');
                setAuthState(prev => ({ ...prev, initialized: true }));

                unsubscribeAuth = onAuthStateChanged(
                    auth,
                    (user) => {
                        if (!isMounted) return;
                        const status = user ? '👤 User logged in' : '❌ No user';
                        debug('auth', status, user?.email);
                        addDebugMessage(status + (user ? `: ${user.email}` : ''));
                        
                        // Check if user logged out
                        if (previousUser && !user) {
                            debug('auth', 'User logged out, clearing shop cache');
                            clearShopCache(previousUser.uid);
                        }
                        
                        // Update previous user reference
                        previousUser = user;
                        
                        setAuthState(prev => ({
                            ...prev,
                            currentUser: user,
                            loading: false,
                            error: null
                        }));
                    },
                    (error) => {
                        if (!isMounted) return;
                        debug('auth', '💥 Auth error:', error);
                        
                        setAuthState(prev => ({
                            ...prev,
                            error: error.message,
                            loading: false
                        }));
                        
                        addDebugMessage(`Error: ${error.message}`);
                    }
                );
            } catch (error) {
                debug('auth', '💥 Init error:', error);
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
            debug('auth', '🧹 Cleaning up');
            isMounted = false;
            if (unsubscribeAuth) {
                unsubscribeAuth();
            }
        };
    }, []);

    if (authState.loading && !authState.error) {
        return (
            <>
                {/* Loading state */}
                <div data-testid="loading">Loading...</div>
            </>
        );
    }
    
    if (authState.error) {
        return (
            <>
                {/* Error state */}
                <div data-testid="error">Error: {authState.error}</div>
            </>
        );
    }

    return (
        <>
            <AuthContext.Provider
                value={{
                    currentUser: authState.currentUser,
                    loading: authState.loading,
                    error: authState.error,
                }}
            >
                {children}
            </AuthContext.Provider>
        </>
    );
};
