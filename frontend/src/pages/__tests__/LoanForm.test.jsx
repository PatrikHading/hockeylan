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
    description: "Svart hjälm",
    available: true,
    active: true,
};

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

describe("LoanForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test(
        "renders loading state first",
        async () => {
            api.get.mockResolvedValueOnce({
                data: availableEquipment,
            });

            renderLoanForm();

            expect(
                screen.getByText(
                    /hämtar utrustning/i
                )
            ).toBeInTheDocument();

            expect(
                await screen.findByRole(
                    "heading",
                    {
                        name:
                            /låna utrustning/i,
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
        "renders extended details for available equipment",
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
                            /låna utrustning/i,
                    }
                )
            ).toBeInTheDocument();

            expect(
                screen.getAllByText(
                    /tillgänglig/i
                ).length
            ).toBeGreaterThan(0);

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
                    "Svart hjälm"
                )
            ).toBeInTheDocument();

            expect(
                screen.getByLabelText(
                    /namn/i
                )
            ).toBeEnabled();

            expect(
                screen.getByLabelText(
                    /e-post/i
                )
            ).toBeEnabled();

            expect(
                screen.getByLabelText(
                    /telefonnummer/i
                )
            ).toBeEnabled();

            expect(
                screen.getByRole(
                    "button",
                    {
                        name:
                            /låna utrustning/i,
                    }
                )
            ).toBeEnabled();
        }
    );

    test(
        "submits loan for active and available equipment",
        async () => {
            api.get.mockResolvedValueOnce({
                data: availableEquipment,
            });

            api.post.mockResolvedValueOnce({
                data: {
                    id: 10,
                },
            });

            renderLoanForm();

            await screen.findByLabelText(
                /namn/i
            );

            fireEvent.change(
                screen.getByLabelText(
                    /namn/i
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
                    /e-post/i
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
                    /telefonnummer/i
                ),
                {
                    target: {
                        value:
                            "+46701234567",
                    },
                }
            );

            fireEvent.click(
                screen.getByRole(
                    "button",
                    {
                        name:
                            /låna utrustning/i,
                    }
                )
            );

            await waitFor(() => {
                expect(api.post)
                    .toHaveBeenCalledWith(
                        "/loan/HELMET-001",
                        {
                            borrowerName:
                                "Patrik Hading",
                            email:
                                "patrik@example.com",
                            phoneNumber:
                                "+46701234567",
                        }
                    );
            });

            expect(
                await screen.findByText(
                    /utrustningen är nu utlånad/i
                )
            ).toBeInTheDocument();
        }
    );

    test(
        "disables loan form when equipment is loaned",
        async () => {
            api.get.mockResolvedValueOnce({
                data: {
                    ...availableEquipment,
                    available: false,
                },
            });

            renderLoanForm();

            const loanedStatusElements =
                await screen.findAllByText(
                    /^redan utlånad$/i
                );

            expect(
                loanedStatusElements
            ).toHaveLength(2);

            expect(
                screen.getByText(
                    /utrustningen kan inte lånas igen förrän den är återlämnad/i
                )
            ).toBeInTheDocument();

            expect(
                screen.getByLabelText(
                    /namn/i
                )
            ).toBeDisabled();

            expect(
                screen.getByLabelText(
                    /e-post/i
                )
            ).toBeDisabled();

            expect(
                screen.getByLabelText(
                    /telefonnummer/i
                )
            ).toBeDisabled();

            expect(
                screen.getByRole(
                    "button",
                    {
                        name:
                            /^redan utlånad$/i,
                    }
                )
            ).toBeDisabled();

            expect(api.post)
                .not.toHaveBeenCalled();
        }
    );

    test(
        "disables loan form when equipment is inactive even if available",
        async () => {
            api.get.mockResolvedValueOnce({
                data: {
                    ...availableEquipment,
                    active: false,
                    available: true,
                },
            });

            renderLoanForm();

            expect(
                await screen.findByText(
                    /^inaktiverad$/i
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    /inte längre tillgänglig för utlåning/i
                )
            ).toBeInTheDocument();

            expect(
                screen.getByLabelText(
                    /namn/i
                )
            ).toBeDisabled();

            expect(
                screen.getByLabelText(
                    /e-post/i
                )
            ).toBeDisabled();

            expect(
                screen.getByLabelText(
                    /telefonnummer/i
                )
            ).toBeDisabled();

            expect(
                screen.getByRole(
                    "button",
                    {
                        name:
                            /utrustningen är inaktiverad/i,
                    }
                )
            ).toBeDisabled();

            expect(api.post)
                .not.toHaveBeenCalled();
        }
    );

    test(
        "shows error when equipment cannot be fetched",
        async () => {
            api.get.mockRejectedValueOnce({
                response: {
                    data: {
                        message:
                            "Kunde inte hitta utrustning.",
                    },
                },
            });

            renderLoanForm();

            expect(
                await screen.findByText(
                    /kunde inte hitta utrustning/i
                )
            ).toBeInTheDocument();

            expect(api.post)
                .not.toHaveBeenCalled();
        }
    );

    test(
        "shows backend error when loan registration fails",
        async () => {
            api.get.mockResolvedValueOnce({
                data: availableEquipment,
            });

            api.post.mockRejectedValueOnce({
                response: {
                    data: {
                        message:
                            "Utrustningen är inaktiverad och kan inte lånas.",
                    },
                },
            });

            renderLoanForm();

            await screen.findByLabelText(
                /namn/i
            );

            fireEvent.change(
                screen.getByLabelText(
                    /namn/i
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
                    /e-post/i
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
                    /telefonnummer/i
                ),
                {
                    target: {
                        value:
                            "+46701234567",
                    },
                }
            );

            fireEvent.click(
                screen.getByRole(
                    "button",
                    {
                        name:
                            /låna utrustning/i,
                    }
                )
            );

            expect(
                await screen.findByText(
                    /utrustningen är inaktiverad och kan inte lånas/i
                )
            ).toBeInTheDocument();
        }
    );
});