// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isInitialized } from "../firebaseConfig";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

// eslint-disable-next-line react/prop-types
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        // Wait for Firebase to initialize
        isInitialized.then(() => {
            setInitialized(true);
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                setCurrentUser(user);
                setLoading(false);
            });

            return () => {
                unsubscribe();
                setLoading(true);
            };
        });
    }, []);

    const value = {
        currentUser,
        loading: loading || !initialized
    };

    // Don't render anything until Firebase is ready
    if (!initialized || loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
