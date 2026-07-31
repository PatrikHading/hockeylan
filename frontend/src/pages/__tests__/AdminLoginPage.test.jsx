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
} from "react-router";
import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from "vitest";
import { useAuth } from "../../auth/useAuth";
import AdminLoginPage from "../AdminLoginPage";

vi.mock("../../auth/useAuth", () => ({
    useAuth: vi.fn(),
}));

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
                    element={<p>Admin page</p>}
                />

                <Route
                    path="/admin/loans"
                    element={<p>Loan history page</p>}
                />
            </Routes>
        </MemoryRouter>
    );
}

describe("AdminLoginPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("renders administrator login form", () => {
        useAuth.mockReturnValue({
            authenticated: false,
            login: vi.fn(),
        });

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
            screen.getByLabelText(/lösenord/i)
        ).toHaveAttribute(
            "autocomplete",
            "current-password"
        );

        expect(
            screen.getByRole("button", {
                name: /logga in/i,
            })
        ).toBeEnabled();
    });

    test("trims username and returns to requested admin route", async () => {
        const user = userEvent.setup();
        const login = vi.fn().mockResolvedValue();

        useAuth.mockReturnValue({
            authenticated: false,
            login,
        });

        renderLogin({
            locationState: {
                from: {
                    pathname: "/admin/loans",
                },
            },
        });

        await user.type(
            screen.getByLabelText(/användarnamn/i),
            "  test-admin  "
        );

        await user.type(
            screen.getByLabelText(/lösenord/i),
            "StrongTestPassword-123!"
        );

        await user.click(
            screen.getByRole("button", {
                name: /logga in/i,
            })
        );

        await waitFor(() => {
            expect(login).toHaveBeenCalledWith(
                "test-admin",
                "StrongTestPassword-123!"
            );
        });

        expect(
            await screen.findByText(
                "Loan history page"
            )
        ).toBeInTheDocument();
    });

    test("shows rate limit message after too many attempts", async () => {
        const user = userEvent.setup();

        useAuth.mockReturnValue({
            authenticated: false,
            login: vi.fn().mockRejectedValue({
                response: {
                    status: 429,
                },
            }),
        });

        renderLogin();

        await user.type(
            screen.getByLabelText(/användarnamn/i),
            "test-admin"
        );

        await user.type(
            screen.getByLabelText(/lösenord/i),
            "wrong-password"
        );

        await user.click(
            screen.getByRole("button", {
                name: /logga in/i,
            })
        );

        expect(
            await screen.findByText(
                /för många inloggningsförsök/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: /logga in/i,
            })
        ).toBeEnabled();
    });

    test("redirects authenticated administrator to admin page", () => {
        useAuth.mockReturnValue({
            authenticated: true,
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