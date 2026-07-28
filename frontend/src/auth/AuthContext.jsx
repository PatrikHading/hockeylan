import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import api, {
    ADMIN_UNAUTHORIZED_EVENT,
    initializeCsrf,
} from "../api/api";
import { AuthContext } from "./useAuth";

export function AuthProvider({ children }) {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshSession = useCallback(async () => {
        try {
            await initializeCsrf();

            const response = await api.get("/auth/session");

            if (response.data.authenticated) {
                setAdmin({
                    username: response.data.username,
                });
            } else {
                setAdmin(null);
            }
        } catch {
            setAdmin(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSession();
    }, [refreshSession]);

    useEffect(() => {
        function handleUnauthorized() {
            setAdmin(null);
        }

        window.addEventListener(
            ADMIN_UNAUTHORIZED_EVENT,
            handleUnauthorized
        );

        return () => {
            window.removeEventListener(
                ADMIN_UNAUTHORIZED_EVENT,
                handleUnauthorized
            );
        };
    }, []);

    async function login(username, password) {
        await initializeCsrf();

        const response = await api.post("/auth/login", {
            username,
            password,
        });

        setAdmin({
            username: response.data.username,
        });
    }

    async function logout() {
        try {
            await initializeCsrf();
            await api.post("/auth/logout");
        } finally {
            setAdmin(null);

            await initializeCsrf().catch(() => {
                // A new CSRF-token can be fetched during the next request.
            });
        }
    }

    const value = useMemo(
        () => ({
            admin,
            authenticated: Boolean(admin),
            loading,
            login,
            logout,
            refreshSession,
        }),
        [admin, loading, refreshSession]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}