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

const loanedEquipment = {
    id: 1,
    type: "HELMET",
    serialNumber: "HELMET-001",
    description: "Bauer hjälm",
    available: false,
};

const availableEquipment = {
    ...loanedEquipment,
    available: true,
};

function renderAdminPage() {
    return render(
        <MemoryRouter>
            <AdminPage />
        </MemoryRouter>
    );
}

function openReturnConfirmation() {
    fireEvent.click(
        screen.getAllByRole("button", {
            name: /återlämnad/i,
        })[0]
    );
}

function confirmReturn() {
    fireEvent.click(
        screen.getByRole("button", {
            name: /ja, markera återlämnad/i,
        })
    );
}

describe("AdminPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test(
        "renders admin page heading",
        async () => {
            api.get.mockResolvedValueOnce({
                data: [],
            });

            renderAdminPage();

            expect(
                await screen.findByRole(
                    "heading",
                    {
                        name: /utrustning/i,
                    }
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    /hantera utrustning/i
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    /inloggad som test-admin/i
                )
            ).toBeInTheDocument();

            expect(api.get).toHaveBeenCalledWith(
                "/admin/equipment"
            );
        }
    );

    test(
        "renders equipment list from api",
        async () => {
            api.get.mockResolvedValueOnce({
                data: [
                    {
                        ...availableEquipment,
                    },
                ],
            });

            renderAdminPage();

            expect(
                await screen.findAllByText(
                    "HELMET-001"
                )
            ).toHaveLength(2);

            expect(
                screen.getAllByText(
                    "Bauer hjälm"
                )
            ).toHaveLength(2);

            expect(
                screen.getAllByText(
                    /tillgänglig/i
                ).length
            ).toBeGreaterThan(0);
        }
    );

    test(
        "returns loaned equipment through active loan",
        async () => {
            api.get
                .mockResolvedValueOnce({
                    data: [loanedEquipment],
                })
                .mockResolvedValueOnce({
                    data: {
                        content: [
                            {
                                id: 10,
                                borrowerName:
                                    "Patrik Hading",
                                returned: false,
                                returnedAt: null,
                                equipment:
                                loanedEquipment,
                            },
                        ],
                        page: 0,
                        size: 1,
                        totalElements: 1,
                        totalPages: 1,
                        first: true,
                        last: true,
                    },
                })
                .mockResolvedValueOnce({
                    data: [availableEquipment],
                });

            api.put.mockResolvedValueOnce({
                data: {
                    id: 10,
                    borrowerName:
                        "Patrik Hading",
                    returned: true,
                    returnedAt:
                        "2026-07-29T14:15:00",
                    equipment:
                    availableEquipment,
                },
            });

            renderAdminPage();

            await screen.findAllByText(
                "HELMET-001"
            );

            openReturnConfirmation();
            confirmReturn();

            await waitFor(() => {
                expect(api.get)
                    .toHaveBeenCalledWith(
                        "/admin/loans",
                        {
                            params: {
                                status: "ACTIVE",
                                serialNumber:
                                    "HELMET-001",
                                page: 0,
                                size: 1,
                            },
                        }
                    );

                expect(api.put)
                    .toHaveBeenCalledWith(
                        "/admin/loans/10/returned"
                    );
            });

            expect(
                await screen.findByText(
                    /HELMET-001 är markerad som återlämnad/i
                )
            ).toBeInTheDocument();

            expect(
                screen.getAllByText(
                    /tillgänglig/i
                ).length
            ).toBeGreaterThan(0);

            expect(
                screen.queryByRole("button", {
                    name: /markera som återlämnad/i,
                })
            ).not.toBeInTheDocument();
        }
    );

    test(
        "shows error when equipment has no active loan",
        async () => {
            api.get
                .mockResolvedValueOnce({
                    data: [loanedEquipment],
                })
                .mockResolvedValueOnce({
                    data: {
                        content: [],
                        page: 0,
                        size: 1,
                        totalElements: 0,
                        totalPages: 0,
                        first: true,
                        last: true,
                    },
                });

            renderAdminPage();

            await screen.findAllByText(
                "HELMET-001"
            );

            openReturnConfirmation();
            confirmReturn();

            expect(
                await screen.findByText(
                    /det finns inget aktivt lån för den valda utrustningen/i
                )
            ).toBeInTheDocument();

            expect(api.put)
                .not.toHaveBeenCalled();
        }
    );

    test(
        "keeps equipment loaned when return fails",
        async () => {
            api.get
                .mockResolvedValueOnce({
                    data: [loanedEquipment],
                })
                .mockResolvedValueOnce({
                    data: {
                        content: [
                            {
                                id: 10,
                                returned: false,
                                equipment:
                                loanedEquipment,
                            },
                        ],
                    },
                });

            api.put.mockRejectedValueOnce({
                response: {
                    status: 409,
                },
                displayMessage:
                    "Lånet är redan återlämnat.",
            });

            renderAdminPage();

            await screen.findAllByText(
                "HELMET-001"
            );

            openReturnConfirmation();
            confirmReturn();

            expect(
                await screen.findByText(
                    "Lånet är redan återlämnat."
                )
            ).toBeInTheDocument();

            expect(
                screen.getAllByText(
                    /utlånad/i
                ).length
            ).toBeGreaterThan(0);
        }
    );

    test(
        "renders error message when api fails",
        async () => {
            api.get.mockRejectedValueOnce(
                new Error("Network error")
            );

            renderAdminPage();

            expect(
                await screen.findByText(
                    /kunde inte hämta utrustning/i
                )
            ).toBeInTheDocument();
        }
    );
});