import {
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from "vitest";
import ActiveLoansPage from "../ActiveLoansPage";
import api from "../../api/api";

vi.mock("../../api/api", () => ({
    default: {
        get: vi.fn(),
        put: vi.fn(),
    },
}));

const activeLoan = {
    id: 10,
    borrowerName: "Patrik Hading",
    email: "patrik@example.com",
    phoneNumber: "+46701234567",
    loanDate: "2026-07-28T12:30:00",
    returned: false,
    returnedAt: null,
    equipment: {
        id: 1,
        type: "HELMET",
        serialNumber: "HELMET-001",
        description: "Bauer hjälm",
        available: false,
    },
};

const returnedLoan = {
    ...activeLoan,
    id: 11,
    borrowerName: "Anna Andersson",
    email: "anna@example.com",
    phoneNumber: "+46709876543",
    returned: true,
    returnedAt: "2026-07-29T10:15:00",
    equipment: {
        ...activeLoan.equipment,
        id: 2,
        serialNumber: "HELMET-002",
        available: true,
    },
};

function page(content, overrides = {}) {
    return {
        content,
        page: 0,
        size: 20,
        totalElements: content.length,
        totalPages: content.length ? 1 : 0,
        first: true,
        last: true,
        ...overrides,
    };
}

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

    test(
        "renders loading and empty states",
        async () => {
            api.get.mockResolvedValueOnce({
                data: page([]),
            });

            renderPage();

            expect(
                screen.getByLabelText(
                    /laddar lånehistorik/i
                )
            ).toBeInTheDocument();

            expect(
                await screen.findByRole(
                    "heading",
                    {
                        name: /inga lån hittades/i,
                    }
                )
            ).toBeInTheDocument();

            expect(api.get).toHaveBeenCalledWith(
                "/admin/loans",
                {
                    params: {
                        status: "ALL",
                        page: 0,
                        size: 20,
                    },
                }
            );
        }
    );

    test(
        "renders active and returned loans",
        async () => {
            api.get.mockResolvedValueOnce({
                data: page([
                    activeLoan,
                    returnedLoan,
                ]),
            });

            renderPage();

            expect(
                await screen.findByText(
                    "Patrik Hading"
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    "Anna Andersson"
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText("Aktivt")
            ).toBeInTheDocument();

            expect(
                screen.getByText("Återlämnat")
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    "patrik@example.com"
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    "anna@example.com"
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    "+46701234567"
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    "+46709876543"
                )
            ).toBeInTheDocument();
        }
    );

    test(
        "sends filters to backend",
        async () => {
            api.get
                .mockResolvedValueOnce({
                    data: page([]),
                })
                .mockResolvedValueOnce({
                    data: page([activeLoan]),
                });

            renderPage();

            await screen.findByRole(
                "heading",
                {
                    name: /inga lån hittades/i,
                }
            );

            fireEvent.change(
                screen.getByLabelText("Status"),
                {
                    target: {
                        value: "ACTIVE",
                    },
                }
            );

            fireEvent.change(
                screen.getByLabelText(
                    "Serienummer"
                ),
                {
                    target: {
                        value: "HELMET-001",
                    },
                }
            );

            fireEvent.change(
                screen.getByLabelText(
                    "Låntagare"
                ),
                {
                    target: {
                        value: "Patrik",
                    },
                }
            );

            fireEvent.click(
                screen.getByRole("button", {
                    name: /använd filter/i,
                })
            );

            await waitFor(() => {
                expect(
                    api.get
                ).toHaveBeenLastCalledWith(
                    "/admin/loans",
                    {
                        params: {
                            status: "ACTIVE",
                            page: 0,
                            size: 20,
                            serialNumber:
                                "HELMET-001",
                            borrower: "Patrik",
                        },
                    }
                );
            });
        }
    );

    test("loads next page", async () => {
        api.get
            .mockResolvedValueOnce({
                data: page([activeLoan], {
                    totalElements: 21,
                    totalPages: 2,
                    last: false,
                }),
            })
            .mockResolvedValueOnce({
                data: page([returnedLoan], {
                    page: 1,
                    totalElements: 21,
                    totalPages: 2,
                    first: false,
                }),
            });

        renderPage();

        await screen.findByText(
            "Patrik Hading"
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Nästa",
            })
        );

        await waitFor(() => {
            expect(
                api.get
            ).toHaveBeenLastCalledWith(
                "/admin/loans",
                {
                    params: {
                        status: "ALL",
                        page: 1,
                        size: 20,
                    },
                }
            );
        });
    });

    test(
        "marks active loan as returned",
        async () => {
            api.get.mockResolvedValueOnce({
                data: page([activeLoan]),
            });

            api.put.mockResolvedValueOnce({
                data: {
                    ...activeLoan,
                    returned: true,
                    returnedAt:
                        "2026-07-29T10:15:00",
                    equipment: {
                        ...activeLoan.equipment,
                        available: true,
                    },
                },
            });

            renderPage();

            await screen.findByText(
                "Patrik Hading"
            );

            fireEvent.click(
                screen.getByRole("button", {
                    name: /markera som återlämnad/i,
                })
            );

            fireEvent.click(
                screen.getByRole("button", {
                    name: /ja, markera återlämnad/i,
                })
            );

            await waitFor(() => {
                expect(api.put)
                    .toHaveBeenCalledTimes(1);

                expect(api.put)
                    .toHaveBeenCalledWith(
                        "/admin/loans/10/returned",
                        {}
                    );
            });

            expect(
                await screen.findByText(
                    /HELMET-001 är markerad som återlämnad/i
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText("Återlämnat")
            ).toBeInTheDocument();

            expect(
                screen.queryByRole("button", {
                    name: /markera som återlämnad/i,
                })
            ).not.toBeInTheDocument();
        }
    );

    test(
        "renders load error",
        async () => {
            api.get.mockRejectedValueOnce({
                response: {
                    status: 500,
                },
                displayMessage:
                    "Ett oväntat fel inträffade.",
            });

            renderPage();

            expect(
                await screen.findByText(
                    "Ett oväntat fel inträffade."
                )
            ).toBeInTheDocument();
        }
    );
});