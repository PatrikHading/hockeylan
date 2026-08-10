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

const aliasSummaries = [
    {
        id: 7,
        aliasName: "Lagledaren",
    },
    {
        id: 12,
        aliasName: "Materialaren",
    },
];

const aliasDetails = {
    id: 7,
    aliasName: "Lagledaren",
    borrowerName: "Anna Andersson",
    email: "anna@example.com",
    phoneNumber: "+46701112233",
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

function yesterday() {
    const date = new Date();

    date.setDate(
        date.getDate() - 1
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
    expectedReturnDate = null
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

function mockInitialLoad({
                             equipment =
                             availableEquipment,
                             aliases =
                             aliasSummaries,
                             equipmentError,
                             aliasesError,
                             alias =
                             aliasDetails,
                             aliasError,
                         } = {}) {
    api.get.mockImplementation(
        (url) => {
            if (
                url ===
                "/admin/borrower-aliases"
            ) {
                return aliasesError
                    ? Promise.reject(
                        aliasesError
                    )
                    : Promise.resolve({
                        data:
                        aliases,
                    });
            }

            if (
                url.startsWith(
                    "/admin/borrower-aliases/"
                )
            ) {
                return aliasError
                    ? Promise.reject(
                        aliasError
                    )
                    : Promise.resolve({
                        data:
                        alias,
                    });
            }

            if (
                url.startsWith(
                    "/loan/"
                )
            ) {
                return equipmentError
                    ? Promise.reject(
                        equipmentError
                    )
                    : Promise.resolve({
                        data:
                        equipment,
                    });
            }

            return Promise.reject(
                new Error(
                    `Unexpected GET ${url}`
                )
            );
        }
    );
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

function fillContactFields({
                               borrowerName =
                               "Patrik Hading",
                               email =
                               "patrik@example.com",
                               phoneNumber =
                               "+46701234567",
                           } = {}) {
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
                value:
                email,
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
}

function fillReturnDate(value) {
    fireEvent.change(
        screen.getByLabelText(
            /förväntat återlämningsdatum/i
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

    test("renders loading state and fetches equipment and aliases", async () => {
        mockInitialLoad();

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
        ).toHaveBeenCalledWith(
            "/loan/HELMET-001",
            {
                signal:
                    expect.any(
                        AbortSignal
                    ),
            }
        );

        expect(
            api.get
        ).toHaveBeenCalledWith(
            "/admin/borrower-aliases",
            {
                signal:
                    expect.any(
                        AbortSignal
                    ),
            }
        );
    });

    test("encodes serial number before equipment request", async () => {
        mockInitialLoad();

        renderLoanForm(
            "HELMET 001"
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
            "/loan/HELMET%20001",
            {
                signal:
                    expect.any(
                        AbortSignal
                    ),
            }
        );
    });

    test("renders equipment, alias selector and optional return date", async () => {
        mockInitialLoad();

        renderLoanForm();

        await screen.findByRole(
            "heading",
            {
                name:
                    /registrera lån/i,
            }
        );

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
            screen.getByText(
                "Bauer"
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "Lagledaren"
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "Materialaren"
            )
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(
                /välj alias/i
            )
        ).toBeEnabled();

        expect(
            screen.getByLabelText(
                /spara som alias/i
            )
        ).toBeEnabled();

        const dateInput =
            screen.getByLabelText(
                /förväntat återlämningsdatum/i
            );

        expect(
            dateInput
        ).toBeEnabled();

        expect(
            dateInput
        ).not.toBeRequired();

        expect(
            dateInput
        ).toHaveAttribute("min");

        expect(
            dateInput
        ).not.toHaveAttribute(
            "max"
        );

        expect(
            screen.getByText(
                /valfritt.*ingen maximal lånetid/i
            )
        ).toBeInTheDocument();
    });

    test("submits a manual loan without expected return date", async () => {
        mockInitialLoad();

        api.post.mockResolvedValueOnce({
            data:
                registeredLoan(null),
        });

        renderLoanForm();

        await screen.findByLabelText(
            /låntagarens namn/i
        );

        fillContactFields({
            borrowerName:
                "  Patrik Hading  ",
            email:
                "  patrik@example.com  ",
            phoneNumber:
                "  +46701234567  ",
        });

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
                    aliasName:
                        null,
                    expectedReturnDate:
                        null,
                }
            );
        });

        expect(
            await screen.findByText(
                /lånet registrerades/i
            )
        ).toBeInTheDocument();
    });

    test("submits an explicitly selected expected return date", async () => {
        const expectedReturnDate =
            futureDate();

        mockInitialLoad();

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

        fillContactFields();
        fillReturnDate(
            expectedReturnDate
        );

        submitForm();

        await waitFor(() => {
            expect(
                api.post
            ).toHaveBeenCalledWith(
                "/admin/loans/HELMET-001",
                expect.objectContaining({
                    expectedReturnDate,
                })
            );
        });
    });

    test("validates required contact fields but not an empty return date", async () => {
        mockInitialLoad();

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
            screen.queryByText(
                /återlämningsdatum måste anges/i
            )
        ).not.toBeInTheDocument();

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

    test("rejects a return date before today", async () => {
        mockInitialLoad();

        renderLoanForm();

        await screen.findByLabelText(
            /låntagarens namn/i
        );

        fillContactFields();
        fillReturnDate(yesterday());

        submitForm();

        expect(
            await screen.findByText(
                /får inte ligga före dagens datum/i
            )
        ).toBeInTheDocument();

        expect(
            api.post
        ).not.toHaveBeenCalled();
    });

    test("loads selected alias and allows loan-specific edits", async () => {
        const user =
            userEvent.setup();

        mockInitialLoad();

        api.post.mockResolvedValueOnce({
            data:
                registeredLoan(null),
        });

        renderLoanForm();

        const selector =
            await screen.findByLabelText(
                /välj alias/i
            );

        await user.selectOptions(
            selector,
            "7"
        );

        await waitFor(() => {
            expect(
                screen.getByLabelText(
                    /låntagarens namn/i
                )
            ).toHaveValue(
                "Anna Andersson"
            );

            expect(
                screen.getByLabelText(
                    /låntagarens e-post/i
                )
            ).toHaveValue(
                "anna@example.com"
            );

            expect(
                screen.getByLabelText(
                    /låntagarens telefonnummer/i
                )
            ).toHaveValue(
                "+46701112233"
            );
        });

        expect(
            api.get
        ).toHaveBeenCalledWith(
            "/admin/borrower-aliases/7",
            {
                signal:
                    expect.any(
                        AbortSignal
                    ),
            }
        );

        expect(
            screen.queryByLabelText(
                /spara som alias/i
            )
        ).not.toBeInTheDocument();

        expect(
            screen.getByText(
                /ändringar nedan gäller endast detta lån/i
            )
        ).toBeInTheDocument();

        await user.clear(
            screen.getByLabelText(
                /låntagarens namn/i
            )
        );

        await user.type(
            screen.getByLabelText(
                /låntagarens namn/i
            ),
            "Anna Tillfällig"
        );

        submitForm();

        await waitFor(() => {
            expect(
                api.post
            ).toHaveBeenCalledWith(
                "/admin/loans/HELMET-001",
                {
                    borrowerName:
                        "Anna Tillfällig",
                    email:
                        "anna@example.com",
                    phoneNumber:
                        "+46701112233",
                    aliasName:
                        null,
                    expectedReturnDate:
                        null,
                }
            );
        });
    });

    test("shows alias name field only when save as alias is selected", async () => {
        const user =
            userEvent.setup();

        mockInitialLoad();

        renderLoanForm();

        await screen.findByLabelText(
            /spara som alias/i
        );

        expect(
            screen.queryByLabelText(
                /^aliasnamn/i
            )
        ).not.toBeInTheDocument();

        await user.click(
            screen.getByLabelText(
                /spara som alias/i
            )
        );

        const aliasNameInput =
            screen.getByLabelText(
                /^aliasnamn/i
            );

        expect(
            aliasNameInput
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(
                aliasNameInput
            ).toHaveFocus();
        });

        await user.click(
            screen.getByLabelText(
                /spara som alias/i
            )
        );

        expect(
            screen.queryByLabelText(
                /^aliasnamn/i
            )
        ).not.toBeInTheDocument();
    });

    test("requires and normalizes alias name when saving a new alias", async () => {
        const user =
            userEvent.setup();

        mockInitialLoad();

        api.post.mockResolvedValueOnce({
            data:
                registeredLoan(null),
        });

        renderLoanForm();

        await screen.findByLabelText(
            /låntagarens namn/i
        );

        fillContactFields();

        await user.click(
            screen.getByLabelText(
                /spara som alias/i
            )
        );

        submitForm();

        expect(
            await screen.findByText(
                /^aliasnamn måste anges/i
            )
        ).toBeInTheDocument();

        expect(
            api.post
        ).not.toHaveBeenCalled();

        await user.type(
            screen.getByLabelText(
                /^aliasnamn/i
            ),
            "  Lagets   målvakt  "
        );

        submitForm();

        await waitFor(() => {
            expect(
                api.post
            ).toHaveBeenCalledWith(
                "/admin/loans/HELMET-001",
                expect.objectContaining({
                    aliasName:
                        "Lagets målvakt",
                })
            );
        });
    });

    test("shows duplicate alias error at alias name field", async () => {
        const user =
            userEvent.setup();

        const duplicateError = {
            apiCode:
                "DUPLICATE_RESOURCE",
            displayMessage:
                "Det finns redan ett Alias med det namnet.",
        };

        mockInitialLoad();

        api.post.mockRejectedValueOnce(
            duplicateError
        );

        renderLoanForm();

        await screen.findByLabelText(
            /låntagarens namn/i
        );

        fillContactFields();

        await user.click(
            screen.getByLabelText(
                /spara som alias/i
            )
        );

        await user.type(
            screen.getByLabelText(
                /^aliasnamn/i
            ),
            "Lagledaren"
        );

        submitForm();

        expect(
            await screen.findByText(
                /finns redan ett alias med det namnet/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(
                /^aliasnamn/i
            )
        ).toHaveAttribute(
            "aria-invalid",
            "true"
        );

        expect(
            screen.queryByText(
                /^lånet kunde inte registreras$/i
            )
        ).not.toBeInTheDocument();

        await waitFor(() => {
            expect(
                screen.getByLabelText(
                    /^aliasnamn/i
                )
            ).toHaveFocus();
        });
    });

    test("keeps manual registration available when alias list fails", async () => {
        mockInitialLoad({
            aliasesError: {
                apiCode:
                    "NETWORK_ERROR",
                displayMessage:
                    "Aliastjänsten svarar inte.",
            },
        });

        renderLoanForm();

        expect(
            await screen.findByText(
                /aliastjänsten svarar inte/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(
                /låntagarens namn/i
            )
        ).toBeEnabled();

        expect(
            screen.getByLabelText(
                /spara som alias/i
            )
        ).toBeEnabled();
    });

    test("restores manual mode when selected alias cannot be loaded", async () => {
        const user =
            userEvent.setup();

        mockInitialLoad({
            aliasError: {
                apiCode:
                    "RESOURCE_NOT_FOUND",
                displayMessage:
                    "Aliaset finns inte längre.",
            },
        });

        renderLoanForm();

        await user.selectOptions(
            await screen.findByLabelText(
                /välj alias/i
            ),
            "7"
        );

        expect(
            await screen.findByText(
                /aliaset finns inte längre/i
            )
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(
                /välj alias/i
            )
        ).toHaveValue("");

        expect(
            screen.getByLabelText(
                /låntagarens namn/i
            )
        ).toBeEnabled();

        expect(
            screen.getByLabelText(
                /spara som alias/i
            )
        ).toBeInTheDocument();
    });

    test("shows backend field errors at corresponding controls", async () => {
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

        mockInitialLoad();

        api.post.mockRejectedValueOnce(
            validationError
        );

        renderLoanForm();

        await screen.findByLabelText(
            /låntagarens namn/i
        );

        fillContactFields();
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

    test("shows unknown QR state without retry button", async () => {
        const notFoundError = {
            apiCode:
                "EQUIPMENT_NOT_FOUND",
            displayMessage:
                "Utrustningen kunde inte hittas.",
        };

        mockInitialLoad({
            equipmentError:
            notFoundError,
        });

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

    test("allows retry after temporary equipment fetch error", async () => {
        const user =
            userEvent.setup();

        let equipmentAttempts = 0;

        api.get.mockImplementation(
            (url) => {
                if (
                    url ===
                    "/admin/borrower-aliases"
                ) {
                    return Promise.resolve({
                        data: [],
                    });
                }

                if (
                    url.startsWith(
                        "/loan/"
                    )
                ) {
                    equipmentAttempts += 1;

                    return equipmentAttempts === 1
                        ? Promise.reject({
                            apiCode:
                                "NETWORK_ERROR",
                            displayMessage:
                                "Kunde inte ansluta till servern.",
                        })
                        : Promise.resolve({
                            data:
                            availableEquipment,
                        });
                }

                return Promise.reject(
                    new Error(
                        `Unexpected GET ${url}`
                    )
                );
            }
        );

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
            equipmentAttempts
        ).toBe(2);
    });

    test.each([
        {
            title:
                "already loaned",
            equipment: {
                ...availableEquipment,
                available: false,
            },
            heading:
                /redan utlånad/i,
            button:
                /redan utlånad/i,
        },
        {
            title:
                "inactive",
            equipment: {
                ...availableEquipment,
                active: false,
            },
            heading:
                /inaktiverad/i,
            button:
                /inaktiverad/i,
        },
    ])(
        "disables form when equipment is $title",
        async ({
                   equipment,
                   heading,
                   button,
               }) => {
            mockInitialLoad({
                equipment,
            });

            renderLoanForm();

            expect(
                await screen.findByRole(
                    "heading",
                    {
                        name:
                        heading,
                    }
                )
            ).toBeInTheDocument();

            expect(
                screen.getByLabelText(
                    /välj alias/i
                )
            ).toBeDisabled();

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
                        button,
                    }
                )
            ).toBeDisabled();

            expect(
                api.post
            ).not.toHaveBeenCalled();
        }
    );

    test("updates form when equipment becomes loaned during submission", async () => {
        mockInitialLoad();

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

        fillContactFields();
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
            hasErrorCode
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                apiCode:
                    "EQUIPMENT_ALREADY_LOANED",
            }),
            "EQUIPMENT_ALREADY_LOANED"
        );
    });

    test("shows normalized timeout error and restores form", async () => {
        const timeoutError = {
            apiCode:
                "REQUEST_TIMEOUT",
            displayMessage:
                "Anropet tog för lång tid. Försök igen.",
        };

        mockInitialLoad();

        api.post.mockRejectedValueOnce(
            timeoutError
        );

        renderLoanForm();

        await screen.findByLabelText(
            /låntagarens namn/i
        );

        fillContactFields();
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
        let resolveRequest;

        mockInitialLoad();

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

        fillContactFields();

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
                    registeredLoan(null),
            });
        });

        expect(
            await screen.findByText(
                /lånet registrerades/i
            )
        ).toBeInTheDocument();
    });

    test("aborts equipment and alias-list requests when page unmounts", () => {
        api.get.mockReturnValue(
            new Promise(() => {})
        );

        const view =
            renderLoanForm();

        const requestSignals =
            api.get.mock.calls.map(
                ([
                     ,
                     configuration,
                 ]) =>
                    configuration.signal
            );

        expect(
            requestSignals
        ).toHaveLength(2);

        requestSignals.forEach(
            (signal) => {
                expect(
                    signal.aborted
                ).toBe(false);
            }
        );

        view.unmount();

        requestSignals.forEach(
            (signal) => {
                expect(
                    signal.aborted
                ).toBe(true);
            }
        );
    });
});