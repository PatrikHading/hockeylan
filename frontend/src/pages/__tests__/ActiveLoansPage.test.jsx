import {
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import {
    MemoryRouter,
} from "react-router";
import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from "vitest";
import api from "../../api/api";
import ActiveLoansPage from "../ActiveLoansPage";

vi.mock("../../api/api", () => ({
    default: {
        get: vi.fn(),
        put: vi.fn(),
    },
}));

const activeLoan = {
    id: 10,
    borrowerName:
        "Patrik Hading",
    email:
        "patrik@example.com",
    phoneNumber:
        "+46701234567",
    loanDate:
        "2026-07-28T12:30:00",
    expectedReturnDate:
        "2026-08-31",
    returned: false,
    returnedAt: null,
    overdue: false,
    returnedLate: false,
    equipment: {
        id: 1,
        type: "HELMET",
        serialNumber:
            "HELMET-001",
        description:
            "Bauer hjälm",
        available: false,
    },
};

const overdueLoan = {
    ...activeLoan,
    id: 11,
    borrowerName:
        "Anna Andersson",
    email:
        "anna@example.com",
    phoneNumber:
        "+46709876543",
    expectedReturnDate:
        "2026-07-20",
    overdue: true,
    equipment: {
        ...activeLoan.equipment,
        id: 2,
        serialNumber:
            "HELMET-002",
    },
};

const returnedLoan = {
    ...activeLoan,
    id: 12,
    borrowerName:
        "Erik Eriksson",
    email:
        "erik@example.com",
    phoneNumber:
        "+46701112233",
    returned: true,
    returnedAt:
        "2026-08-30T10:15:00",
    overdue: false,
    returnedLate: false,
    equipment: {
        ...activeLoan.equipment,
        id: 3,
        serialNumber:
            "HELMET-003",
        available: true,
    },
};

const returnedLateLoan = {
    ...activeLoan,
    id: 13,
    borrowerName:
        "Sara Svensson",
    email:
        "sara@example.com",
    phoneNumber:
        "+46704445566",
    expectedReturnDate:
        "2026-08-15",
    returned: true,
    returnedAt:
        "2026-08-20T14:30:00",
    overdue: false,
    returnedLate: true,
    equipment: {
        ...activeLoan.equipment,
        id: 4,
        serialNumber:
            "HELMET-004",
        available: true,
    },
};

function page(
    content,
    overrides = {}
) {
    return {
        content,
        page: 0,
        size: 20,
        totalElements:
        content.length,
        totalPages:
            content.length
                ? 1
                : 0,
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

describe(
    "ActiveLoansPage",
    () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        test(
            "renders loading and empty states",
            async () => {
                api.get
                    .mockResolvedValueOnce({
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
                            name:
                                /inga lån hittades/i,
                        }
                    )
                ).toBeInTheDocument();

                expect(api.get)
                    .toHaveBeenCalledWith(
                        "/admin/loans",
                        {
                            params: {
                                status:
                                    "ALL",
                                page: 0,
                                size: 20,
                            },
                        }
                    );
            }
        );

        test(
            "renders all loan statuses and expected dates",
            async () => {
                api.get
                    .mockResolvedValueOnce({
                        data: page([
                            activeLoan,
                            overdueLoan,
                            returnedLoan,
                            returnedLateLoan,
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
                    screen.getByText(
                        "Erik Eriksson"
                    )
                ).toBeInTheDocument();

                expect(
                    screen.getByText(
                        "Sara Svensson"
                    )
                ).toBeInTheDocument();

                expect(
                    screen.getByText(
                        "Aktivt"
                    )
                ).toBeInTheDocument();

                expect(
                    screen.getByText(
                        "Försenat"
                    )
                ).toBeInTheDocument();

                expect(
                    screen.getByText(
                        /^Återlämnat$/
                    )
                ).toBeInTheDocument();

                expect(
                    screen.getByText(
                        "Återlämnat sent"
                    )
                ).toBeInTheDocument();

                expect(
                    screen.getAllByText(
                        /31 aug/i
                    ).length
                ).toBeGreaterThan(0);

                expect(
                    screen.getByText(
                        /20 juli|20 jul/i
                    )
                ).toBeInTheDocument();
            }
        );

        test(
            "sends overdue filter to backend",
            async () => {
                api.get
                    .mockResolvedValueOnce({
                        data: page([]),
                    })
                    .mockResolvedValueOnce({
                        data: page([
                            overdueLoan,
                        ]),
                    });

                renderPage();

                await screen.findByRole(
                    "heading",
                    {
                        name:
                            /inga lån hittades/i,
                    }
                );

                fireEvent.change(
                    screen.getByLabelText(
                        "Status"
                    ),
                    {
                        target: {
                            value:
                                "OVERDUE",
                        },
                    }
                );

                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                /använd filter/i,
                        }
                    )
                );

                await waitFor(() => {
                    expect(api.get)
                        .toHaveBeenLastCalledWith(
                            "/admin/loans",
                            {
                                params: {
                                    status:
                                        "OVERDUE",
                                    page: 0,
                                    size: 20,
                                },
                            }
                        );
                });
            }
        );

        test(
            "sends combined filters to backend",
            async () => {
                api.get
                    .mockResolvedValueOnce({
                        data: page([]),
                    })
                    .mockResolvedValueOnce({
                        data: page([
                            activeLoan,
                        ]),
                    });

                renderPage();

                await screen.findByRole(
                    "heading",
                    {
                        name:
                            /inga lån hittades/i,
                    }
                );

                fireEvent.change(
                    screen.getByLabelText(
                        "Status"
                    ),
                    {
                        target: {
                            value:
                                "ACTIVE",
                        },
                    }
                );

                fireEvent.change(
                    screen.getByLabelText(
                        "Serienummer"
                    ),
                    {
                        target: {
                            value:
                                "HELMET-001",
                        },
                    }
                );

                fireEvent.change(
                    screen.getByLabelText(
                        "Låntagare"
                    ),
                    {
                        target: {
                            value:
                                "Patrik",
                        },
                    }
                );

                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                /använd filter/i,
                        }
                    )
                );

                await waitFor(() => {
                    expect(api.get)
                        .toHaveBeenLastCalledWith(
                            "/admin/loans",
                            {
                                params: {
                                    status:
                                        "ACTIVE",
                                    page: 0,
                                    size: 20,
                                    serialNumber:
                                        "HELMET-001",
                                    borrower:
                                        "Patrik",
                                },
                            }
                        );
                });
            }
        );

        test(
            "rejects invalid local date interval",
            async () => {
                api.get
                    .mockResolvedValueOnce({
                        data: page([]),
                    });

                renderPage();

                await screen.findByRole(
                    "heading",
                    {
                        name:
                            /inga lån hittades/i,
                    }
                );

                fireEvent.change(
                    screen.getByLabelText(
                        /från lånedatum/i
                    ),
                    {
                        target: {
                            value:
                                "2026-08-01",
                        },
                    }
                );

                fireEvent.change(
                    screen.getByLabelText(
                        /till lånedatum/i
                    ),
                    {
                        target: {
                            value:
                                "2026-07-01",
                        },
                    }
                );

                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                /använd filter/i,
                        }
                    )
                );

                expect(
                    await screen.findByText(
                        /från-datum får inte ligga efter till-datum/i
                    )
                ).toBeInTheDocument();

                expect(api.get)
                    .toHaveBeenCalledTimes(1);
            }
        );

        test(
            "loads next page",
            async () => {
                api.get
                    .mockResolvedValueOnce({
                        data: page(
                            [activeLoan],
                            {
                                totalElements:
                                    21,
                                totalPages: 2,
                                last: false,
                            }
                        ),
                    })
                    .mockResolvedValueOnce({
                        data: page(
                            [returnedLoan],
                            {
                                page: 1,
                                totalElements:
                                    21,
                                totalPages: 2,
                                first: false,
                            }
                        ),
                    });

                renderPage();

                await screen.findByText(
                    "Patrik Hading"
                );

                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name: "Nästa",
                        }
                    )
                );

                await waitFor(() => {
                    expect(api.get)
                        .toHaveBeenLastCalledWith(
                            "/admin/loans",
                            {
                                params: {
                                    status:
                                        "ALL",
                                    page: 1,
                                    size: 20,
                                },
                            }
                        );
                });
            }
        );

        test(
            "marks active loan as returned",
            async () => {
                api.get
                    .mockResolvedValueOnce({
                        data: page([
                            activeLoan,
                        ]),
                    });

                api.put
                    .mockResolvedValueOnce({
                        data: {
                            ...activeLoan,
                            returned: true,
                            returnedAt:
                                "2026-08-30T10:15:00",
                            overdue: false,
                            returnedLate:
                                false,
                            equipment: {
                                ...activeLoan
                                    .equipment,
                                available:
                                    true,
                            },
                        },
                    });

                renderPage();

                await screen.findByText(
                    "Patrik Hading"
                );

                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                /markera som återlämnad/i,
                        }
                    )
                );

                fireEvent.click(
                    screen.getByRole(
                        "button",
                        {
                            name:
                                /ja, markera återlämnad/i,
                        }
                    )
                );

                await waitFor(() => {
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
                    screen.getByText(
                        /^Återlämnat$/
                    )
                ).toBeInTheDocument();

                expect(
                    screen.queryByRole(
                        "button",
                        {
                            name:
                                /markera som återlämnad/i,
                        }
                    )
                ).not.toBeInTheDocument();
            }
        );

        test(
            "renders backend load error",
            async () => {
                api.get
                    .mockRejectedValueOnce({
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
    }
);