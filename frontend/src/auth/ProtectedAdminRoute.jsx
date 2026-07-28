import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./useAuth";

export default function ProtectedAdminRoute() {
    const { authenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="py-12 text-center">
                <p>Kontrollerar administratörssession...</p>
            </div>
        );
    }

    if (!authenticated) {
        return (
            <Navigate
                to="/admin/login"
                replace
                state={{ from: location }}
            />
        );
    }

    return <Outlet />;
}