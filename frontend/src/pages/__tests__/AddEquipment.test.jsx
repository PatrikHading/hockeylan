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
import AddEquipment from "../AddEquipment";

vi.mock("../../api/api", () => ({
    default: {
        post: vi.fn(),
    },
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

function fillRequiredSerialNumber() {
    fireEvent.change(
        screen.getByLabelText(
            /serienummer/i
        ),
        {
            target: {
                value: "HELMET-001",
            },
        }
    );
}

describe("AddEquipment", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test(
        "renders all equipment fields with expected defaults",
        () => {
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
            ).toBeInTheDocument();

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
        }
    );

    test(
        "submits every equipment field and navigates to admin page",
        async () => {
            api.post.mockResolvedValueOnce({
                data: {
                    id: 1,
                },
            });

            renderAddEquipment();

            fireEvent.change(
                screen.getByLabelText(
                    /typ av utrustning/i
                ),
                {
                    target: {
                        value: "HELMET",
                    },
                }
            );

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
                        value: " Bauer ",
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
                    /^skick/i
                ),
                {
                    target: {
                        value: "GOOD",
                    },
                }
            );

            fireEvent.change(
                screen.getByLabelText(
                    /ålderskategori/i
                ),
                {
                    target: {
                        value: "JUNIOR",
                    },
                }
            );

            fireEvent.change(
                screen.getByLabelText(
                    /förvaringsplats/i
                ),
                {
                    target: {
                        value: " Hylla A2 ",
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

            fireEvent.click(
                screen.getByRole(
                    "button",
                    {
                        name:
                            /spara utrustning/i,
                    }
                )
            );

            await waitFor(() => {
                expect(api.post)
                    .toHaveBeenCalledWith(
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
        }
    );

    test(
        "converts blank optional fields to null",
        async () => {
            api.post.mockResolvedValueOnce({
                data: {
                    id: 1,
                },
            });

            renderAddEquipment();

            fillRequiredSerialNumber();

            fireEvent.click(
                screen.getByRole(
                    "button",
                    {
                        name:
                            /spara utrustning/i,
                    }
                )
            );

            await waitFor(() => {
                expect(api.post)
                    .toHaveBeenCalledWith(
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
        }
    );

    test(
        "does not call api when serial number is blank",
        () => {
            renderAddEquipment();

            const serialNumberInput =
                screen.getByLabelText(
                    /serienummer/i
                );

            fireEvent.change(
                serialNumberInput,
                {
                    target: {
                        value: "   ",
                    },
                }
            );

            const form =
                screen.getByRole(
                    "button",
                    {
                        name:
                            /spara utrustning/i,
                    }
                ).closest("form");

            fireEvent.submit(form);

            expect(
                screen.getByText(
                    /serienummer måste fyllas i/i
                )
            ).toBeInTheDocument();

            expect(api.post)
                .not.toHaveBeenCalled();
        }
    );

    test(
        "shows backend error when creation fails",
        async () => {
            api.post.mockRejectedValueOnce({
                response: {
                    data: {
                        message:
                            "Resource already exists.",
                    },
                },
            });

            renderAddEquipment();

            fillRequiredSerialNumber();

            fireEvent.click(
                screen.getByRole(
                    "button",
                    {
                        name:
                            /spara utrustning/i,
                    }
                )
            );

            expect(
                await screen.findByText(
                    "Resource already exists."
                )
            ).toBeInTheDocument();

            expect(
                screen.getByRole(
                    "heading",
                    {
                        name:
                            /kunde inte spara/i,
                    }
                )
            ).toBeInTheDocument();
        }
    );
});