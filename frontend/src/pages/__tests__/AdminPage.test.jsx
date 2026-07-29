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
import AdminPage from "../AdminPage";

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

const availableHelmet = {
    id: 1,
    type: "HELMET",
    serialNumber: "HELMET-001",
    size: "M",
    brand: "Bauer",
    model: "Re-Akt 150",
    condition: "GOOD",
    ageCategory: "JUNIOR",
    storageLocation: "Hylla A2",
    description: "Svart hjälm",
    available: true,
    active: true,
};

const loanedSkates = {
    id: 2,
    type: "SKATES",
    serialNumber: "SKATES-001",
    size: "42",
    brand: "CCM",
    model: "Jetspeed",
    condition: "WORN",
    ageCategory: "SENIOR",
    storageLocation: "Hylla B1",
    description: "Använda skridskor",
    available: false,
    active: true,
};

const inactiveStick = {
    id: 3,
    type: "STICK",
    serialNumber: "STICK-001",
    size: "150 cm",
    brand: "Warrior",
    model: "Alpha",
    condition: "NEEDS_REPAIR",
    ageCategory: "JUNIOR",
    storageLocation: "Verkstad",
    description: "Spricka i bladet",
    available: true,
    active: false,
};

function renderAdminPage() {
    return render(
        <MemoryRouter
            initialEntries={[
                "/admin",
            ]}
        >
            <AdminPage />
        </MemoryRouter>
    );
}

function mockEquipmentList() {
    api.get.mockResolvedValueOnce({
        data: [
            availableHelmet,
            loanedSkates,
            inactiveStick,
        ],
    });
}

function clickFirstButton(name) {
    fireEvent.click(
        screen.getAllByRole(
            "button",
            {
                name,
            }
        )[0]
    );
}

