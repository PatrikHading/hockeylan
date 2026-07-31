import {
    act,
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
import {
    extractLoanSerialNumber,
} from "../../utils/qrCode";
import QrScannerPage from "../QrScannerPage";

const scannerState = vi.hoisted(() => ({
    instances: [],
    throwDuringConstruction: false,
}));

vi.mock("html5-qrcode", () => ({
    Html5QrcodeScanner:
        class Html5QrcodeScanner {
            constructor(
                elementId,
                configuration,
                verbose
            ) {
                if (
                    scannerState
                        .throwDuringConstruction
                ) {
                    throw new Error(
                        "Camera unavailable"
                    );
                }

                this.elementId = elementId;
                this.configuration =
                    configuration;
                this.verbose = verbose;

                this.clear = vi
                    .fn()
                    .mockResolvedValue();

                scannerState.instances.push(
                    this
                );
            }

            render(
                onSuccess,
                onError
            ) {
                this.onSuccess = onSuccess;
                this.onError = onError;
            }
        },
}));

function renderScanner() {
    return render(
        <MemoryRouter
            initialEntries={["/scan"]}
        >
            <Routes>
                <Route
                    path="/scan"
                    element={<QrScannerPage />}
                />

                <Route
                    path="/loan/:serialNumber"
                    element={
                        <p>
                            Låneformulär öppnat
                        </p>
                    }
                />
            </Routes>
        </MemoryRouter>
    );
}

function currentScanner() {
    return scannerState.instances[
    scannerState.instances.length - 1
        ];
}

describe(
    "extractLoanSerialNumber",
    () => {
        test("extracts and normalizes serial number from absolute loan URL", () => {
            expect(
                extractLoanSerialNumber(
                    "https://hockey.example/loan/helmet-001"
                )
            ).toBe("HELMET-001");
        });

        test("accepts a relative loan URL", () => {
            expect(
                extractLoanSerialNumber(
                    "/loan/skates_002"
                )
            ).toBe("SKATES_002");
        });

        test.each([
            "",
            "not-a-url",
            "javascript:alert(1)",
            "https://example.com/admin",
            "https://example.com/not-loan/HELMET-001",
            "https://example.com/loan/",
            "https://example.com/loan/A",
            "https://example.com/loan/INVALID%20SERIAL",
            "https://example.com/loan/HELMET-001/extra",
        ])(
            "rejects invalid QR content: %s",
            (decodedText) => {
                expect(() =>
                    extractLoanSerialNumber(
                        decodedText
                    )
                ).toThrow();
            }
        );
    }
);

describe("QrScannerPage", () => {
    beforeEach(() => {
        scannerState.instances.length = 0;

        scannerState.throwDuringConstruction =
            false;
    });

    test("starts scanner with expected configuration", () => {
        renderScanner();

        const scanner =
            currentScanner();

        expect(scanner).toBeDefined();

        expect(
            scanner.elementId
        ).toBe("qr-reader");

        expect(
            scanner.configuration
        ).toEqual({
            fps: 10,
            qrbox: {
                width: 250,
                height: 250,
            },
            rememberLastUsedCamera:
                true,
        });

        expect(
            scanner.verbose
        ).toBe(false);

        expect(
            screen.getByRole("status")
        ).toHaveTextContent(
            /kameran söker efter en qr-kod/i
        );
    });

    test("opens loan form after valid scan", async () => {
        renderScanner();

        const scanner =
            currentScanner();

        await act(async () => {
            await scanner.onSuccess(
                "https://hockey.example/loan/helmet-001"
            );
        });

        expect(
            await screen.findByText(
                "Låneformulär öppnat"
            )
        ).toBeInTheDocument();

        expect(
            scanner.clear
        ).toHaveBeenCalledTimes(1);
    });

    test("shows accessible error and continues scanning for invalid QR code", async () => {
        renderScanner();

        const scanner =
            currentScanner();

        await act(async () => {
            await scanner.onSuccess(
                "https://example.com/not-loan/HELMET-001"
            );
        });

        expect(
            await screen.findByRole(
                "alert",
                {
                    name:
                        /qr-koden kunde inte läsas/i,
                }
            )
        ).toHaveTextContent(
            /leder inte till ett låneformulär/i
        );

        expect(
            screen.getByRole("status")
        ).toHaveTextContent(
            /kameran söker efter en qr-kod/i
        );

        expect(
            scanner.clear
        ).not.toHaveBeenCalled();

        expect(
            screen.queryByText(
                "Låneformulär öppnat"
            )
        ).not.toBeInTheDocument();
    });

    test("ignores ordinary frame decoding errors", () => {
        renderScanner();

        act(() => {
            currentScanner().onError(
                "No QR code found in this frame"
            );
        });

        expect(
            screen.queryByRole("alert")
        ).not.toBeInTheDocument();

        expect(
            screen.getByRole("status")
        ).toHaveTextContent(
            /kameran söker efter en qr-kod/i
        );
    });

    test("prevents duplicate navigation after successful scan", async () => {
        renderScanner();

        const scanner =
            currentScanner();

        await act(async () => {
            await Promise.all([
                scanner.onSuccess(
                    "/loan/HELMET-001"
                ),
                scanner.onSuccess(
                    "/loan/SKATES-002"
                ),
            ]);
        });

        expect(
            await screen.findByText(
                "Låneformulär öppnat"
            )
        ).toBeInTheDocument();

        expect(
            scanner.clear
        ).toHaveBeenCalledTimes(1);
    });

    test("shows camera initialization error", async () => {
        scannerState.throwDuringConstruction =
            true;

        renderScanner();

        expect(
            await screen.findByRole(
                "alert",
                {
                    name:
                        /qr-koden kunde inte läsas/i,
                }
            )
        ).toHaveTextContent(
            /kameran kunde inte startas/i
        );

        expect(
            screen.getByRole("status")
        ).toHaveTextContent(
            /kameran är inte tillgänglig/i
        );
    });

    test("clears scanner when page unmounts", async () => {
        const view = renderScanner();
        const scanner =
            currentScanner();

        view.unmount();

        await waitFor(() => {
            expect(
                scanner.clear
            ).toHaveBeenCalledTimes(1);
        });
    });
});