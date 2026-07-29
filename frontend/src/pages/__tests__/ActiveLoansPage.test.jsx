import {
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import ActiveLoansPage from "../ActiveLoansPage";
import api from "../../api/api";

vi.mock("../../api/api", () => ({
    default: {
        get: vi.fn(),
        put: vi.fn(),
    },
}));

const activeLoans = [
    {
        id: 10,
        borrowerName: "Patrik Hading",
        email: "patrik@example.com",
        phoneNumber: "+46701234567",
        loanDate: "2026-07-28T12:30:00",
        returned: false,
        equipment: {
            id: 1,
            type: "HELMET",
            serialNumber: "HELMET-001",
            description: "Bauer hjälm",
            available: false,
        },
    },
    {
        id: 11,
        borrowerName: "Anna Andersson",
        email: "anna@example.com",
        phoneNumber: "+46709876543",
        loanDate: "2026-07-28T13:00:00",
        returned: false,
        equipment: {
            id: 2,
            type: "SKATES",
            serialNumber: "SKATES-001",
            description: "CCM skridskor",
            available: false,
        },
    },
];

function renderPage() {
    return render(
        <MemoryRouter>
            <ActiveLoansPage />
        </MemoryRouter>
    );
}

describe("ActiveLoansPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("renders loading and then empty state", async () => {
        api.get.mockResolvedValueOnce({
            data: [],
        });

        renderPage();

        expect(
            screen.getByLabelText(/laddar aktiva lån/i)
        ).toBeInTheDocument();

        expect(
            await screen.findByRole("heading", {
                name: /inga aktiva lån/i,
            })
        ).toBeInTheDocument();
    });

    test("renders active loan and contact information", async () => {
        api.get.mockResolvedValueOnce({
            data: [activeLoans[0]],
        });

        renderPage();

        expect(
            await screen.findAllByText("Patrik Hading")
        ).not.toHaveLength(0);

        expect(
            screen.getAllByText("HELMET-001")
        ).not.toHaveLength(0);

        expect(
            screen.getAllByText("patrik@example.com")
        ).not.toHaveLength(0);

        expect(
            screen.getAllByText("+46701234567")
        ).not.toHaveLength(0);
    });

    test("searches by borrower and serial number", async () => {
        api.get.mockResolvedValueOnce({
            data: activeLoans,
        });

        renderPage();

        await screen.findAllByText("Patrik Hading");

        fireEvent.change(
            screen.getByLabelText("Sök"),
            {
                target: {
                    value: "SKATES-001",
                },
            }
        );

        expect(
            screen.queryByText("Patrik Hading")
        ).not.toBeInTheDocument();

        expect(
            screen.getAllByText("Anna Andersson")
        ).not.toHaveLength(0);
    });

    test("filters by equipment type", async () => {
        api.get.mockResolvedValueOnce({
            data: activeLoans,
        });

        renderPage();

        await screen.findAllByText("Patrik Hading");

        fireEvent.change(
            screen.getByLabelText("Utrustningstyp"),
            {
                target: {
                    value: "HELMET",
                },
            }
        );

        expect(
            screen.getAllByText("Patrik Hading")
        ).not.toHaveLength(0);

        expect(
            screen.queryByText("Anna Andersson")
        ).not.toBeInTheDocument();
    });

    test("marks selected loan as returned", async () => {
        api.get.mockResolvedValueOnce({
            data: [activeLoans[0]],
        });

        api.put.mockResolvedValueOnce({
            data: {
                ...activeLoans[0],
                returned: true,
                equipment: {
                    ...activeLoans[0].equipment,
                    available: true,
                },
            },
        });

        renderPage();

        await screen.findAllByText("Patrik Hading");

        fireEvent.click(
            screen.getAllByRole("button", {
                name: /markera som återlämnad/i,
            })[0]
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: /ja, markera återlämnad/i,
            })
        );

        await waitFor(() => {
            expect(api.put).toHaveBeenCalledWith(
                "/admin/loans/10/returned"
            );
        });

        expect(
            await screen.findByText(
                /HELMET-001 är markerad som återlämnad/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByRole("heading", {
                name: /inga aktiva lån/i,
            })
        ).toBeInTheDocument();
    });

    test("renders an error state when loading fails", async () => {
        api.get.mockRejectedValueOnce(
            new Error("Network error")
        );

        renderPage();

        expect(
            await screen.findByText(
                /kunde inte hämta aktiva lån/i
            )
        ).toBeInTheDocument();
    });
});