import {
    act,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from "vitest";
import api, {
    ADMIN_UNAUTHORIZED_EVENT,
    initializeCsrf,
} from "../api/api";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "./useAuth";

vi.mock("../api/api", () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
    ADMIN_UNAUTHORIZED_EVENT:
        "admin-session-expired",
    initializeCsrf: vi.fn(),
}));

function AuthConsumer() {
    const {
        admin,
        authenticated,
        loading,
        sessionExpired,
        login,
        logout,
        clearSessionExpired,
    } = useAuth();

    function handleLogin() {
        void login(
            "test-admin",
            "secret"
        );
    }

    function handleLogout() {
        void logout().catch(() => {
            /*
             * Testkomponenten fångar felet
             * eftersom det verkliga UI:t
             * ansvarar för att visa det.
             */
        });
    }

    return (
        <div>
            <p>
                {loading
                    ? "loading"
                    : "ready"}
            </p>

            <p>
                {authenticated
                    ? `admin:${admin.username}`
                    : "anonymous"}
            </p>

            <p>
                {sessionExpired
                    ? "session-expired"
                    : "session-current"}
            </p>

            <button
                type="button"
                onClick={handleLogin}
            >
                Logga in
            </button>

            <button
                type="button"
                onClick={handleLogout}
            >
                Logga ut
            </button>

            <button
                type="button"
                onClick={
                    clearSessionExpired
                }
            >
                Rensa sessionsstatus
            </button>
        </div>
    );
}

function renderProvider() {
    return render(
        <AuthProvider>
            <AuthConsumer />
        </AuthProvider>
    );
}

describe("AuthProvider", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        initializeCsrf
            .mockResolvedValue();

        api.get.mockResolvedValue({
            data: {
                authenticated: false,
                username: null,
            },
        });

        api.post.mockResolvedValue({
            data: {
                authenticated: true,
                username:
                    "test-admin",
            },
        });
    });

    test(
        "restores authenticated administrator session",
        async () => {
            api.get.mockResolvedValue({
                data: {
                    authenticated: true,
                    username:
                        "test-admin",
                },
            });

            renderProvider();

            expect(
                screen.getByText(
                    "loading"
                )
            ).toBeInTheDocument();

            expect(
                await screen.findByText(
                    "admin:test-admin"
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    "session-current"
                )
            ).toBeInTheDocument();

            expect(
                initializeCsrf
            ).toHaveBeenCalledTimes(1);

            expect(
                api.get
            ).toHaveBeenCalledWith(
                "/auth/session"
            );
        }
    );

    test(
        "uses anonymous state when session request fails",
        async () => {
            api.get.mockRejectedValue(
                new Error(
                    "Session unavailable"
                )
            );

            renderProvider();

            expect(
                await screen.findByText(
                    "anonymous"
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    "ready"
                )
            ).toBeInTheDocument();
        }
    );

    test(
        "logs in and clears expired state",
        async () => {
            const user =
                userEvent.setup();

            renderProvider();

            expect(
                await screen.findByText(
                    "anonymous"
                )
            ).toBeInTheDocument();

            act(() => {
                window.dispatchEvent(
                    new CustomEvent(
                        ADMIN_UNAUTHORIZED_EVENT
                    )
                );
            });

            expect(
                screen.getByText(
                    "session-expired"
                )
            ).toBeInTheDocument();

            await user.click(
                screen.getByRole(
                    "button",
                    {
                        name:
                            "Logga in",
                    }
                )
            );

            expect(
                await screen.findByText(
                    "admin:test-admin"
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    "session-current"
                )
            ).toBeInTheDocument();

            expect(
                api.post
            ).toHaveBeenCalledWith(
                "/auth/login",
                {
                    username:
                        "test-admin",
                    password:
                        "secret",
                }
            );
        }
    );

    test(
        "clears local session when unauthorized event is received",
        async () => {
            api.get.mockResolvedValue({
                data: {
                    authenticated: true,
                    username:
                        "test-admin",
                },
            });

            renderProvider();

            expect(
                await screen.findByText(
                    "admin:test-admin"
                )
            ).toBeInTheDocument();

            act(() => {
                window.dispatchEvent(
                    new CustomEvent(
                        ADMIN_UNAUTHORIZED_EVENT
                    )
                );
            });

            expect(
                screen.getByText(
                    "anonymous"
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    "session-expired"
                )
            ).toBeInTheDocument();
        }
    );

    test(
        "allows expired session notice to be cleared",
        async () => {
            const user =
                userEvent.setup();

            renderProvider();

            expect(
                await screen.findByText(
                    "anonymous"
                )
            ).toBeInTheDocument();

            act(() => {
                window.dispatchEvent(
                    new CustomEvent(
                        ADMIN_UNAUTHORIZED_EVENT
                    )
                );
            });

            await user.click(
                screen.getByRole(
                    "button",
                    {
                        name:
                            "Rensa sessionsstatus",
                    }
                )
            );

            expect(
                screen.getByText(
                    "session-current"
                )
            ).toBeInTheDocument();
        }
    );

    test(
        "logs out locally even when request fails",
        async () => {
            const user =
                userEvent.setup();

            api.get.mockResolvedValue({
                data: {
                    authenticated: true,
                    username:
                        "test-admin",
                },
            });

            api.post.mockRejectedValue(
                new Error(
                    "Logout unavailable"
                )
            );

            renderProvider();

            expect(
                await screen.findByText(
                    "admin:test-admin"
                )
            ).toBeInTheDocument();

            await user.click(
                screen.getByRole(
                    "button",
                    {
                        name:
                            "Logga ut",
                    }
                )
            );

            await waitFor(() => {
                expect(
                    screen.getByText(
                        "anonymous"
                    )
                ).toBeInTheDocument();
            });

            expect(
                screen.getByText(
                    "session-current"
                )
            ).toBeInTheDocument();

            expect(
                api.post
            ).toHaveBeenCalledWith(
                "/auth/logout"
            );
        }
    );
});