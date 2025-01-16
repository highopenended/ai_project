import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PropTypes from 'prop-types';

const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!currentUser) {
        // Redirect to login with the attempted path in state
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired
};

export default ProtectedRoute; 