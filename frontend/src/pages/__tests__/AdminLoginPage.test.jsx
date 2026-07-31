import {
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    MemoryRouter,
    Route,
    Routes,
    useLocation,
} from "react-router";
import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from "vitest";
import { getErrorMessage } from "../../api/api";
import { useAuth } from "../../auth/useAuth";
import AdminLoginPage from "../AdminLoginPage";

vi.mock("../../auth/useAuth", () => ({
    useAuth: vi.fn(),
}));

vi.mock("../../api/api", () => ({
    getErrorMessage: vi.fn(),
}));

function DestinationPage({
                             text,
                         }) {
    const location = useLocation();

    return (
        <div>
            <p>{text}</p>
            <p data-testid="destination-search">
                {location.search}
            </p>
            <p data-testid="destination-hash">
                {location.hash}
            </p>
        </div>
    );
}

function renderLogin({
                         initialEntry = "/admin/login",
                         locationState,
                     } = {}) {
    const entry =
        typeof initialEntry === "string"
            ? {
                pathname: initialEntry,
                state: locationState,
            }
            : initialEntry;

    return render(
        <MemoryRouter initialEntries={[entry]}>
            <Routes>
                <Route
                    path="/admin/login"
                    element={<AdminLoginPage />}
                />

                <Route
                    path="/admin"
                    element={
                        <DestinationPage text="Admin page" />
                    }
                />

                <Route
                    path="/admin/loans"
                    element={
                        <DestinationPage text="Loan history page" />
                    }
                />
            </Routes>
        </MemoryRouter>
    );
}

function mockAnonymousAuth(overrides = {}) {
    useAuth.mockReturnValue({
        authenticated: false,
        sessionExpired: false,
        login: vi.fn(),
        ...overrides,
    });
}

async function fillLoginForm(
    user,
    {
        username = "test-admin",
        password = "StrongTestPassword-123!",
    } = {}
) {
    await user.type(
        screen.getByLabelText(/användarnamn/i),
        username
    );

    await user.type(
        screen.getByLabelText(/lösenord/i),
        password
    );
}

