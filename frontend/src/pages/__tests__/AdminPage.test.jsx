import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
import api, {
    getErrorMessage,
    hasErrorCode,
} from "../../api/api";
import AdminPage from "../AdminPage";

const logoutMock = vi.fn();

vi.mock("../../api/api", () => ({
    default: {
        get: vi.fn(),
        put: vi.fn(),
    },

    getErrorMessage: vi.fn(
        (error, fallbackMessage) =>
            error?.displayMessage ||
            fallbackMessage
    ),

    hasErrorCode: vi.fn(
        (error, errorCode) =>
            error?.apiCode === errorCode
    ),
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

const equipmentList = [
    availableHelmet,
    loanedSkates,
    inactiveStick,
];

function renderAdminPage(
    initialEntry = "/admin"
) {
    return render(
        <MemoryRouter
            initialEntries={[
                initialEntry,
            ]}
        >
            <AdminPage />
        </MemoryRouter>
    );
}

function mockEquipmentList() {
    api.get.mockResolvedValueOnce({
        data: equipmentList,
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

    test("renders accessible loading state and fetches equipment", async () => {
        mockEquipmentList();

        renderAdminPage();

        const loadingStatus =
            screen.getByRole(
                "status"
            );

        expect(
            loadingStatus
        ).toHaveAttribute(
            "aria-busy",
            "true"
        );

        expect(
            loadingStatus
        ).toHaveTextContent(
            /laddar utrustning/i
        );

        expect(
            await screen.findByText(
                /inloggad som test-admin/i
            )
        ).toBeInTheDocument();

        expect(
            api.get
        ).toHaveBeenCalledWith(
            "/admin/equipment",
            {
                signal:
                    expect.any(
                        AbortSignal
                    ),
            }
        );
    });

    test("renders equipment, statistics and valid navigation links", async () => {
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
            screen.getByRole(
                "region",
                {
                    name:
                        /statistik för utrustning/i,
                }
            )
        ).toBeInTheDocument();

        const addLink =
            screen.getByRole(
                "link",
                {
                    name:
                        /lägg till utrustning/i,
                }
            );

        expect(addLink).toHaveAttribute(
            "href",
            "/admin/add"
        );

        expect(
            addLink.querySelector(
                "button"
            )
        ).not.toBeInTheDocument();

        expect(
            screen.getAllByRole(
                "link",
                {
                    name: /redigera/i,
                }
            )[0]
        ).toHaveAttribute(
            "href",
            "/admin/equipment/1/edit"
        );

        expect(
            screen.getAllByRole(
                "link",
                {
                    name: /qr-kod/i,
                }
            )[0]
        ).toHaveAttribute(
            "href",
            "/admin/qr/1"
        );
    });

    test("searches across brand, model and storage location", async () => {
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
                    value:
                        "Warrior",
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
                    value:
                        "Hylla B1",
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
    });

    test("filters equipment and clears all filters", async () => {
        const user =
            userEvent.setup();

        mockEquipmentList();

        renderAdminPage();

        await screen.findAllByText(
            "HELMET-001"
        );

        await user.selectOptions(
            screen.getByLabelText(
                /lånestatus/i
            ),
            "LOANED"
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

        await user.selectOptions(
            screen.getByLabelText(
                /aktiv status/i
            ),
            "ACTIVE"
        );

        await user.click(
            screen.getByRole(
                "button",
                {
                    name:
                        /rensa filter/i,
                }
            )
        );

        expect(
            screen.getByLabelText(
                /lånestatus/i
            )
        ).toHaveValue("ALL");

        expect(
            screen.getByLabelText(
                /aktiv status/i
            )
        ).toHaveValue("ALL");

        expect(
            screen.getAllByText(
                "HELMET-001"
            ).length
        ).toBeGreaterThan(0);
    });

    test("shows load error and retries equipment request", async () => {
        const user =
            userEvent.setup();

        const networkError = {
            apiCode:
                "NETWORK_ERROR",
            displayMessage:
                "Kunde inte ansluta till servern.",
        };

        api.get
            .mockRejectedValueOnce(
                networkError
            )
            .mockResolvedValueOnce({
                data:
                equipmentList,
            });

        renderAdminPage();

        expect(
            await screen.findByRole(
                "alert",
                {
                    name:
                        /utrustningen kunde inte hämtas/i,
                }
            )
        ).toHaveTextContent(
            /kunde inte ansluta till servern/i
        );

        expect(
            getErrorMessage
        ).toHaveBeenCalledWith(
            networkError,
            "Kunde inte hämta utrustningen. Försök igen."
        );

        await user.click(
            screen.getByRole(
                "button",
                {
                    name:
                        /försök igen/i,
                }
            )
        );

        expect(
            await screen.findAllByText(
                "HELMET-001"
            )
        ).not.toHaveLength(0);

        expect(
            api.get
        ).toHaveBeenCalledTimes(2);
    });

    test("returns equipment and updates list without another fetch", async () => {
        const user =
            userEvent.setup();

        mockEquipmentList();

        api.get.mockResolvedValueOnce({
            data: {
                content: [
                    {
                        id: 21,
                        equipment:
                        loanedSkates,
                    },
                ],
            },
        });

        api.put.mockResolvedValueOnce({
            data: {
                id: 21,
                returned: true,
            },
        });

        renderAdminPage();

        await screen.findAllByText(
            "SKATES-001"
        );

        clickFirstButton(
            /markera återlämnad/i
        );

        const dialog =
            screen.getByRole(
                "dialog",
                {
                    name:
                        /markera som återlämnad/i,
                }
            );

        expect(dialog).toHaveTextContent(
            "SKATES-001"
        );

        await waitFor(() => {
            expect(
                screen.getByRole(
                    "button",
                    {
                        name: "Avbryt",
                    }
                )
            ).toHaveFocus();
        });

        await user.click(
            screen.getByRole(
                "button",
                {
                    name:
                        /ja, markera återlämnad/i,
                }
            )
        );

        await waitFor(() => {
            expect(
                api.get
            ).toHaveBeenNthCalledWith(
                2,
                "/admin/loans",
                {
                    params: {
                        status:
                            "ACTIVE",
                        serialNumber:
                            "SKATES-001",
                        page: 0,
                        size: 1,
                    },
                }
            );
        });

        expect(
            api.put
        ).toHaveBeenCalledWith(
            "/admin/loans/21/returned"
        );

        expect(
            await screen.findByRole(
                "status",
                {
                    name: /klart/i,
                }
            )
        ).toHaveTextContent(
            /skates-001 är markerad som återlämnad/i
        );

        expect(
            screen.queryByRole(
                "button",
                {
                    name:
                        /markera återlämnad/i,
                }
            )
        ).not.toBeInTheDocument();

        expect(
            api.get
        ).toHaveBeenCalledTimes(2);
    });

    test("shows error when no active loan exists", async () => {
        const user =
            userEvent.setup();

        mockEquipmentList();

        api.get.mockResolvedValueOnce({
            data: {
                content: [],
            },
        });

        renderAdminPage();

        await screen.findAllByText(
            "SKATES-001"
        );

        clickFirstButton(
            /markera återlämnad/i
        );

        await user.click(
            screen.getByRole(
                "button",
                {
                    name:
                        /ja, markera återlämnad/i,
                }
            )
        );

        const alert =
            await screen.findByRole(
                "alert",
                {
                    name:
                        /åtgärden misslyckades/i,
                }
            );

        expect(alert).toHaveTextContent(
            /det finns inget aktivt lån/i
        );

        expect(
            alert.parentElement
        ).toHaveFocus();

        expect(
            screen.queryByRole(
                "dialog"
            )
        ).not.toBeInTheDocument();

        expect(
            api.put
        ).not.toHaveBeenCalled();
    });

    test("normalizes return error and closes dialog", async () => {
        const user =
            userEvent.setup();

        const rateLimitError = {
            apiCode:
                "RATE_LIMIT_EXCEEDED",
            displayMessage:
                "För många anrop. Vänta en stund och försök igen.",
        };

        mockEquipmentList();

        api.get.mockResolvedValueOnce({
            data: {
                content: [
                    {
                        id: 21,
                    },
                ],
            },
        });

        api.put.mockRejectedValueOnce(
            rateLimitError
        );

        renderAdminPage();

        await screen.findAllByText(
            "SKATES-001"
        );

        clickFirstButton(
            /markera återlämnad/i
        );

        await user.click(
            screen.getByRole(
                "button",
                {
                    name:
                        /ja, markera återlämnad/i,
                }
            )
        );

        const alert =
            await screen.findByRole(
                "alert",
                {
                    name:
                        /åtgärden misslyckades/i,
                }
            );

        expect(alert).toHaveTextContent(
            /för många anrop/i
        );

        expect(
            screen.queryByRole(
                "dialog"
            )
        ).not.toBeInTheDocument();

        expect(
            getErrorMessage
        ).toHaveBeenCalledWith(
            rateLimitError,
            "Kunde inte markera utrustningen som återlämnad. Försök igen."
        );
    });

    test("prevents duplicate return requests", async () => {
        let resolveReturnRequest;

        mockEquipmentList();

        api.get.mockResolvedValueOnce({
            data: {
                content: [
                    {
                        id: 21,
                    },
                ],
            },
        });

        api.put.mockImplementationOnce(
            () =>
                new Promise(
                    (resolve) => {
                        resolveReturnRequest =
                            resolve;
                    }
                )
        );

        renderAdminPage();

        await screen.findAllByText(
            "SKATES-001"
        );

        clickFirstButton(
            /markera återlämnad/i
        );

        const confirmButton =
            screen.getByRole(
                "button",
                {
                    name:
                        /ja, markera återlämnad/i,
                }
            );

        fireEvent.click(
            confirmButton
        );

        fireEvent.click(
            confirmButton
        );

        await waitFor(() => {
            expect(
                api.put
            ).toHaveBeenCalledTimes(1);
        });

        expect(
            screen.getByRole(
                "button",
                {
                    name:
                        /arbetar/i,
                }
            )
        ).toBeDisabled();

        await act(async () => {
            resolveReturnRequest({
                data: {
                    id: 21,
                    returned: true,
                },
            });
        });

        expect(
            await screen.findByText(
                /skates-001 är markerad som återlämnad/i
            )
        ).toBeInTheDocument();
    });

    test("inactivates equipment and updates returned response", async () => {
        const user =
            userEvent.setup();

        mockEquipmentList();

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
        ).toHaveTextContent(
            /lånehistoriken bevaras/i
        );

        await user.click(
            screen.getByRole(
                "button",
                {
                    name:
                        /ja, inaktivera/i,
                }
            )
        );

        expect(
            api.put
        ).toHaveBeenCalledWith(
            "/admin/equipment/1/active",
            {
                active: false,
            }
        );

        expect(
            await screen.findByText(
                /helmet-001 har inaktiverats/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getAllByRole(
                "button",
                {
                    name:
                        /återaktivera/i,
                }
            ).length
        ).toBeGreaterThan(0);
    });

    test("normalizes status update error and restores actions", async () => {
        const user =
            userEvent.setup();

        const forbiddenError = {
            apiCode:
                "ACCESS_DENIED",
            displayMessage:
                "Du saknar behörighet för åtgärden.",
        };

        mockEquipmentList();

        api.put.mockRejectedValueOnce(
            forbiddenError
        );

        renderAdminPage();

        await screen.findAllByText(
            "HELMET-001"
        );

        clickFirstButton(
            /^inaktivera$/i
        );

        await user.click(
            screen.getByRole(
                "button",
                {
                    name:
                        /ja, inaktivera/i,
                }
            )
        );

        expect(
            await screen.findByText(
                /du saknar behörighet för åtgärden/i
            )
        ).toBeInTheDocument();

        expect(
            screen.queryByRole(
                "dialog"
            )
        ).not.toBeInTheDocument();

        expect(
            getErrorMessage
        ).toHaveBeenCalledWith(
            forbiddenError,
            "Kunde inte ändra utrustningens status. Försök igen."
        );

        expect(
            screen.getAllByRole(
                "button",
                {
                    name:
                        /^inaktivera$/i,
                }
            )[0]
        ).toBeEnabled();
    });

    test("prevents duplicate active status updates", async () => {
        let resolveStatusRequest;

        mockEquipmentList();

        api.put.mockImplementationOnce(
            () =>
                new Promise(
                    (resolve) => {
                        resolveStatusRequest =
                            resolve;
                    }
                )
        );

        renderAdminPage();

        await screen.findAllByText(
            "HELMET-001"
        );

        clickFirstButton(
            /^inaktivera$/i
        );

        const confirmButton =
            screen.getByRole(
                "button",
                {
                    name:
                        /ja, inaktivera/i,
                }
            );

        fireEvent.click(
            confirmButton
        );

        fireEvent.click(
            confirmButton
        );

        expect(
            api.put
        ).toHaveBeenCalledTimes(1);

        await act(async () => {
            resolveStatusRequest({
                data: {
                    ...availableHelmet,
                    active: false,
                },
            });
        });

        expect(
            await screen.findByText(
                /helmet-001 har inaktiverats/i
            )
        ).toBeInTheDocument();
    });

    test("logs out once and disables button while pending", async () => {
        let resolveLogout;

        logoutMock.mockImplementationOnce(
            () =>
                new Promise(
                    (resolve) => {
                        resolveLogout =
                            resolve;
                    }
                )
        );

        mockEquipmentList();

        renderAdminPage();

        await screen.findAllByText(
            "HELMET-001"
        );

        const logoutButton =
            screen.getByRole(
                "button",
                {
                    name:
                        /logga ut/i,
                }
            );

        fireEvent.click(
            logoutButton
        );

        fireEvent.click(
            logoutButton
        );

        expect(
            logoutMock
        ).toHaveBeenCalledTimes(1);

        expect(
            screen.getByRole(
                "button",
                {
                    name:
                        /loggar ut/i,
                }
            )
        ).toBeDisabled();

        await act(async () => {
            resolveLogout();
        });
    });

    test("shows normalized logout error", async () => {
        const logoutError = {
            apiCode:
                "NETWORK_ERROR",
            displayMessage:
                "Kunde inte ansluta till servern.",
        };

        logoutMock.mockRejectedValueOnce(
            logoutError
        );

        mockEquipmentList();

        renderAdminPage();

        await screen.findAllByText(
            "HELMET-001"
        );

        fireEvent.click(
            screen.getByRole(
                "button",
                {
                    name:
                        /logga ut/i,
                }
            )
        );

        expect(
            await screen.findByText(
                /kunde inte ansluta till servern/i
            )
        ).toBeInTheDocument();

        expect(
            getErrorMessage
        ).toHaveBeenCalledWith(
            logoutError,
            "Utloggningen kunde inte slutföras. Försök igen."
        );
    });

    test("aborts equipment request when page unmounts", () => {
        api.get.mockReturnValue(
            new Promise(() => {})
        );

        const view =
            renderAdminPage();

        const requestConfiguration =
            api.get.mock.calls[0][1];

        expect(
            requestConfiguration
                .signal.aborted
        ).toBe(false);

        view.unmount();

        expect(
            requestConfiguration
                .signal.aborted
        ).toBe(true);
    });

    test("ignores authentication-required load error", async () => {
        const authenticationError = {
            apiCode:
                "AUTHENTICATION_REQUIRED",
            displayMessage:
                "Du behöver logga in som administratör.",
        };

        api.get.mockRejectedValueOnce(
            authenticationError
        );

        renderAdminPage();

        await waitFor(() => {
            expect(
                hasErrorCode
            ).toHaveBeenCalledWith(
                authenticationError,
                "AUTHENTICATION_REQUIRED"
            );
        });

        expect(
            screen.queryByText(
                /kunde inte hämta utrustningen/i
            )
        ).not.toBeInTheDocument();

        expect(
            getErrorMessage
        ).not.toHaveBeenCalledWith(
            authenticationError,
            "Kunde inte hämta utrustningen. Försök igen."
        );
    });
});