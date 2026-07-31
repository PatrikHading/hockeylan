import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./useAuth";

export default function ProtectedAdminRoute() {
    const { authenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div
                className="py-12 text-center"
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <p className="font-medium text-slate-700">
                    Kontrollerar administratörssession...
                </p>

                <span className="sr-only">
                    Vänta medan din administratörssession kontrolleras.
                </span>
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