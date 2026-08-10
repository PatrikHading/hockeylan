import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import api, { getErrorMessage, hasErrorCode } from "../../api/api";
import ActiveLoansPage from "../ActiveLoansPage";

vi.mock("../../api/api", () => ({
    default: {
        get: vi.fn(),
        put: vi.fn(),
    },

    getErrorMessage: vi.fn(
        (error, fallbackMessage) => error?.displayMessage || fallbackMessage,
    ),

    hasErrorCode: vi.fn((error, errorCode) => error?.apiCode === errorCode),
}));

const activeLoan = {
    id: 11,
    borrowerName: "Anna Andersson",
    email: "anna@example.com",
    phoneNumber: "+46701111111",
    loanDate: "2026-07-01T10:30:00",
    expectedReturnDate: "2027-04-30",
    returned: false,
    returnedAt: null,
    overdue: false,
    returnedLate: false,
    equipment: {
        id: 1,
        type: "HELMET",
        serialNumber: "HELMET-001",
        description: "Svart hjälm",
    },
};

const overdueLoan = {
    id: 12,
    borrowerName: "Bertil Berg",
    email: "bertil@example.com",
    phoneNumber: "+46702222222",
    loanDate: "2025-08-01T09:00:00",
    expectedReturnDate: "2026-04-30",
    returned: false,
    returnedAt: null,
    overdue: true,
    returnedLate: false,
    equipment: {
        id: 2,
        type: "SKATES",
        serialNumber: "SKATES-001",
        description: "Skridskor storlek 42",
    },
};

const returnedLoan = {
    id: 13,
    borrowerName: "Carin Carlsson",
    email: "carin@example.com",
    phoneNumber: "+46703333333",
    loanDate: "2025-09-01T08:00:00",
    expectedReturnDate: "2026-05-30",
    returned: true,
    returnedAt: "2026-05-20T12:00:00",
    overdue: false,
    returnedLate: false,
    equipment: {
        id: 3,
        type: "STICK",
        serialNumber: "STICK-001",
        description: "Juniorstav",
    },
};

function createPage({
                        content = [activeLoan, overdueLoan, returnedLoan],
                        page = 0,
                        totalElements = content.length,
                        totalPages = 1,
                        first = page === 0,
                        last = true,
                    } = {}) {
    return {
        content,
        page,
        size: 20,
        totalElements,
        totalPages,
        first,
        last,
    };
}

function renderActiveLoansPage() {
    return render(
        <MemoryRouter>
            <ActiveLoansPage />
        </MemoryRouter>,
    );
}

function mockInitialPage(overrides = {}) {
    api.get.mockResolvedValueOnce({
        data: createPage(overrides),
    });
}

function clickFirstReturnButton() {
    fireEvent.click(
        screen.getAllByRole("button", {
            name: /markera som återlämnad/i,
        })[0],
    );
}

