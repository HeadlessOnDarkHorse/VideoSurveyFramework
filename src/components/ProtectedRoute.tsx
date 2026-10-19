import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { pb } from '../lib/pocketbase';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if the user has a valid auth token
    setIsAuthenticated(pb.authStore.isValid);
    setIsChecking(false);

    // Subscribe to auth state changes to force re-render if they logout in another tab
    const unsubscribe = pb.authStore.onChange((token) => {
      setIsAuthenticated(!!token);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (isChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-900">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect them to the /sign-in page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
