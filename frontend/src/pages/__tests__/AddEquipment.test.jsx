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
} from "../../api/api";
import AddEquipment from "../AddEquipment";

vi.mock("../../api/api", () => ({
    default: {
        post: vi.fn(),
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
}));

function renderAddEquipment() {
    return render(
        <MemoryRouter
            initialEntries={[
                "/admin/add",
            ]}
        >
            <Routes>
                <Route
                    path="/admin/add"
                    element={
                        <AddEquipment />
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

function fillRequiredSerialNumber(
    value = "HELMET-001"
) {
    fireEvent.change(
        screen.getByLabelText(
            /serienummer/i
        ),
        {
            target: {
                value,
            },
        }
    );
}

function submitForm() {
    fireEvent.submit(
        screen
            .getByRole(
                "button",
                {
                    name:
                        /spara utrustning/i,
                }
            )
            .closest("form")
    );
}

describe("AddEquipment", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("renders all equipment fields with expected defaults", () => {
        renderAddEquipment();

        expect(
            screen.getByRole(
                "heading",
                {
                    name:
                        /lägg till utrustning/i,
                }
            )
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(
                /typ av utrustning/i
            )
        ).toHaveValue("HELMET");

        expect(
            screen.getByLabelText(
                /serienummer/i
            )
        ).toHaveAttribute(
            "autocapitalize",
            "characters"
        );

        expect(
            screen.getByLabelText(
                /storlek/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(
                /märke/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(
                /modell/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(
                /^skick/i
            )
        ).toHaveValue("GOOD");

        expect(
            screen.getByLabelText(
                /ålderskategori/i
            )
        ).toHaveValue("");

        expect(
            screen.getByLabelText(
                /förvaringsplats/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(
                /beskrivning/i
            )
        ).toBeInTheDocument();
    });

    test("submits every equipment field and navigates to admin page", async () => {
        api.post.mockResolvedValueOnce({
            data: {
                id: 1,
            },
        });

        renderAddEquipment();

        fillRequiredSerialNumber();

        fireEvent.change(
            screen.getByLabelText(
                /storlek/i
            ),
            {
                target: {
                    value: " M ",
                },
            }
        );

        fireEvent.change(
            screen.getByLabelText(
                /märke/i
            ),
            {
                target: {
                    value:
                        " Bauer ",
                },
            }
        );

        fireEvent.change(
            screen.getByLabelText(
                /modell/i
            ),
            {
                target: {
                    value:
                        " Re-Akt 150 ",
                },
            }
        );

        fireEvent.change(
            screen.getByLabelText(
                /ålderskategori/i
            ),
            {
                target: {
                    value:
                        "JUNIOR",
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
                        " Hylla A2 ",
                },
            }
        );

        fireEvent.change(
            screen.getByLabelText(
                /beskrivning/i
            ),
            {
                target: {
                    value:
                        " Svart hjälm ",
                },
            }
        );

        submitForm();

        await waitFor(() => {
            expect(
                api.post
            ).toHaveBeenCalledWith(
                "/admin/equipment",
                {
                    type:
                        "HELMET",
                    serialNumber:
                        "HELMET-001",
                    size: "M",
                    brand:
                        "Bauer",
                    model:
                        "Re-Akt 150",
                    condition:
                        "GOOD",
                    ageCategory:
                        "JUNIOR",
                    storageLocation:
                        "Hylla A2",
                    description:
                        "Svart hjälm",
                }
            );
        });

        expect(
            await screen.findByText(
                "Adminsidan"
            )
        ).toBeInTheDocument();
    });

    test("converts blank optional fields to null", async () => {
        api.post.mockResolvedValueOnce({
            data: {
                id: 1,
            },
        });

        renderAddEquipment();

        fillRequiredSerialNumber();
        submitForm();

        await waitFor(() => {
            expect(
                api.post
            ).toHaveBeenCalledWith(
                "/admin/equipment",
                {
                    type:
                        "HELMET",
                    serialNumber:
                        "HELMET-001",
                    size: null,
                    brand: null,
                    model: null,
                    condition:
                        "GOOD",
                    ageCategory:
                        null,
                    storageLocation:
                        null,
                    description:
                        null,
                }
            );
        });
    });

    test("shows required serial number error and focuses field", async () => {
        renderAddEquipment();

        submitForm();

        expect(
            await screen.findByText(
                /serienummer måste fyllas i/i
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

        await waitFor(() => {
            expect(
                screen.getByLabelText(
                    /serienummer/i
                )
            ).toHaveFocus();
        });

        expect(
            api.post
        ).not.toHaveBeenCalled();
    });

    test.each([
        [
            "A",
            /minst 2 tecken/i,
        ],
        [
            "HELMET 001",
            /endast innehålla bokstäver/i,
        ],
        [
            "HELMET.001",
            /endast innehålla bokstäver/i,
        ],
    ])(
        "rejects invalid serial number %s",
        async (
            serialNumber,
            expectedMessage
        ) => {
            renderAddEquipment();

            fillRequiredSerialNumber(
                serialNumber
            );

            submitForm();

            expect(
                await screen.findByText(
                    expectedMessage
                )
            ).toBeInTheDocument();

            expect(
                api.post
            ).not.toHaveBeenCalled();
        }
    );

    test("clears field error when serial number changes", async () => {
        const user =
            userEvent.setup();

        renderAddEquipment();

        submitForm();

        expect(
            await screen.findByText(
                /serienummer måste fyllas i/i
            )
        ).toBeInTheDocument();

        await user.type(
            screen.getByLabelText(
                /serienummer/i
            ),
            "HELMET-001"
        );

        expect(
            screen.queryByText(
                /serienummer måste fyllas i/i
            )
        ).not.toBeInTheDocument();
    });

    test("shows backend field error at serial number", async () => {
        const validationError = {
            apiCode:
                "VALIDATION_ERROR",
            fieldErrors: {
                serialNumber:
                    "Serienumret används redan.",
            },
        };

        api.post.mockRejectedValueOnce(
            validationError
        );

        renderAddEquipment();

        fillRequiredSerialNumber();
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
        ).not.toHaveBeenCalled();
    });

    test("shows normalized API error and focuses alert", async () => {
        const networkError = {
            apiCode:
                "NETWORK_ERROR",
            displayMessage:
                "Kunde inte ansluta till servern.",
        };

        api.post.mockRejectedValueOnce(
            networkError
        );

        renderAddEquipment();

        fillRequiredSerialNumber();
        submitForm();

        const alert =
            await screen.findByRole(
                "alert",
                {
                    name:
                        /kunde inte spara/i,
                }
            );

        expect(alert).toHaveTextContent(
            /kunde inte ansluta till servern/i
        );

        expect(
            alert.parentElement
        ).toHaveFocus();

        expect(
            getErrorMessage
        ).toHaveBeenCalledWith(
            networkError,
            "Kunde inte lägga till utrustningen. Försök igen."
        );

        expect(
            screen.getByRole(
                "button",
                {
                    name:
                        /spara utrustning/i,
                }
            )
        ).toBeEnabled();
    });

    test("prevents duplicate submissions while save is pending", async () => {
        let resolveRequest;

        api.post.mockImplementationOnce(
            () =>
                new Promise(
                    (resolve) => {
                        resolveRequest =
                            resolve;
                    }
                )
        );

        renderAddEquipment();

        fillRequiredSerialNumber();

        const form = screen
            .getByRole(
                "button",
                {
                    name:
                        /spara utrustning/i,
                }
            )
            .closest("form");

        fireEvent.submit(form);
        fireEvent.submit(form);

        expect(
            api.post
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
                data: {
                    id: 1,
                },
            });
        });

        expect(
            await screen.findByText(
                "Adminsidan"
            )
        ).toBeInTheDocument();
    });

    test("cancel navigates to admin page without saving", async () => {
        const user =
            userEvent.setup();

        renderAddEquipment();

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
            api.post
        ).not.toHaveBeenCalled();
    });
});