describe("ActiveLoansPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("renders accessible loading state and fetches first page", async () => {
        mockInitialPage();

        renderActiveLoansPage();

        const loadingStatus = screen.getByRole("status");

        expect(loadingStatus).toHaveAttribute("aria-busy", "true");
        expect(loadingStatus).toHaveTextContent(/laddar lånehistorik/i);

        expect(
            await screen.findByRole("heading", {
                name: /anna andersson/i,
            }),
        ).toBeInTheDocument();

        expect(api.get).toHaveBeenCalledWith("/admin/loans", {
            params: {
                status: "ALL",
                page: 0,
                size: 20,
            },
            signal: expect.any(AbortSignal),
        });
    });

    test("renders loan information and translated equipment types", async () => {
        mockInitialPage();

        renderActiveLoansPage();

        expect(
            await screen.findByRole("heading", {
                name: /anna andersson/i,
            }),
        ).toBeInTheDocument();

        expect(screen.getByText("anna@example.com")).toHaveAttribute(
            "href",
            "mailto:anna@example.com",
        );

        expect(screen.getByText("+46701111111")).toHaveAttribute(
            "href",
            "tel:+46701111111",
        );

        expect(screen.getByText(/hjälm.*svart hjälm/i)).toBeInTheDocument();
        expect(screen.getByText(/skridskor.*storlek 42/i)).toBeInTheDocument();
        expect(screen.getByText("HELMET-001")).toBeInTheDocument();
        expect(screen.getByText("SKATES-001")).toBeInTheDocument();
        expect(screen.getByText("Aktivt")).toBeInTheDocument();
        expect(screen.getByText("Försenat")).toBeInTheDocument();
        expect(screen.getByText("Återlämnat")).toBeInTheDocument();

        expect(screen.getByRole("status")).toHaveTextContent(/3 lån hittades/i);
    });

    test("shows a dash when an active loan has no expected return date", async () => {
        mockInitialPage({
            content: [
                {
                    ...activeLoan,
                    expectedReturnDate: null,
                },
            ],
            totalElements: 1,
        });

        renderActiveLoansPage();

        const loanArticle = (
            await screen.findByRole("heading", {
                name: /anna andersson/i,
            })
        ).closest("article");

        const expectedReturnDateLabel = Array.from(
            loanArticle.querySelectorAll("dt"),
        ).find((element) => element.textContent === "Förväntad återlämning");

        expect(expectedReturnDateLabel.nextElementSibling).toHaveTextContent("–");
    });

    test("normalizes text filters before API request", async () => {
        const user = userEvent.setup();

        mockInitialPage();

        api.get.mockResolvedValueOnce({
            data: createPage({
                content: [activeLoan],
                totalElements: 1,
            }),
        });

        renderActiveLoansPage();

        await screen.findByRole("heading", {
            name: /anna andersson/i,
        });

        await user.selectOptions(screen.getByLabelText(/^status/i), "ACTIVE");
        await user.type(screen.getByLabelText(/serienummer/i), "  HELMET-001  ");
        await user.type(screen.getByLabelText(/låntagare/i), "  Anna  ");

        await user.selectOptions(
            screen.getByLabelText(/utrustningstyp/i),
            "HELMET",
        );

        await user.click(
            screen.getByRole("button", {
                name: /använd filter/i,
            }),
        );

        await waitFor(() => {
            expect(api.get).toHaveBeenNthCalledWith(2, "/admin/loans", {
                params: {
                    status: "ACTIVE",
                    page: 0,
                    size: 20,
                    serialNumber: "HELMET-001",
                    equipmentType: "HELMET",
                    borrower: "Anna",
                },
                signal: expect.any(AbortSignal),
            });
        });
    });

    test("shows date validation error and focuses from date", async () => {
        const user = userEvent.setup();

        mockInitialPage();
        renderActiveLoansPage();

        await screen.findByRole("heading", {
            name: /anna andersson/i,
        });

        fireEvent.change(screen.getByLabelText(/från lånedatum/i), {
            target: {
                value: "2026-08-01",
            },
        });

        fireEvent.change(screen.getByLabelText(/till lånedatum/i), {
            target: {
                value: "2026-07-01",
            },
        });

        await user.click(
            screen.getByRole("button", {
                name: /använd filter/i,
            }),
        );

        expect(
            await screen.findByRole("alert", {
                name: /kontrollera datumen/i,
            }),
        ).toHaveTextContent(/från-datum får inte ligga efter till-datum/i);

        expect(screen.getByLabelText(/från lånedatum/i)).toHaveAttribute(
            "aria-invalid",
            "true",
        );

        expect(screen.getByLabelText(/till lånedatum/i)).toHaveAttribute(
            "aria-invalid",
            "true",
        );

        await waitFor(() => {
            expect(screen.getByLabelText(/från lånedatum/i)).toHaveFocus();
        });

        expect(api.get).toHaveBeenCalledTimes(1);
    });

    test("clears filters and requests unfiltered first page", async () => {
        const user = userEvent.setup();

        mockInitialPage();

        api.get
            .mockResolvedValueOnce({
                data: createPage({
                    content: [activeLoan],
                    totalElements: 1,
                }),
            })
            .mockResolvedValueOnce({
                data: createPage(),
            });

        renderActiveLoansPage();

        await screen.findByRole("heading", {
            name: /anna andersson/i,
        });

        await user.selectOptions(screen.getByLabelText(/^status/i), "ACTIVE");
        await user.type(screen.getByLabelText(/låntagare/i), "Anna");

        await user.click(
            screen.getByRole("button", {
                name: /använd filter/i,
            }),
        );

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledTimes(2);
        });

        await user.click(
            screen.getByRole("button", {
                name: /rensa filter/i,
            }),
        );

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledTimes(3);
        });

        expect(screen.getByLabelText(/^status/i)).toHaveValue("ALL");
        expect(screen.getByLabelText(/låntagare/i)).toHaveValue("");

        expect(api.get).toHaveBeenLastCalledWith("/admin/loans", {
            params: {
                status: "ALL",
                page: 0,
                size: 20,
            },
            signal: expect.any(AbortSignal),
        });
    });

    test("shows load error and retries request", async () => {
        const user = userEvent.setup();

        const networkError = {
            apiCode: "NETWORK_ERROR",
            displayMessage: "Kunde inte ansluta till servern.",
        };

        api.get.mockRejectedValueOnce(networkError).mockResolvedValueOnce({
            data: createPage(),
        });

        renderActiveLoansPage();

        expect(
            await screen.findByRole("alert", {
                name: /lånehistoriken kunde inte hämtas/i,
            }),
        ).toHaveTextContent(/kunde inte ansluta till servern/i);

        expect(getErrorMessage).toHaveBeenCalledWith(
            networkError,
            "Kunde inte hämta lånehistoriken. Försök igen.",
        );

        await user.click(
            screen.getByRole("button", {
                name: /försök igen/i,
            }),
        );

        expect(
            await screen.findByRole("heading", {
                name: /anna andersson/i,
            }),
        ).toBeInTheDocument();

        expect(api.get).toHaveBeenCalledTimes(2);
    });

    test("shows contextual empty state", async () => {
        mockInitialPage({
            content: [],
            totalElements: 0,
        });

        renderActiveLoansPage();

        expect(
            await screen.findByRole("heading", {
                name: /inga lån hittades/i,
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText(/det finns ännu inga registrerade lån/i),
        ).toBeInTheDocument();
    });

    test("loads next page through accessible pagination", async () => {
        const user = userEvent.setup();

        mockInitialPage({
            content: [activeLoan],
            totalElements: 21,
            totalPages: 2,
            first: true,
            last: false,
        });

        api.get.mockResolvedValueOnce({
            data: createPage({
                content: [returnedLoan],
                page: 1,
                totalElements: 21,
                totalPages: 2,
                first: false,
                last: true,
            }),
        });

        renderActiveLoansPage();

        await screen.findByRole("heading", {
            name: /anna andersson/i,
        });

        expect(
            screen.getByRole("navigation", {
                name: /sidindelning/i,
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: /föregående/i,
            }),
        ).toBeDisabled();

        await user.click(
            screen.getByRole("button", {
                name: /nästa/i,
            }),
        );

        expect(
            await screen.findByRole("heading", {
                name: /carin carlsson/i,
            }),
        ).toBeInTheDocument();

        expect(api.get).toHaveBeenLastCalledWith("/admin/loans", {
            params: {
                status: "ALL",
                page: 1,
                size: 20,
            },
            signal: expect.any(AbortSignal),
        });

        expect(screen.getByText(/sida 2 av 2/i)).toBeInTheDocument();
    });

    test("returns loan and updates visible result", async () => {
        const user = userEvent.setup();

        mockInitialPage({
            content: [activeLoan],
            totalElements: 1,
        });

        api.put.mockResolvedValueOnce({
            data: {
                ...activeLoan,
                returned: true,
                returnedAt: "2026-07-31T12:00:00",
            },
        });

        renderActiveLoansPage();

        await screen.findByRole("heading", {
            name: /anna andersson/i,
        });

        clickFirstReturnButton();

        expect(
            screen.getByRole("dialog", {
                name: /markera som återlämnad/i,
            }),
        ).toHaveTextContent("HELMET-001");

        await waitFor(() => {
            expect(
                screen.getByRole("button", {
                    name: "Avbryt",
                }),
            ).toHaveFocus();
        });

        await user.click(
            screen.getByRole("button", {
                name: /ja, markera återlämnad/i,
            }),
        );

        expect(api.put).toHaveBeenCalledWith("/admin/loans/11/returned", {});

        expect(
            await screen.findByRole("status", {
                name: /klart/i,
            }),
        ).toHaveTextContent(/helmet-001 är markerad som återlämnad/i);

        expect(screen.getByText("Återlämnat")).toBeInTheDocument();

        expect(
            screen.queryByRole("button", {
                name: /markera som återlämnad/i,
            }),
        ).not.toBeInTheDocument();
    });

    test("removes returned loan from active result", async () => {
        const user = userEvent.setup();

        mockInitialPage();

        api.get.mockResolvedValueOnce({
            data: createPage({
                content: [activeLoan],
                totalElements: 1,
            }),
        });

        api.put.mockResolvedValueOnce({
            data: {
                ...activeLoan,
                returned: true,
                returnedAt: "2026-07-31T12:00:00",
            },
        });

        renderActiveLoansPage();

        await screen.findByRole("heading", {
            name: /anna andersson/i,
        });

        await user.selectOptions(screen.getByLabelText(/^status/i), "ACTIVE");

        await user.click(
            screen.getByRole("button", {
                name: /använd filter/i,
            }),
        );

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledTimes(2);
        });

        clickFirstReturnButton();

        await user.click(
            screen.getByRole("button", {
                name: /ja, markera återlämnad/i,
            }),
        );

        expect(
            await screen.findByRole("heading", {
                name: /inga lån hittades/i,
            }),
        ).toBeInTheDocument();

        expect(
            screen.getByText(/ändra filtreringen eller rensa filtren/i),
        ).toBeInTheDocument();
    });

    test("normalizes return error, closes dialog and focuses alert", async () => {
        const user = userEvent.setup();

        const rateLimitError = {
            apiCode: "RATE_LIMIT_EXCEEDED",
            displayMessage: "För många anrop. Vänta en stund och försök igen.",
        };

        mockInitialPage({
            content: [activeLoan],
            totalElements: 1,
        });

        api.put.mockRejectedValueOnce(rateLimitError);

        renderActiveLoansPage();

        await screen.findByRole("heading", {
            name: /anna andersson/i,
        });

        clickFirstReturnButton();

        await user.click(
            screen.getByRole("button", {
                name: /ja, markera återlämnad/i,
            }),
        );

        const alert = await screen.findByRole("alert", {
            name: /åtgärden misslyckades/i,
        });

        expect(alert).toHaveTextContent(/för många anrop/i);
        expect(alert.parentElement).toHaveFocus();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        expect(getErrorMessage).toHaveBeenCalledWith(
            rateLimitError,
            "Kunde inte markera lånet som återlämnat. Försök igen.",
        );
    });

    test("refreshes history after already-returned concurrency error", async () => {
        const user = userEvent.setup();

        const concurrencyError = {
            apiCode: "LOAN_ALREADY_RETURNED",
            displayMessage: "Lånet är redan återlämnat.",
        };

        mockInitialPage({
            content: [activeLoan],
            totalElements: 1,
        });

        api.put.mockRejectedValueOnce(concurrencyError);

        api.get.mockResolvedValueOnce({
            data: createPage({
                content: [
                    {
                        ...activeLoan,
                        returned: true,
                        returnedAt: "2026-07-31T12:00:00",
                    },
                ],
                totalElements: 1,
            }),
        });

        renderActiveLoansPage();

        await screen.findByRole("heading", {
            name: /anna andersson/i,
        });

        clickFirstReturnButton();

        await user.click(
            screen.getByRole("button", {
                name: /ja, markera återlämnad/i,
            }),
        );

        expect(
            await screen.findByText(/lånet är redan återlämnat/i),
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledTimes(2);
        });

        expect(hasErrorCode).toHaveBeenCalledWith(
            concurrencyError,
            "LOAN_ALREADY_RETURNED",
        );

        expect(screen.getByText("Återlämnat")).toBeInTheDocument();
    });

    test("prevents duplicate return submissions", async () => {
        let resolveReturnRequest;

        mockInitialPage({
            content: [activeLoan],
            totalElements: 1,
        });

        api.put.mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    resolveReturnRequest = resolve;
                }),
        );

        renderActiveLoansPage();

        await screen.findByRole("heading", {
            name: /anna andersson/i,
        });

        clickFirstReturnButton();

        const confirmButton = screen.getByRole("button", {
            name: /ja, markera återlämnad/i,
        });

        fireEvent.click(confirmButton);
        fireEvent.click(confirmButton);

        expect(api.put).toHaveBeenCalledTimes(1);

        expect(
            screen.getByRole("button", {
                name: /arbetar/i,
            }),
        ).toBeDisabled();

        await act(async () => {
            resolveReturnRequest({
                data: {
                    ...activeLoan,
                    returned: true,
                    returnedAt: "2026-07-31T12:00:00",
                },
            });
        });

        expect(
            await screen.findByText(/helmet-001 är markerad som återlämnad/i),
        ).toBeInTheDocument();
    });

    test("aborts history request when page unmounts", () => {
        api.get.mockReturnValue(new Promise(() => {}));

        const view = renderActiveLoansPage();

        const requestConfiguration = api.get.mock.calls[0][1];

        expect(requestConfiguration.signal.aborted).toBe(false);

        view.unmount();

        expect(requestConfiguration.signal.aborted).toBe(true);
    });

    test("ignores authentication-required fetch error", async () => {
        const authenticationError = {
            apiCode: "AUTHENTICATION_REQUIRED",
            displayMessage: "Du behöver logga in som administratör.",
        };

        api.get.mockRejectedValueOnce(authenticationError);

        renderActiveLoansPage();

        await waitFor(() => {
            expect(hasErrorCode).toHaveBeenCalledWith(
                authenticationError,
                "AUTHENTICATION_REQUIRED",
            );
        });

        expect(
            screen.queryByText(/lånehistoriken kunde inte hämtas/i),
        ).not.toBeInTheDocument();

        expect(getErrorMessage).not.toHaveBeenCalledWith(
            authenticationError,
            "Kunde inte hämta lånehistoriken. Försök igen.",
        );
    });
});