describe("AdminPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test(
        "renders extended equipment list and statistics",
        async () => {
            mockEquipmentList();

            renderAdminPage();

            expect(
                await screen.findByRole(
                    "heading",
                    {
                        name:
                            /^utrustning$/i,
                    }
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    /inloggad som test-admin/i
                )
            ).toBeInTheDocument();

            expect(api.get)
                .toHaveBeenCalledWith(
                    "/admin/equipment"
                );

            expect(
                screen.getAllByText(
                    "HELMET-001"
                ).length
            ).toBeGreaterThan(0);

            expect(
                screen.getAllByText(
                    "Bauer • Re-Akt 150 • Storlek: M • Junior"
                ).length
            ).toBeGreaterThan(0);

            expect(
                screen.getAllByText(
                    "Hylla A2"
                ).length
            ).toBeGreaterThan(0);

            expect(
                screen.getAllByText(
                    "Bra"
                ).length
            ).toBeGreaterThan(0);

            expect(
                screen.getAllByText(
                    /tillgänglig/i
                ).length
            ).toBeGreaterThan(0);

            expect(
                screen.getAllByText(
                    /utlånad/i
                ).length
            ).toBeGreaterThan(0);

            expect(
                screen.getAllByText(
                    /inaktiverad/i
                ).length
            ).toBeGreaterThan(0);
        }
    );

    test(
        "searches across brand model and storage location",
        async () => {
            mockEquipmentList();

            renderAdminPage();

            await screen.findAllByText(
                "HELMET-001"
            );

            const searchInput =
                screen.getByLabelText(
                    /^sök$/i
                );

            fireEvent.change(
                searchInput,
                {
                    target: {
                        value: "Warrior",
                    },
                }
            );

            expect(
                screen.getAllByText(
                    "STICK-001"
                ).length
            ).toBeGreaterThan(0);

            expect(
                screen.queryByText(
                    "HELMET-001"
                )
            ).not.toBeInTheDocument();

            fireEvent.change(
                searchInput,
                {
                    target: {
                        value: "Hylla B1",
                    },
                }
            );

            expect(
                screen.getAllByText(
                    "SKATES-001"
                ).length
            ).toBeGreaterThan(0);

            expect(
                screen.queryByText(
                    "STICK-001"
                )
            ).not.toBeInTheDocument();
        }
    );

    test(
        "combines equipment filters and can clear them",
        async () => {
            mockEquipmentList();

            renderAdminPage();

            await screen.findAllByText(
                "HELMET-001"
            );

            fireEvent.change(
                screen.getByLabelText(
                    /^typ$/i
                ),
                {
                    target: {
                        value: "SKATES",
                    },
                }
            );

            fireEvent.change(
                screen.getByLabelText(
                    /^skick$/i
                ),
                {
                    target: {
                        value: "WORN",
                    },
                }
            );

            fireEvent.change(
                screen.getByLabelText(
                    /^ålderskategori$/i
                ),
                {
                    target: {
                        value: "SENIOR",
                    },
                }
            );

            fireEvent.change(
                screen.getByLabelText(
                    /aktiv status/i
                ),
                {
                    target: {
                        value: "ACTIVE",
                    },
                }
            );

            fireEvent.change(
                screen.getByLabelText(
                    /lånestatus/i
                ),
                {
                    target: {
                        value: "LOANED",
                    },
                }
            );

            expect(
                screen.getAllByText(
                    "SKATES-001"
                ).length
            ).toBeGreaterThan(0);

            expect(
                screen.queryByText(
                    "HELMET-001"
                )
            ).not.toBeInTheDocument();

            expect(
                screen.queryByText(
                    "STICK-001"
                )
            ).not.toBeInTheDocument();

            fireEvent.click(
                screen.getByRole(
                    "button",
                    {
                        name:
                            /rensa filter/i,
                    }
                )
            );

            expect(
                screen.getAllByText(
                    "HELMET-001"
                ).length
            ).toBeGreaterThan(0);

            expect(
                screen.getAllByText(
                    "STICK-001"
                ).length
            ).toBeGreaterThan(0);
        }
    );

    test(
        "provides edit links for equipment",
        async () => {
            mockEquipmentList();

            renderAdminPage();

            await screen.findAllByText(
                "HELMET-001"
            );

            const editLinks =
                screen.getAllByRole(
                    "link",
                    {
                        name: /redigera/i,
                    }
                );

            expect(editLinks.length)
                .toBeGreaterThan(0);

            expect(editLinks[0])
                .toHaveAttribute(
                    "href",
                    "/admin/equipment/1/edit"
                );
        }
    );

    test(
        "deactivates equipment after confirmation",
        async () => {
            api.get.mockResolvedValueOnce({
                data: [
                    availableHelmet,
                ],
            });

            api.put.mockResolvedValueOnce({
                data: {
                    ...availableHelmet,
                    active: false,
                },
            });

            renderAdminPage();

            await screen.findAllByText(
                "HELMET-001"
            );

            clickFirstButton(
                /^inaktivera$/i
            );

            expect(
                screen.getByRole(
                    "dialog",
                    {
                        name:
                            /inaktivera utrustning/i,
                    }
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    /lånehistoriken bevaras/i
                )
            ).toBeInTheDocument();

            fireEvent.click(
                screen.getByRole(
                    "button",
                    {
                        name:
                            /ja, inaktivera/i,
                    }
                )
            );

            await waitFor(() => {
                expect(api.put)
                    .toHaveBeenCalledWith(
                        "/admin/equipment/1/active",
                        {
                            active: false,
                        }
                    );
            });

            expect(
                await screen.findByText(
                    /HELMET-001 har inaktiverats/i
                )
            ).toBeInTheDocument();

            expect(
                screen.getAllByText(
                    /^inaktiverad$/i
                ).length
            ).toBeGreaterThan(0);
        }
    );

    test(
        "reactivates inactive equipment",
        async () => {
            api.get.mockResolvedValueOnce({
                data: [
                    inactiveStick,
                ],
            });

            api.put.mockResolvedValueOnce({
                data: {
                    ...inactiveStick,
                    active: true,
                },
            });

            renderAdminPage();

            await screen.findAllByText(
                "STICK-001"
            );

            clickFirstButton(
                /^återaktivera$/i
            );

            fireEvent.click(
                screen.getByRole(
                    "button",
                    {
                        name:
                            /ja, återaktivera/i,
                    }
                )
            );

            await waitFor(() => {
                expect(api.put)
                    .toHaveBeenCalledWith(
                        "/admin/equipment/3/active",
                        {
                            active: true,
                        }
                    );
            });

            expect(
                await screen.findByText(
                    /STICK-001 har återaktiverats/i
                )
            ).toBeInTheDocument();

            expect(
                screen.getAllByText(
                    /^tillgänglig$/i
                ).length
            ).toBeGreaterThan(0);
        }
    );

    test(
        "returns loaned equipment through active loan",
        async () => {
            const returnedEquipment = {
                ...loanedSkates,
                available: true,
            };

            api.get
                .mockResolvedValueOnce({
                    data: [
                        loanedSkates,
                    ],
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
                                loanedSkates,
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
                    data: [
                        returnedEquipment,
                    ],
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
                    returnedEquipment,
                },
            });

            renderAdminPage();

            await screen.findAllByText(
                "SKATES-001"
            );

            clickFirstButton(
                /markera återlämnad/i
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
                expect(api.get)
                    .toHaveBeenCalledWith(
                        "/admin/loans",
                        {
                            params: {
                                status: "ACTIVE",
                                serialNumber:
                                    "SKATES-001",
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
                    /SKATES-001 är markerad som återlämnad/i
                )
            ).toBeInTheDocument();
        }
    );

    test(
        "shows error when equipment has no active loan",
        async () => {
            api.get
                .mockResolvedValueOnce({
                    data: [
                        loanedSkates,
                    ],
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
                "SKATES-001"
            );

            clickFirstButton(
                /markera återlämnad/i
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
        "renders error message when equipment api fails",
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