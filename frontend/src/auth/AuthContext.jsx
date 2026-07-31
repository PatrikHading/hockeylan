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

export function AuthProvider({
                                 children,
                             }) {
    const [admin, setAdmin] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [
        sessionExpired,
        setSessionExpired,
    ] = useState(false);

    const refreshSession =
        useCallback(async () => {
            try {
                await initializeCsrf();

                const response =
                    await api.get(
                        "/auth/session"
                    );

                if (
                    response
                        .data
                        .authenticated
                ) {
                    setAdmin({
                        username:
                        response
                            .data
                            .username,
                    });

                    setSessionExpired(
                        false
                    );
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
            setSessionExpired(true);
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

    async function login(
        username,
        password
    ) {
        await initializeCsrf();

        const response =
            await api.post(
                "/auth/login",
                {
                    username,
                    password,
                }
            );

        setAdmin({
            username:
            response.data.username,
        });

        setSessionExpired(false);
    }

    async function logout() {
        try {
            await initializeCsrf();

            await api.post(
                "/auth/logout"
            );
        } finally {
            setAdmin(null);
            setSessionExpired(false);

            await initializeCsrf()
                .catch(() => {
                    /*
                     * En ny CSRF-token
                     * hämtas inför nästa
                     * skrivande anrop.
                     */
                });
        }
    }

    const clearSessionExpired =
        useCallback(() => {
            setSessionExpired(false);
        }, []);

    const value =
        useMemo(
            () => ({
                admin,
                authenticated:
                    Boolean(admin),
                loading,
                sessionExpired,
                login,
                logout,
                refreshSession,
                clearSessionExpired,
            }),
            [
                admin,
                loading,
                sessionExpired,
                refreshSession,
                clearSessionExpired,
            ]
        );

    return (
        <AuthContext.Provider
            value={value}
        >
            {children}
        </AuthContext.Provider>
    );
}