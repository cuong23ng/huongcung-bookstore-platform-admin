import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AdminAuthService } from "../services/AdminAuthService";
import type { StaffRole } from "../models/Staff";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: StaffRole | StaffRole[];
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<StaffRole>('ROLE_ADMIN');
  const location = useLocation();

  useEffect(() => {
    const authService = AdminAuthService.getInstance();
    const authenticated = authService.isAuthenticated();
    setIsAuthenticated(authenticated);

    if (authenticated) {
      const userInfo = authService.getAuthData();
      if (userInfo) {
        let role: StaffRole;
        role = userInfo.roles[0];
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

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    console.log(userRole);
    if (!userRole || !requiredRoles.includes(userRole)) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

