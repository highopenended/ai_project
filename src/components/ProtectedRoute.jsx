// eslint-disable-next-line no-unused-vars
import React from 'react';
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { debug, configureDebug } from "../utils/debugUtils";
import PropTypes from 'prop-types';

// Configure debug for protected route component
configureDebug({
    areas: {
        routing: false, // Set to true to enable debugging for routing
    }
});

/**
 * Protected route component that redirects to login if user is not authenticated
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {React.ReactNode} - The protected component or redirect
 */
function ProtectedRoute({ children }) {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    // Always show loading state while checking auth
    if (loading) {
        debug("routing", "Auth loading, showing loading state");
        return <div>Loading...</div>;
    }

    // If no user is logged in, redirect to login
    if (!currentUser) {
        debug("routing", "No user found, redirecting to login");
        return <Navigate to="/" state={{ from: location.pathname }} replace />;
    }

    // User is authenticated, render the protected content
    return children;
}

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired
};

export default ProtectedRoute; 