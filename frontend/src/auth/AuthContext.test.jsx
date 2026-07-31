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
        "hockeylan:admin-unauthorized",
    initializeCsrf: vi.fn(),
}));

function AuthProbe() {
    const {
        admin,
        authenticated,
        loading,
        login,
        logout,
    } = useAuth();

    async function handleLogout() {
        try {
            await logout();
        } catch {
            // Logout clears the local session in finally.
            // The rejected request is expected in the failure test.
        }
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
                    ? `authenticated:${admin.username}`
                    : "anonymous"}
            </p>

            <button
                type="button"
                onClick={() =>
                    login(
                        "test-admin",
                        "StrongTestPassword-123!"
                    )
                }
            >
                Login
            </button>

            <button
                type="button"
                onClick={handleLogout}
            >
                Logout
            </button>
        </div>
    );
}

function renderProvider() {
    return render(
        <AuthProvider>
            <AuthProbe />
        </AuthProvider>
    );
}

describe("AuthProvider", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        initializeCsrf.mockResolvedValue();
    });

    test("restores authenticated administrator session", async () => {
        api.get.mockResolvedValue({
            data: {
                authenticated: true,
                username: "test-admin",
            },
        });

        renderProvider();

        expect(
            screen.getByText("loading")
        ).toBeInTheDocument();

        expect(
            await screen.findByText(
                "authenticated:test-admin"
            )
        ).toBeInTheDocument();

        expect(
            initializeCsrf
        ).toHaveBeenCalledTimes(1);

        expect(api.get).toHaveBeenCalledWith(
            "/auth/session"
        );

        expect(
            initializeCsrf.mock
                .invocationCallOrder[0]
        ).toBeLessThan(
            api.get.mock
                .invocationCallOrder[0]
        );
    });

    test("uses anonymous state when session request fails", async () => {
        api.get.mockRejectedValue(
            new Error("Session unavailable")
        );

        renderProvider();

        expect(
            await screen.findByText("anonymous")
        ).toBeInTheDocument();

        expect(
            screen.getByText("ready")
        ).toBeInTheDocument();
    });

    test("login updates authenticated administrator", async () => {
        const user = userEvent.setup();

        api.get.mockResolvedValue({
            data: {
                authenticated: false,
                username: null,
            },
        });

        api.post.mockResolvedValue({
            data: {
                authenticated: true,
                username: "test-admin",
            },
        });

        renderProvider();

        await screen.findByText("anonymous");

        await user.click(
            screen.getByRole("button", {
                name: "Login",
            })
        );

        expect(
            await screen.findByText(
                "authenticated:test-admin"
            )
        ).toBeInTheDocument();

        expect(api.post).toHaveBeenCalledWith(
            "/auth/login",
            {
                username: "test-admin",
                password:
                    "StrongTestPassword-123!",
            }
        );

        expect(
            initializeCsrf
        ).toHaveBeenCalledTimes(2);
    });

    test("logout clears administrator even when request fails", async () => {
        const user = userEvent.setup();

        api.get.mockResolvedValue({
            data: {
                authenticated: true,
                username: "test-admin",
            },
        });

        api.post.mockRejectedValue(
            new Error("Logout unavailable")
        );

        renderProvider();

        await screen.findByText(
            "authenticated:test-admin"
        );

        await user.click(
            screen.getByRole("button", {
                name: "Logout",
            })
        );

        expect(
            await screen.findByText("anonymous")
        ).toBeInTheDocument();

        expect(api.post).toHaveBeenCalledWith(
            "/auth/logout"
        );
    });

    test("unauthorized event clears local session", async () => {
        api.get.mockResolvedValue({
            data: {
                authenticated: true,
                username: "test-admin",
            },
        });

        renderProvider();

        await screen.findByText(
            "authenticated:test-admin"
        );

        act(() => {
            window.dispatchEvent(
                new Event(
                    ADMIN_UNAUTHORIZED_EVENT
                )
            );
        });

        await waitFor(() => {
            expect(
                screen.getByText("anonymous")
            ).toBeInTheDocument();
        });
    });
});