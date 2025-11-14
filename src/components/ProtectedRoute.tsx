import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AdminAuthService } from "../services/AdminAuthService";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const authService = AdminAuthService.getInstance();
    const authenticated = authService.isAuthenticated();
    setIsAuthenticated(authenticated);

    if (authenticated) {
      const userInfo = authService.getAuthData();
      if (userInfo) {
        let role: string;
        if (userInfo.roles && userInfo.roles.length > 0) {
          // Get first role and normalize: remove ROLE_ prefix if present and convert to lowercase
          role = userInfo.roles[0].toLowerCase().replace(/^role_/, '');
        } else {
          role = userInfo.userType.toLowerCase();
        }
        setUserRole(role);
      }
    }
  }, []);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Check role-based access if requiredRole is specified
  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    // Normalize required roles: remove ROLE_ prefix if present and convert to lowercase
    const normalizedRequiredRoles = requiredRoles.map(r => 
      r.toLowerCase().replace(/^role_/, '')
    );
    
    console.log(userRole);
    if (!userRole || !normalizedRequiredRoles.includes(userRole)) {
      // User doesn't have required role, redirect to dashboard
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

