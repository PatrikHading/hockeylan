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
import LoanForm from "../LoanForm";

vi.mock("../../api/api", () => ({
    default: {
        get: vi.fn(),
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

    hasErrorCode: vi.fn(
        (error, errorCode) =>
            error?.apiCode === errorCode
    ),
}));

const availableEquipment = {
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

function futureDate() {
    const date = new Date();

    date.setFullYear(
        date.getFullYear() + 1
    );

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2, "0"),
        String(
            date.getDate()
        ).padStart(2, "0"),
    ].join("-");
}

function registeredLoan(
    expectedReturnDate
) {
    return {
        id: 10,
        borrowerName:
            "Patrik Hading",
        email:
            "patrik@example.com",
        phoneNumber:
            "+46701234567",
        loanDate:
            "2026-07-30T12:00:00",
        expectedReturnDate,
        returned: false,
        returnedAt: null,
        overdue: false,
        returnedLate: false,
        equipment:
        availableEquipment,
    };
}

function renderLoanForm(
    serialNumber = "HELMET-001"
) {
    return render(
        <MemoryRouter
            initialEntries={[
                `/loan/${serialNumber}`,
            ]}
        >
            <Routes>
                <Route
                    path="/loan/:serialNumber"
                    element={<LoanForm />}
                />

                <Route
                    path="/loan/success"
                    element={
                        <div>
                            Lånet registrerades
                        </div>
                    }
                />

                <Route
                    path="/scan"
                    element={
                        <div>
                            QR-skannern
                        </div>
                    }
                />

                <Route
                    path="/admin"
                    element={
                        <div>
                            Adminvyn
                        </div>
                    }
                />
            </Routes>
        </MemoryRouter>
    );
}

function fillForm(
    expectedReturnDate,
    {
        borrowerName =
        "Patrik Hading",
        email =
        "patrik@example.com",
        phoneNumber =
        "+46701234567",
    } = {}
) {
    fireEvent.change(
        screen.getByLabelText(
            /låntagarens namn/i
        ),
        {
            target: {
                value:
                borrowerName,
            },
        }
    );

    fireEvent.change(
        screen.getByLabelText(
            /låntagarens e-post/i
        ),
        {
            target: {
                value: email,
            },
        }
    );

    fireEvent.change(
        screen.getByLabelText(
            /låntagarens telefonnummer/i
        ),
        {
            target: {
                value:
                phoneNumber,
            },
        }
    );

    fireEvent.change(
        screen.getByLabelText(
            /förväntat återlämningsdatum/i
        ),
        {
            target: {
                value:
                expectedReturnDate,
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
                        /^registrera lån$/i,
                }
            )
            .closest("form")
    );
}

