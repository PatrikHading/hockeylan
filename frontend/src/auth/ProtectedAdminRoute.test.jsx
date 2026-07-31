import { render, screen } from "@testing-library/react";
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
import ProtectedAdminRoute from "./ProtectedAdminRoute";
import { useAuth } from "./useAuth";

vi.mock("./useAuth", () => ({
    useAuth: vi.fn(),
}));

function LoginPage() {
    const location = useLocation();

    return (
        <div>
            <p>Login page</p>
            <p data-testid="return-path">
                {location.state?.from?.pathname ?? "missing"}
            </p>
        </div>
    );
}

function renderRoutes(initialPath = "/admin") {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route
                    path="/admin/login"
                    element={<LoginPage />}
                />

                <Route element={<ProtectedAdminRoute />}>
                    <Route
                        path="/admin"
                        element={<p>Protected admin page</p>}
                    />

                    <Route
                        path="/admin/history"
                        element={<p>Protected history page</p>}
                    />
                </Route>
            </Routes>
        </MemoryRouter>
    );
}

describe("ProtectedAdminRoute", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("redirects anonymous visitors to login", () => {
        useAuth.mockReturnValue({
            authenticated: false,
            loading: false,
        });

        renderRoutes();

        expect(
            screen.getByText("Login page")
        ).toBeInTheDocument();

        expect(
            screen.queryByText("Protected admin page")
        ).not.toBeInTheDocument();
    });

    test("preserves the requested admin location during redirect", () => {
        useAuth.mockReturnValue({
            authenticated: false,
            loading: false,
        });

        renderRoutes("/admin/history");

        expect(
            screen.getByTestId("return-path")
        ).toHaveTextContent("/admin/history");
    });

    test("renders admin page for authenticated administrator", () => {
        useAuth.mockReturnValue({
            authenticated: true,
            loading: false,
        });

        renderRoutes();

        expect(
            screen.getByText("Protected admin page")
        ).toBeInTheDocument();
    });

    test("shows an accessible loading state while session is checked", () => {
        useAuth.mockReturnValue({
            authenticated: false,
            loading: true,
        });

        renderRoutes();

        const status = screen.getByRole("status");

        expect(status).toHaveAttribute("aria-live", "polite");
        expect(status).toHaveAttribute("aria-busy", "true");
        expect(status).toHaveTextContent(
            /kontrollerar administratörssession/i
        );

        expect(
            screen.queryByText("Login page")
        ).not.toBeInTheDocument();
    });
});