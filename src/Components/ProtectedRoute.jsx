import { Navigate } from "react-router-dom";


export default function ProtectedRoute({ user, children }) {
    if (user === undefined) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-[#161a26] text-white">
            Checking session...
          </div>
        );
      }
    
      if (!user) {
        return <Navigate to="/login" replace />;
      }

      return children;
    }