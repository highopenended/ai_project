import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PropTypes from 'prop-types';

const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    // Always show loading state while checking auth
    if (loading) {
        return <div>Loading...</div>;
    }

    // Immediately redirect if no user
    if (!currentUser) {
        console.log("No user found, redirecting to login");
        return <Navigate to="/" state={{ from: location.pathname }} replace />;
    }

    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired
};

export default ProtectedRoute; 