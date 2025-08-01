import { useAuth } from "@/contexts/AuthContext"; // adjust path as per your project
import { Navigate } from "react-router-dom";

export const PrivateRoute = ({ children }) => {
  const { user } = useAuth(); // user state from AuthContext

  if (!user) {
    // Redirect to login if not authenticated
   return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};