describe("LoanForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("renders accessible loading state and fetches equipment", async () => {
        api.get.mockResolvedValueOnce({
            data: availableEquipment,
        });

        renderLoanForm();

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
            /hämtar utrustning/i
        );

        expect(
            await screen.findByRole(
                "heading",
                {
                    name:
                        /registrera lån/i,
                }
            )
        ).toBeInTheDocument();

        expect(
            api.get
        ).toHaveBeenCalledTimes(1);

        expect(
            api.get
        ).toHaveBeenCalledWith(
            "/loan/HELMET-001",
            {
                signal:
                    expect.any(
                        AbortSignal
                    ),
            }
        );
    });

    test("encodes serial number before API request", async () => {
        api.get.mockResolvedValueOnce({
            data: availableEquipment,
        });

        renderLoanForm(
            "HELMET_001"
        );

        await screen.findByRole(
            "heading",
            {
                name:
                    /registrera lån/i,
            }
        );

        expect(
            api.get
        ).toHaveBeenCalledWith(
            "/loan/HELMET_001",
            {
                signal:
                    expect.any(
                        AbortSignal
                    ),
            }
        );
    });

    test("renders equipment and administrator fields", async () => {
        api.get.mockResolvedValueOnce({
            data: availableEquipment,
        });

        renderLoanForm();

        expect(
            await screen.findByRole(
                "heading",
                {
                    name:
                        /registrera lån/i,
                }
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /endast.*utsedd.*klubbadministratör/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "HELMET-001"
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "Hjälm"
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText("M")
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "Bauer"
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "Re-Akt 150"
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "Bra"
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "Junior"
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "Hylla A2"
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "Svart hjälm"
            )
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(
                /låntagarens namn/i
            )
        ).toBeEnabled();

        expect(
            screen.getByLabelText(
                /låntagarens e-post/i
            )
        ).toBeEnabled();

        expect(
            screen.getByLabelText(
                /låntagarens telefonnummer/i
            )
        ).toHaveAttribute(
            "inputmode",
            "tel"
        );

        const dateInput =
            screen.getByLabelText(
                /förväntat återlämningsdatum/i
            );

        expect(
            dateInput
        ).toBeEnabled();

        expect(
            dateInput
        ).toBeRequired();

        expect(
            dateInput
        ).toHaveAttribute("min");

        expect(
            dateInput
        ).not.toHaveAttribute(
            "max"
        );
    });

    test("submits normalized loan data and navigates to success page", async () => {
        const expectedReturnDate =
            futureDate();

        api.get.mockResolvedValueOnce({
            data: availableEquipment,
        });

        api.post.mockResolvedValueOnce({
            data:
                registeredLoan(
                    expectedReturnDate
                ),
        });

        renderLoanForm();

        await screen.findByLabelText(
            /låntagarens namn/i
        );

        fillForm(
            expectedReturnDate,
            {
                borrowerName:
                    "  Patrik Hading  ",
                email:
                    "  patrik@example.com  ",
                phoneNumber:
                    "  +46701234567  ",
            }
        );

        submitForm();

        await waitFor(() => {
            expect(
                api.post
            ).toHaveBeenCalledWith(
                "/admin/loans/HELMET-001",
                {
                    borrowerName:
                        "Patrik Hading",
                    email:
                        "patrik@example.com",
                    phoneNumber:
                        "+46701234567",
                    expectedReturnDate,
                }
            );
        });

        expect(
            await screen.findByText(
                /lånet registrerades/i
            )
        ).toBeInTheDocument();
    });

    test("shows local validation errors and focuses first invalid field", async () => {
        api.get.mockResolvedValueOnce({
            data: availableEquipment,
        });

        renderLoanForm();

        await screen.findByLabelText(
            /låntagarens namn/i
        );

        submitForm();

        expect(
            await screen.findByText(
                /låntagarens namn måste anges/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /låntagarens e-postadress måste anges/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /låntagarens telefonnummer måste anges/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /förväntat återlämningsdatum måste anges/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /ett eller flera fält behöver rättas/i
            )
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(
                screen.getByLabelText(
                    /låntagarens namn/i
                )
            ).toHaveFocus();
        });

        expect(
            api.post
        ).not.toHaveBeenCalled();
    });

    test("shows validation error for invalid email", async () => {
        api.get.mockResolvedValueOnce({
            data: availableEquipment,
        });

        renderLoanForm();

        await screen.findByLabelText(
            /låntagarens namn/i
        );

        fillForm(
            futureDate(),
            {
                email:
                    "not-an-email",
            }
        );

        submitForm();

        expect(
            await screen.findByText(
                /ange en giltig e-postadress/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(
                /låntagarens e-post/i
            )
        ).toHaveAttribute(
            "aria-invalid",
            "true"
        );

        expect(
            api.post
        ).not.toHaveBeenCalled();
    });

    test("clears field error when user changes the field", async () => {
        const user =
            userEvent.setup();

        api.get.mockResolvedValueOnce({
            data: availableEquipment,
        });

        renderLoanForm();

        await screen.findByLabelText(
            /låntagarens namn/i
        );

        submitForm();

        expect(
            await screen.findByText(
                /låntagarens namn måste anges/i
            )
        ).toBeInTheDocument();

        await user.type(
            screen.getByLabelText(
                /låntagarens namn/i
            ),
            "Patrik Hading"
        );

        expect(
            screen.queryByText(
                /låntagarens namn måste anges/i
            )
        ).not.toBeInTheDocument();
    });

    test("shows backend field errors at corresponding controls", async () => {
        const expectedReturnDate =
            futureDate();

        api.get.mockResolvedValueOnce({
            data: availableEquipment,
        });

        const validationError = {
            apiCode:
                "VALIDATION_ERROR",
            fieldErrors: {
                email:
                    "E-postadressen är inte giltig.",
                phoneNumber:
                    "Telefonnumret är inte giltigt.",
            },
            displayMessage:
                "Kontrollera formuläret.",
        };

        api.post.mockRejectedValueOnce(
            validationError
        );

        renderLoanForm();

        await screen.findByLabelText(
            /låntagarens namn/i
        );

        fillForm(
            expectedReturnDate
        );

        submitForm();

        expect(
            await screen.findByText(
                /e-postadressen är inte giltig/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                /telefonnumret är inte giltigt/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(
                /låntagarens e-post/i
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
            "Lånet kunde inte registreras. Försök igen."
        );
    });

    test("shows unknown QR code state without retry button", async () => {
        const notFoundError = {
            apiCode:
                "EQUIPMENT_NOT_FOUND",
            displayMessage:
                "Utrustningen kunde inte hittas.",
        };

        api.get.mockRejectedValueOnce(
            notFoundError
        );

        renderLoanForm(
            "UNKNOWN-001"
        );

        expect(
            await screen.findByRole(
                "alert",
                {
                    name:
                        /ogiltig eller okänd qr-kod/i,
                }
            )
        ).toHaveTextContent(
            /utrustningen kunde inte hittas/i
        );

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
                        /skanna en annan qr-kod/i,
                }
            )
        ).toHaveAttribute(
            "href",
            "/scan"
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
                availableEquipment,
            });

        renderLoanForm();

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
            await screen.findByRole(
                "heading",
                {
                    name:
                        /registrera lån/i,
                }
            )
        ).toBeInTheDocument();

        expect(
            api.get
        ).toHaveBeenCalledTimes(2);
    });

    test("disables form when equipment is already loaned", async () => {
        api.get.mockResolvedValueOnce({
            data: {
                ...availableEquipment,
                available: false,
            },
        });

        renderLoanForm();

        expect(
            await screen.findByRole(
                "heading",
                {
                    name:
                        /redan utlånad/i,
                }
            )
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(
                /låntagarens namn/i
            )
        ).toBeDisabled();

        expect(
            screen.getByLabelText(
                /låntagarens e-post/i
            )
        ).toBeDisabled();

        expect(
            screen.getByLabelText(
                /låntagarens telefonnummer/i
            )
        ).toBeDisabled();

        expect(
            screen.getByLabelText(
                /förväntat återlämningsdatum/i
            )
        ).toBeDisabled();

        expect(
            screen.getByRole(
                "button",
                {
                    name:
                        /redan utlånad/i,
                }
            )
        ).toBeDisabled();

        expect(
            api.post
        ).not.toHaveBeenCalled();
    });

    test("updates form when equipment becomes loaned during submission", async () => {
        const expectedReturnDate =
            futureDate();

        api.get.mockResolvedValueOnce({
            data: availableEquipment,
        });

        api.post.mockRejectedValueOnce({
            apiCode:
                "EQUIPMENT_ALREADY_LOANED",
            displayMessage:
                "Utrustningen är redan utlånad.",
        });

        renderLoanForm();

        await screen.findByLabelText(
            /låntagarens namn/i
        );

        fillForm(
            expectedReturnDate
        );

        submitForm();

        expect(
            await screen.findByRole(
                "heading",
                {
                    name:
                        /redan utlånad/i,
                }
            )
        ).toBeInTheDocument();

        expect(
            screen.getByRole(
                "button",
                {
                    name:
                        /redan utlånad/i,
                }
            )
        ).toBeDisabled();

        expect(
            screen.getByLabelText(
                /låntagarens namn/i
            )
        ).toBeDisabled();

        expect(
            hasErrorCode
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                apiCode:
                    "EQUIPMENT_ALREADY_LOANED",
            }),
            "EQUIPMENT_ALREADY_LOANED"
        );
    });

    test("disables form when equipment is inactive", async () => {
        api.get.mockResolvedValueOnce({
            data: {
                ...availableEquipment,
                active: false,
            },
        });

        renderLoanForm();

        expect(
            await screen.findByRole(
                "heading",
                {
                    name:
                        /inaktiverad/i,
                }
            )
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(
                /låntagarens namn/i
            )
        ).toBeDisabled();

        expect(
            screen.getByLabelText(
                /förväntat återlämningsdatum/i
            )
        ).toBeDisabled();

        expect(
            screen.getByRole(
                "button",
                {
                    name:
                        /inaktiverad/i,
                }
            )
        ).toBeDisabled();

        expect(
            api.post
        ).not.toHaveBeenCalled();
    });

    test("shows normalized timeout error and restores form", async () => {
        const expectedReturnDate =
            futureDate();

        const timeoutError = {
            apiCode:
                "REQUEST_TIMEOUT",
            displayMessage:
                "Anropet tog för lång tid. Försök igen.",
        };

        api.get.mockResolvedValueOnce({
            data: availableEquipment,
        });

        api.post.mockRejectedValueOnce(
            timeoutError
        );

        renderLoanForm();

        await screen.findByLabelText(
            /låntagarens namn/i
        );

        fillForm(
            expectedReturnDate
        );

        submitForm();

        expect(
            await screen.findByText(
                /anropet tog för lång tid/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByRole(
                "button",
                {
                    name:
                        /^registrera lån$/i,
                }
            )
        ).toBeEnabled();

        expect(
            getErrorMessage
        ).toHaveBeenCalledWith(
            timeoutError,
            "Lånet kunde inte registreras. Försök igen."
        );
    });

    test("prevents duplicate submissions while registration is pending", async () => {
        const expectedReturnDate =
            futureDate();

        let resolveRequest;

        api.get.mockResolvedValueOnce({
            data: availableEquipment,
        });

        api.post.mockImplementationOnce(
            () =>
                new Promise(
                    (resolve) => {
                        resolveRequest =
                            resolve;
                    }
                )
        );

        renderLoanForm();

        await screen.findByLabelText(
            /låntagarens namn/i
        );

        fillForm(
            expectedReturnDate
        );

        const form = screen
            .getByRole(
                "button",
                {
                    name:
                        /^registrera lån$/i,
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
                    name:
                        /registrerar lån/i,
                }
            )
        ).toBeDisabled();

        await act(async () => {
            resolveRequest({
                data:
                    registeredLoan(
                        expectedReturnDate
                    ),
            });
        });

        expect(
            await screen.findByText(
                /lånet registrerades/i
            )
        ).toBeInTheDocument();
    });

    test("aborts equipment request when page unmounts", () => {
        api.get.mockReturnValue(
            new Promise(() => {})
        );

        const view =
            renderLoanForm();

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