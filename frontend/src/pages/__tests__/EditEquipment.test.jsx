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
    Route,
    Routes,
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
    getFieldErrors,
    hasErrorCode,
} from "../../api/api";
import EditEquipment from "../EditEquipment";

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

    getFieldErrors: vi.fn(
        (error) =>
            error?.fieldErrors || {}
    ),

    hasErrorCode: vi.fn(
        (error, errorCode) =>
            error?.apiCode === errorCode
    ),
}));

const existingEquipment = {
    id: 7,
    type: "HELMET",
    serialNumber: "HELMET-007",
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

function renderEditEquipment() {
    return render(
        <MemoryRouter
            initialEntries={[
                "/admin/equipment/7/edit",
            ]}
        >
            <Routes>
                <Route
                    path="/admin/equipment/:id/edit"
                    element={
                        <EditEquipment />
                    }
                />

                <Route
                    path="/admin"
                    element={
                        <div>
                            Adminsidan
                        </div>
                    }
                />
            </Routes>
        </MemoryRouter>
    );
}

function submitForm() {
    fireEvent.submit(
        screen
            .getByRole(
                "button",
                {
                    name:
                        /spara ändringar/i,
                }
            )
            .closest("form")
    );
}

describe("EditEquipment", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("shows accessible loading state while equipment is fetched", async () => {
        api.get.mockResolvedValueOnce({
            data: existingEquipment,
        });

        renderEditEquipment();

        const status =
            screen.getByRole(
                "status"
            );

        expect(
            status
        ).toHaveAttribute(
            "aria-busy",
            "true"
        );

        expect(
            status
        ).toHaveTextContent(
            /laddar utrustning/i
        );

        expect(
            await screen.findByRole(
                "heading",
                {
                    name:
                        /redigera utrustning/i,
                }
            )
        ).toBeInTheDocument();
    });

    test("fetches equipment by id with abort signal and fills every field", async () => {
        api.get.mockResolvedValueOnce({
            data: existingEquipment,
        });

        renderEditEquipment();

        expect(
            await screen.findByLabelText(
                /serienummer/i
            )
        ).toHaveValue(
            "HELMET-007"
        );

        expect(
            api.get
        ).toHaveBeenCalledWith(
            "/admin/equipment/7",
            {
                signal:
                    expect.any(
                        AbortSignal
                    ),
            }
        );

        expect(
            screen.getByLabelText(
                /typ av utrustning/i
            )
        ).toHaveValue("HELMET");

        expect(
            screen.getByLabelText(
                /storlek/i
            )
        ).toHaveValue("M");

        expect(
            screen.getByLabelText(
                /märke/i
            )
        ).toHaveValue("Bauer");

        expect(
            screen.getByLabelText(
                /modell/i
            )
        ).toHaveValue(
            "Re-Akt 150"
        );

        expect(
            screen.getByLabelText(
                /^skick/i
            )
        ).toHaveValue("GOOD");

        expect(
            screen.getByLabelText(
                /ålderskategori/i
            )
        ).toHaveValue("JUNIOR");

        expect(
            screen.getByLabelText(
                /förvaringsplats/i
            )
        ).toHaveValue(
            "Hylla A2"
        );

        expect(
            screen.getByLabelText(
                /beskrivning/i
            )
        ).toHaveValue(
            "Svart hjälm"
        );
    });

    test("shows warning that changed serial number requires new QR label", async () => {
        api.get.mockResolvedValueOnce({
            data: existingEquipment,
        });

        renderEditEquipment();

        expect(
            await screen.findByText(
                /om serienumret ändras behöver du skriva ut en ny qr-etikett/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByRole(
                "status",
                {
                    name:
                        /tänk på qr-koden/i,
                }
            )
        ).toBeInTheDocument();
    });

    test("submits updated equipment without active or available fields", async () => {
        api.get.mockResolvedValueOnce({
            data: existingEquipment,
        });

        api.put.mockResolvedValueOnce({
            data: {
                ...existingEquipment,
                size: "L",
                condition: "WORN",
                storageLocation:
                    "Hylla C3",
            },
        });

        renderEditEquipment();

        const sizeInput =
            await screen.findByLabelText(
                /storlek/i
            );

        fireEvent.change(
            sizeInput,
            {
                target: {
                    value: " L ",
                },
            }
        );

        fireEvent.change(
            screen.getByLabelText(
                /^skick/i
            ),
            {
                target: {
                    value: "WORN",
                },
            }
        );

        fireEvent.change(
            screen.getByLabelText(
                /förvaringsplats/i
            ),
            {
                target: {
                    value:
                        " Hylla C3 ",
                },
            }
        );

        submitForm();

        await waitFor(() => {
            expect(
                api.put
            ).toHaveBeenCalledWith(
                "/admin/equipment/7",
                {
                    type:
                        "HELMET",
                    serialNumber:
                        "HELMET-007",
                    size: "L",
                    brand:
                        "Bauer",
                    model:
                        "Re-Akt 150",
                    condition:
                        "WORN",
                    ageCategory:
                        "JUNIOR",
                    storageLocation:
                        "Hylla C3",
                    description:
                        "Svart hjälm",
                }
            );
        });

        const payload =
            api.put.mock.calls[0][1];

        expect(
            payload
        ).not.toHaveProperty(
            "active"
        );

        expect(
            payload
        ).not.toHaveProperty(
            "available"
        );

        expect(
            await screen.findByText(
                "Adminsidan"
            )
        ).toBeInTheDocument();
    });

    test("shows local serial number validation error and focuses field", async () => {
        api.get.mockResolvedValueOnce({
            data: existingEquipment,
        });

        renderEditEquipment();

        const serialInput =
            await screen.findByLabelText(
                /serienummer/i
            );

        fireEvent.change(
            serialInput,
            {
                target: {
                    value:
                        "INVALID SERIAL",
                },
            }
        );

        submitForm();

        expect(
            await screen.findByText(
                /serienumret får endast innehålla bokstäver/i
            )
        ).toBeInTheDocument();

        expect(
            serialInput
        ).toHaveAttribute(
            "aria-invalid",
            "true"
        );

        await waitFor(() => {
            expect(
                serialInput
            ).toHaveFocus();
        });

        expect(
            api.put
        ).not.toHaveBeenCalled();
    });

    test("clears local field error when value changes", async () => {
        const user =
            userEvent.setup();

        api.get.mockResolvedValueOnce({
            data: existingEquipment,
        });

        renderEditEquipment();

        const serialInput =
            await screen.findByLabelText(
                /serienummer/i
            );

        fireEvent.change(
            serialInput,
            {
                target: {
                    value: "",
                },
            }
        );

        submitForm();

        expect(
            await screen.findByText(
                /serienummer måste fyllas i/i
            )
        ).toBeInTheDocument();

        await user.type(
            serialInput,
            "HELMET-008"
        );

        expect(
            screen.queryByText(
                /serienummer måste fyllas i/i
            )
        ).not.toBeInTheDocument();
    });

    test("shows backend validation error at corresponding field", async () => {
        const validationError = {
            apiCode:
                "VALIDATION_ERROR",
            fieldErrors: {
                serialNumber:
                    "Serienumret används redan.",
            },
        };

        api.get.mockResolvedValueOnce({
            data: existingEquipment,
        });

        api.put.mockRejectedValueOnce(
            validationError
        );

        renderEditEquipment();

        await screen.findByLabelText(
            /serienummer/i
        );

        submitForm();

        expect(
            await screen.findByText(
                /serienumret används redan/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(
                /serienummer/i
            )
        ).toHaveAttribute(
            "aria-invalid",
            "true"
        );

        expect(
            getFieldErrors
        ).toHaveBeenCalledWith(
            validationError
        );

        expect(
            getErrorMessage
        ).not.toHaveBeenCalledWith(
            validationError,
            "Kunde inte uppdatera utrustningen. Försök igen."
        );
    });

    test("shows not found state without rendering form", async () => {
        const notFoundError = {
            apiCode:
                "EQUIPMENT_NOT_FOUND",
            displayMessage:
                "Utrustningen kunde inte hittas.",
        };

        api.get.mockRejectedValueOnce(
            notFoundError
        );

        renderEditEquipment();

        expect(
            await screen.findByRole(
                "alert",
                {
                    name:
                        /utrustningen finns inte/i,
                }
            )
        ).toHaveTextContent(
            /utrustningen kunde inte hittas/i
        );

        expect(
            screen.queryByLabelText(
                /serienummer/i
            )
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole(
                "button",
                {
                    name:
                        /försök igen/i,
                }
            )
        ).not.toBeInTheDocument();

        expect(
            screen.getByRole(
                "link",
                {
                    name:
                        /till adminvyn/i,
                }
            )
        ).toHaveAttribute(
            "href",
            "/admin"
        );

        expect(
            hasErrorCode
        ).toHaveBeenCalledWith(
            notFoundError,
            "EQUIPMENT_NOT_FOUND"
        );
    });

    test("allows retry after temporary fetch error", async () => {
        const user =
            userEvent.setup();

        api.get
            .mockRejectedValueOnce({
                apiCode:
                    "NETWORK_ERROR",
                displayMessage:
                    "Kunde inte ansluta till servern.",
            })
            .mockResolvedValueOnce({
                data:
                existingEquipment,
            });

        renderEditEquipment();

        expect(
            await screen.findByText(
                /kunde inte ansluta till servern/i
            )
        ).toBeInTheDocument();

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
            await screen.findByLabelText(
                /serienummer/i
            )
        ).toHaveValue(
            "HELMET-007"
        );

        expect(
            api.get
        ).toHaveBeenCalledTimes(2);
    });

    test("shows normalized update error and focuses alert", async () => {
        const timeoutError = {
            apiCode:
                "REQUEST_TIMEOUT",
            displayMessage:
                "Anropet tog för lång tid. Försök igen.",
        };

        api.get.mockResolvedValueOnce({
            data: existingEquipment,
        });

        api.put.mockRejectedValueOnce(
            timeoutError
        );

        renderEditEquipment();

        await screen.findByLabelText(
            /serienummer/i
        );

        submitForm();

        const alert =
            await screen.findByRole(
                "alert",
                {
                    name:
                        /kunde inte spara ändringarna/i,
                }
            );

        expect(alert).toHaveTextContent(
            /anropet tog för lång tid/i
        );

        expect(
            alert.parentElement
        ).toHaveFocus();

        expect(
            getErrorMessage
        ).toHaveBeenCalledWith(
            timeoutError,
            "Kunde inte uppdatera utrustningen. Försök igen."
        );

        expect(
            screen.getByRole(
                "button",
                {
                    name:
                        /spara ändringar/i,
                }
            )
        ).toBeEnabled();
    });

    test("prevents duplicate submissions while update is pending", async () => {
        let resolveRequest;

        api.get.mockResolvedValueOnce({
            data: existingEquipment,
        });

        api.put.mockImplementationOnce(
            () =>
                new Promise(
                    (resolve) => {
                        resolveRequest =
                            resolve;
                    }
                )
        );

        renderEditEquipment();

        await screen.findByLabelText(
            /serienummer/i
        );

        const form = screen
            .getByRole(
                "button",
                {
                    name:
                        /spara ändringar/i,
                }
            )
            .closest("form");

        fireEvent.submit(form);
        fireEvent.submit(form);

        expect(
            api.put
        ).toHaveBeenCalledTimes(1);

        expect(
            screen.getByRole(
                "button",
                {
                    name: /sparar/i,
                }
            )
        ).toBeDisabled();

        expect(
            screen.getByLabelText(
                /serienummer/i
            )
        ).toBeDisabled();

        await act(async () => {
            resolveRequest({
                data:
                existingEquipment,
            });
        });

        expect(
            await screen.findByText(
                "Adminsidan"
            )
        ).toBeInTheDocument();
    });

    test("cancel navigates back without update", async () => {
        const user =
            userEvent.setup();

        api.get.mockResolvedValueOnce({
            data: existingEquipment,
        });

        renderEditEquipment();

        await screen.findByLabelText(
            /serienummer/i
        );

        await user.click(
            screen.getByRole(
                "button",
                {
                    name: /avbryt/i,
                }
            )
        );

        expect(
            await screen.findByText(
                "Adminsidan"
            )
        ).toBeInTheDocument();

        expect(
            api.put
        ).not.toHaveBeenCalled();
    });

    test("aborts fetch request when page unmounts", () => {
        api.get.mockReturnValue(
            new Promise(() => {})
        );

        const view =
            renderEditEquipment();

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
});