import { render, screen } from "@testing-library/react";
import {
    MemoryRouter,
    Route,
    Routes,
} from "react-router";
import {
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

function renderRoutes(initialPath = "/admin") {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route
                    path="/admin/login"
                    element={<p>Login page</p>}
                />

                <Route element={<ProtectedAdminRoute />}>
                    <Route
                        path="/admin"
                        element={<p>Protected admin page</p>}
                    />
                </Route>
            </Routes>
        </MemoryRouter>
    );
}

describe("ProtectedAdminRoute", () => {
    test("redirects anonymous visitors to login", () => {
        useAuth.mockReturnValue({
            authenticated: false,
            loading: false,
        });

        renderRoutes();

        expect(
            screen.getByText("Login page")
        ).toBeInTheDocument();
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

    test("shows loading state while session is checked", () => {
        useAuth.mockReturnValue({
            authenticated: false,
            loading: true,
        });

        renderRoutes();

        expect(
            screen.getByText(
                /kontrollerar administratörssession/i
            )
        ).toBeInTheDocument();
    });
});