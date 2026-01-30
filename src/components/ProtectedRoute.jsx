import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { currentUser, userRole } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
