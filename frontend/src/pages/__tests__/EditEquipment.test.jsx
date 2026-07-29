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
import EditEquipment from "../EditEquipment";

vi.mock("../../api/api", () => ({
    default: {
        get: vi.fn(),
        put: vi.fn(),
    },
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

describe("EditEquipment", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test(
        "shows loading state while equipment is fetched",
        async () => {
            api.get.mockResolvedValueOnce({
                data: existingEquipment,
            });

            renderEditEquipment();

            expect(
                screen.getByLabelText(
                    /laddar utrustning/i
                )
            ).toBeInTheDocument();

            expect(
                await screen.findByRole(
                    "heading",
                    {
                        name:
                            /redigera utrustning/i,
                    }
                )
            ).toBeInTheDocument();
        }
    );

    test(
        "fetches equipment by id and fills every form field",
        async () => {
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

            expect(api.get)
                .toHaveBeenCalledWith(
                    "/admin/equipment/7"
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
        }
    );

    test(
        "shows warning that changed serial number requires a new qr label",
        async () => {
            api.get.mockResolvedValueOnce({
                data: existingEquipment,
            });

            renderEditEquipment();

            expect(
                await screen.findByText(
                    /om serienumret ändras behöver du skriva ut en ny qr-etikett/i
                )
            ).toBeInTheDocument();
        }
    );

    test(
        "submits updated equipment without active or available fields",
        async () => {
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

            fireEvent.click(
                screen.getByRole(
                    "button",
                    {
                        name:
                            /spara ändringar/i,
                    }
                )
            );

            await waitFor(() => {
                expect(api.put)
                    .toHaveBeenCalledWith(
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
                api.put.mock
                    .calls[0][1];

            expect(payload)
                .not.toHaveProperty(
                "active"
            );

            expect(payload)
                .not.toHaveProperty(
                "available"
            );

            expect(
                await screen.findByText(
                    "Adminsidan"
                )
            ).toBeInTheDocument();
        }
    );

    test(
        "shows error when equipment cannot be fetched",
        async () => {
            api.get.mockRejectedValueOnce({
                response: {
                    data: {
                        message:
                            "Requested resource was not found.",
                    },
                },
            });

            renderEditEquipment();

            expect(
                await screen.findByText(
                    "Requested resource was not found."
                )
            ).toBeInTheDocument();

            expect(api.put)
                .not.toHaveBeenCalled();
        }
    );

    test(
        "shows error when update fails",
        async () => {
            api.get.mockResolvedValueOnce({
                data: existingEquipment,
            });

            api.put.mockRejectedValueOnce({
                response: {
                    data: {
                        message:
                            "Resource already exists.",
                    },
                },
            });

            renderEditEquipment();

            await screen.findByLabelText(
                /serienummer/i
            );

            fireEvent.click(
                screen.getByRole(
                    "button",
                    {
                        name:
                            /spara ändringar/i,
                    }
                )
            );

            expect(
                await screen.findByText(
                    "Resource already exists."
                )
            ).toBeInTheDocument();
        }
    );

    test(
        "cancel navigates back to admin page",
        async () => {
            api.get.mockResolvedValueOnce({
                data: existingEquipment,
            });

            renderEditEquipment();

            await screen.findByLabelText(
                /serienummer/i
            );

            fireEvent.click(
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

            expect(api.put)
                .not.toHaveBeenCalled();
        }
    );
});