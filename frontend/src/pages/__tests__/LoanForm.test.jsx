import {
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
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
import api from "../../api/api";
import LoanForm from "../LoanForm";

vi.mock("../../api/api", () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
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

function renderLoanForm() {
    return render(
        <MemoryRouter
            initialEntries={[
                "/loan/HELMET-001",
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
            </Routes>
        </MemoryRouter>
    );
}

function fillForm(
    expectedReturnDate
) {
    fireEvent.change(
        screen.getByLabelText(
            /låntagarens namn/i
        ),
        {
            target: {
                value:
                    "Patrik Hading",
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
                    "patrik@example.com",
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
                    "+46701234567",
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

describe("LoanForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test(
        "renders loading state and fetches equipment",
        async () => {
            api.get.mockResolvedValueOnce({
                data: availableEquipment,
            });

            renderLoanForm();

            expect(
                screen.getByLabelText(
                    /hämtar utrustning/i
                )
            ).toBeInTheDocument();

            expect(
                await screen.findByRole(
                    "heading",
                    {
                        name:
                            /registrera lån/i,
                    }
                )
            ).toBeInTheDocument();

            expect(api.get)
                .toHaveBeenCalledWith(
                    "/loan/HELMET-001"
                );
        }
    );

    test(
        "renders equipment and administrator fields",
        async () => {
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
                screen.getByText("Hjälm")
            ).toBeInTheDocument();

            expect(
                screen.getByText("M")
            ).toBeInTheDocument();

            expect(
                screen.getByText("Bauer")
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    "Re-Akt 150"
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText("Bra")
            ).toBeInTheDocument();

            expect(
                screen.getByText("Junior")
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
            ).toBeEnabled();

            const dateInput =
                screen.getByLabelText(
                    /förväntat återlämningsdatum/i
                );

            expect(dateInput)
                .toBeEnabled();

            expect(dateInput)
                .toBeRequired();

            expect(dateInput)
                .toHaveAttribute("min");

            expect(dateInput)
                .not.toHaveAttribute("max");
        }
    );

    test(
        "submits loan through protected admin endpoint",
        async () => {
            const expectedReturnDate =
                futureDate();

            api.get.mockResolvedValueOnce({
                data: availableEquipment,
            });

            api.post.mockResolvedValueOnce({
                data: registeredLoan(
                    expectedReturnDate
                ),
            });

            renderLoanForm();

            await screen.findByLabelText(
                /låntagarens namn/i
            );

            fillForm(
                expectedReturnDate
            );

            fireEvent.click(
                screen.getByRole(
                    "button",
                    {
                        name:
                            /^registrera lån$/i,
                    }
                )
            );

            await waitFor(() => {
                expect(api.post)
                    .toHaveBeenCalledWith(
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
        }
    );

    test(
        "does not submit without expected return date",
        async () => {
            api.get.mockResolvedValueOnce({
                data: availableEquipment,
            });

            renderLoanForm();

            await screen.findByLabelText(
                /låntagarens namn/i
            );

            fillForm("");

            fireEvent.submit(
                screen.getByRole(
                    "button",
                    {
                        name:
                            /^registrera lån$/i,
                    }
                ).closest("form")
            );

            expect(
                await screen.findByText(
                    /förväntat återlämningsdatum måste anges/i
                )
            ).toBeInTheDocument();

            expect(api.post)
                .not.toHaveBeenCalled();
        }
    );

    test(
        "disables form when equipment is already loaned",
        async () => {
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

            expect(api.post)
                .not.toHaveBeenCalled();
        }
    );

    test(
        "disables form when equipment is inactive",
        async () => {
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

            expect(api.post)
                .not.toHaveBeenCalled();
        }
    );

    test(
        "shows fetch error",
        async () => {
            api.get.mockRejectedValueOnce({
                response: {
                    data: {
                        message:
                            "Kunde inte hitta utrustningen.",
                    },
                },
            });

            renderLoanForm();

            expect(
                await screen.findByText(
                    /kunde inte hitta utrustningen/i
                )
            ).toBeInTheDocument();

            expect(api.post)
                .not.toHaveBeenCalled();
        }
    );

    test(
        "shows backend registration error",
        async () => {
            const expectedReturnDate =
                futureDate();

            api.get.mockResolvedValueOnce({
                data: availableEquipment,
            });

            api.post.mockRejectedValueOnce({
                response: {
                    data: {
                        message:
                            "Utrustningen är redan utlånad.",
                    },
                },
            });

            renderLoanForm();

            await screen.findByLabelText(
                /låntagarens namn/i
            );

            fillForm(
                expectedReturnDate
            );

            fireEvent.click(
                screen.getByRole(
                    "button",
                    {
                        name:
                            /^registrera lån$/i,
                    }
                )
            );

            expect(
                await screen.findByText(
                    /utrustningen är redan utlånad/i
                )
            ).toBeInTheDocument();
        }
    );
});