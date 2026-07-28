import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from "vitest";
import AdminPage from "../AdminPage";
import api from "../../api/api";

const logoutMock = vi.fn();

vi.mock("../../api/api", () => ({
    default: {
        get: vi.fn(),
        put: vi.fn(),
    },
}));

vi.mock("../../auth/useAuth", () => ({
    useAuth: () => ({
        admin: {
            username: "test-admin",
        },
        authenticated: true,
        loading: false,
        logout: logoutMock,
    }),
}));

function renderAdminPage() {
    return render(
        <MemoryRouter>
            <AdminPage />
        </MemoryRouter>
    );
}

describe("AdminPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("renders admin page heading", async () => {
        api.get.mockResolvedValueOnce({
            data: [],
        });

        renderAdminPage();

        expect(
            await screen.findByRole("heading", {
                name: /utrustning/i,
            })
        ).toBeInTheDocument();

        expect(
            screen.getByText(/hantera utrustning/i)
        ).toBeInTheDocument();

        expect(
            screen.getByText(/inloggad som test-admin/i)
        ).toBeInTheDocument();
    });

    test("renders equipment list from api", async () => {
        api.get.mockResolvedValueOnce({
            data: [
                {
                    id: 1,
                    type: "HELMET",
                    serialNumber: "HELMET-001",
                    description: "Bauer hjälm",
                    available: true,
                },
            ],
        });

        renderAdminPage();

        expect(
            await screen.findAllByText("HELMET-001")
        ).toHaveLength(2);

        expect(
            screen.getAllByText("Bauer hjälm")
        ).toHaveLength(2);

        expect(
            screen.getAllByText(/tillgänglig/i).length
        ).toBeGreaterThan(0);
    });

    test("renders error message when api fails", async () => {
        api.get.mockRejectedValueOnce(
            new Error("Network error")
        );

        renderAdminPage();

        expect(
            await screen.findByText(
                /kunde inte hämta utrustning/i
            )
        ).toBeInTheDocument();
    });
});