describe("AdminLoginPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        getErrorMessage.mockReturnValue(
            "Inloggningen misslyckades. Kontrollera dina uppgifter och försök igen."
        );
    });

    test("renders an accessible administrator login form", () => {
        mockAnonymousAuth();

        renderLogin();

        expect(
            screen.getByRole("heading", {
                name: /administratörsinloggning/i,
            })
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(/användarnamn/i)
        ).toHaveAttribute(
            "autocomplete",
            "username"
        );

        expect(
            screen.getByLabelText(/användarnamn/i)
        ).toHaveAttribute(
            "autocapitalize",
            "none"
        );

        expect(
            screen.getByLabelText(/lösenord/i)
        ).toHaveAttribute(
            "autocomplete",
            "current-password"
        );

        expect(
            screen.getByRole("button", {
                name: "Logga in",
            })
        ).toBeEnabled();
    });

    test("shows a clear message when the session has expired", () => {
        mockAnonymousAuth({
            sessionExpired: true,
        });

        renderLogin();

        const status = screen.getByRole("status", {
            name: /din session har gått ut/i,
        });

        expect(status).toHaveTextContent(
            /logga in igen för att fortsätta där du var/i
        );
    });

    test("trims username and returns to requested admin route", async () => {
        const user = userEvent.setup();
        const login = vi.fn().mockResolvedValue();

        mockAnonymousAuth({ login });

        renderLogin({
            locationState: {
                from: {
                    pathname: "/admin/loans",
                    search: "?status=ACTIVE&page=2",
                    hash: "#results",
                },
            },
        });

        await fillLoginForm(user, {
            username: "  test-admin  ",
        });

        await user.click(
            screen.getByRole("button", {
                name: "Logga in",
            })
        );

        await waitFor(() => {
            expect(login).toHaveBeenCalledWith(
                "test-admin",
                "StrongTestPassword-123!"
            );
        });

        expect(
            await screen.findByText("Loan history page")
        ).toBeInTheDocument();

        expect(
            screen.getByTestId("destination-search")
        ).toHaveTextContent("?status=ACTIVE&page=2");

        expect(
            screen.getByTestId("destination-hash")
        ).toHaveTextContent("#results");
    });

    test("rejects a protocol-relative return address", () => {
        useAuth.mockReturnValue({
            authenticated: true,
            sessionExpired: false,
            login: vi.fn(),
        });

        renderLogin({
            locationState: {
                from: {
                    pathname: "//malicious.example",
                },
            },
        });

        expect(
            screen.getByText("Admin page")
        ).toBeInTheDocument();
    });

    test("does not redirect back to the login page", () => {
        useAuth.mockReturnValue({
            authenticated: true,
            sessionExpired: false,
            login: vi.fn(),
        });

        renderLogin({
            locationState: {
                from: {
                    pathname: "/admin/login",
                },
            },
        });

        expect(
            screen.getByText("Admin page")
        ).toBeInTheDocument();
    });

    test("uses normalized API message after failed login", async () => {
        const user = userEvent.setup();

        const apiError = {
            apiCode: "INVALID_CREDENTIALS",
        };

        const login = vi.fn().mockRejectedValue(apiError);

        getErrorMessage.mockReturnValue(
            "Felaktigt användarnamn eller lösenord."
        );

        mockAnonymousAuth({ login });

        renderLogin();

        await fillLoginForm(user);

        await user.click(
            screen.getByRole("button", {
                name: "Logga in",
            })
        );

        expect(
            await screen.findByText(
                "Felaktigt användarnamn eller lösenord."
            )
        ).toBeInTheDocument();

        expect(getErrorMessage).toHaveBeenCalledWith(
            apiError,
            "Inloggningen misslyckades. Kontrollera dina uppgifter och försök igen."
        );
    });

    test("uses normalized rate limit message", async () => {
        const user = userEvent.setup();

        getErrorMessage.mockReturnValue(
            "För många anrop. Vänta en stund och försök igen."
        );

        mockAnonymousAuth({
            login: vi.fn().mockRejectedValue({
                apiCode: "RATE_LIMIT_EXCEEDED",
                retryAfterSeconds: 60,
            }),
        });

        renderLogin();

        await fillLoginForm(user, {
            password: "wrong-password",
        });

        await user.click(
            screen.getByRole("button", {
                name: "Logga in",
            })
        );

        expect(
            await screen.findByText(
                /för många anrop/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Logga in",
            })
        ).toBeEnabled();
    });

    test("clears password and focuses error after failed login", async () => {
        const user = userEvent.setup();

        mockAnonymousAuth({
            login: vi.fn().mockRejectedValue({
                apiCode: "INVALID_CREDENTIALS",
            }),
        });

        renderLogin();

        await fillLoginForm(user);

        await user.click(
            screen.getByRole("button", {
                name: "Logga in",
            })
        );

        const alert = await screen.findByRole("alert", {
            name: /inloggningen misslyckades/i,
        });

        expect(
            screen.getByLabelText(/lösenord/i)
        ).toHaveValue("");

        expect(alert.parentElement).toHaveFocus();
    });

    test("prevents duplicate submissions while login is pending", async () => {
        const user = userEvent.setup();

        let resolveLogin;

        const login = vi.fn(
            () =>
                new Promise((resolve) => {
                    resolveLogin = resolve;
                })
        );

        mockAnonymousAuth({ login });

        renderLogin();

        await fillLoginForm(user);

        const submitButton = screen.getByRole(
            "button",
            {
                name: "Logga in",
            }
        );

        await user.dblClick(submitButton);

        expect(login).toHaveBeenCalledTimes(1);

        expect(
            screen.getByRole("button", {
                name: "Loggar in...",
            })
        ).toBeDisabled();

        resolveLogin();

        expect(
            await screen.findByText("Admin page")
        ).toBeInTheDocument();
    });

    test("redirects authenticated administrator to admin page", () => {
        useAuth.mockReturnValue({
            authenticated: true,
            sessionExpired: false,
            login: vi.fn(),
        });

        renderLogin();

        expect(
            screen.getByText("Admin page")
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("heading", {
                name: /administratörsinloggning/i,
            })
        ).not.toBeInTheDocument();
    });
});