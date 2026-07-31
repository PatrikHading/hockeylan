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
    afterEach,
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
import QrCodeView from "../QrCodeView";

vi.mock("../../api/api", () => ({
    default: {
        get: vi.fn(),
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

const qrData = {
    id: 7,
    type: "HELMET",
    serialNumber: "HELMET-007",
    size: "M",
    brand: "Bauer",
    model: "Re-Akt 150",
    condition: "GOOD",
    ageCategory: "JUNIOR",
    description: "Svart hjälm",
    available: true,
    active: true,
    loanUrl:
        "http://localhost:5173/loan/HELMET-007",
    qrCodeBase64:
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB",
};

function renderQrCodeView() {
    return render(
        <MemoryRouter
            initialEntries={[
                "/admin/qr/7",
            ]}
        >
            <Routes>
                <Route
                    path="/admin/qr/:id"
                    element={
                        <QrCodeView />
                    }
                />

                <Route
                    path="/admin"
                    element={
                        <p>
                            Adminvyn
                        </p>
                    }
                />
            </Routes>
        </MemoryRouter>
    );
}

function mockClipboard(
    writeText = vi
        .fn()
        .mockResolvedValue()
) {
    Object.defineProperty(
        navigator,
        "clipboard",
        {
            configurable: true,
            value: {
                writeText,
            },
        }
    );

    return writeText;
}

describe("QrCodeView", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockClipboard();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("renders accessible loading state and fetches QR data", async () => {
        api.get.mockResolvedValueOnce({
            data: qrData,
        });

        renderQrCodeView();

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
            /hämtar qr-kod/i
        );

        expect(
            await screen.findByRole(
                "heading",
                {
                    name: "QR-kod",
                }
            )
        ).toBeInTheDocument();

        expect(
            api.get
        ).toHaveBeenCalledWith(
            "/admin/equipment/7/qr",
            {
                signal:
                    expect.any(
                        AbortSignal
                    ),
            }
        );
    });

    test("renders equipment details and accessible loan link", async () => {
        api.get.mockResolvedValueOnce({
            data: qrData,
        });

        renderQrCodeView();

        expect(
            await screen.findByRole(
                "img",
                {
                    name:
                        /qr-kod för helmet-007/i,
                }
            )
        ).toHaveAttribute(
            "src",
            expect.stringContaining(
                qrData.qrCodeBase64
            )
        );

        expect(
            screen.getByText(
                "Hjälm"
            )
        ).toBeInTheDocument();

        expect(
            screen.getByText(
                "HELMET-007"
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
                "Svart hjälm"
            )
        ).toBeInTheDocument();

        expect(
            screen.getByRole(
                "link",
                {
                    name:
                    qrData.loanUrl,
                }
            )
        ).toHaveAttribute(
            "href",
            qrData.loanUrl
        );

        expect(
            screen.getByRole(
                "status"
            )
        ).toHaveTextContent(
            /denna utrustning kan lånas/i
        );
    });

    test.each([
        [
            {
                available: false,
                active: true,
            },
            "Utlånad",
            /redan utlånad/i,
        ],
        [
            {
                available: true,
                active: false,
            },
            "Inaktiverad",
            /inte längre tillgänglig/i,
        ],
    ])(
        "renders equipment status %s",
        async (
            statusProperties,
            statusTitle,
            description
        ) => {
            api.get.mockResolvedValueOnce({
                data: {
                    ...qrData,
                    ...statusProperties,
                },
            });

            renderQrCodeView();

            const status =
                await screen.findByRole(
                    "status"
                );

            expect(
                status
            ).toHaveTextContent(
                statusTitle
            );

            expect(
                status
            ).toHaveTextContent(
                description
            );
        }
    );

    test("shows not-found state without retry button", async () => {
        const notFoundError = {
            apiCode:
                "EQUIPMENT_NOT_FOUND",
            displayMessage:
                "Utrustningen kunde inte hittas.",
        };

        api.get.mockRejectedValueOnce(
            notFoundError
        );

        renderQrCodeView();

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

    test("shows network error and retries request", async () => {
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
                data: qrData,
            });

        renderQrCodeView();

        expect(
            await screen.findByRole(
                "alert",
                {
                    name:
                        /qr-koden kunde inte hämtas/i,
                }
            )
        ).toHaveTextContent(
            /kunde inte ansluta till servern/i
        );

        expect(
            getErrorMessage
        ).toHaveBeenCalledWith(
            networkError,
            "Kunde inte hämta QR-koden. Försök igen."
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
            await screen.findByRole(
                "img",
                {
                    name:
                        /qr-kod för helmet-007/i,
                }
            )
        ).toBeInTheDocument();

        expect(
            api.get
        ).toHaveBeenCalledTimes(2);
    });

    test("copies loan URL and shows success feedback", async () => {
        const user =
            userEvent.setup();

        const writeText =
            mockClipboard();

        api.get.mockResolvedValueOnce({
            data: qrData,
        });

        renderQrCodeView();

        await screen.findByRole(
            "img",
            {
                name:
                    /qr-kod för helmet-007/i,
            }
        );

        await user.click(
            screen.getByRole(
                "button",
                {
                    name:
                        /kopiera länk/i,
                }
            )
        );

        expect(
            writeText
        ).toHaveBeenCalledWith(
            qrData.loanUrl
        );

        expect(
            await screen.findByRole(
                "status",
                {
                    name: /klart/i,
                }
            )
        ).toHaveTextContent(
            /länken har kopierats/i
        );
    });

    test("shows accessible error when clipboard fails", async () => {
        const user =
            userEvent.setup();

        mockClipboard(
            vi
                .fn()
                .mockRejectedValue(
                    new Error(
                        "Clipboard denied"
                    )
                )
        );

        api.get.mockResolvedValueOnce({
            data: qrData,
        });

        renderQrCodeView();

        await screen.findByRole(
            "img",
            {
                name:
                    /qr-kod för helmet-007/i,
            }
        );

        await user.click(
            screen.getByRole(
                "button",
                {
                    name:
                        /kopiera länk/i,
                }
            )
        );

        expect(
            await screen.findByRole(
                "alert",
                {
                    name:
                        /åtgärden misslyckades/i,
                }
            )
        ).toHaveTextContent(
            /markera och kopiera adressen manuellt/i
        );

        expect(
            screen.getByRole(
                "button",
                {
                    name:
                        /kopiera länk/i,
                }
            )
        ).toBeEnabled();
    });

    test("starts direct QR download with expected filename", async () => {
        const user =
            userEvent.setup();

        let downloadedHref = "";
        let downloadedFilename = "";

        vi.spyOn(
            HTMLAnchorElement.prototype,
            "click"
        ).mockImplementation(
            function click() {
                downloadedHref =
                    this.href;

                downloadedFilename =
                    this.download;
            }
        );

        api.get.mockResolvedValueOnce({
            data: qrData,
        });

        renderQrCodeView();

        await screen.findByRole(
            "img",
            {
                name:
                    /qr-kod för helmet-007/i,
            }
        );

        await user.click(
            screen.getByRole(
                "button",
                {
                    name:
                        /ladda ner qr$/i,
                }
            )
        );

        expect(
            downloadedHref
        ).toContain(
            qrData.qrCodeBase64
        );

        expect(
            downloadedFilename
        ).toBe(
            "HELMET-007-qr.png"
        );

        expect(
            await screen.findByText(
                /nedladdningen av qr-koden har startat/i
            )
        ).toBeInTheDocument();
    });

    test("generates QR label and prevents duplicate generation", async () => {
        let createdImage;
        let downloadedFilename = "";

        class MockImage {
            constructor() {
                createdImage = this;
            }

            set src(value) {
                this.source = value;
            }

            get src() {
                return this.source;
            }
        }

        vi.stubGlobal(
            "Image",
            MockImage
        );

        const context = {
            fillStyle: "",
            font: "",
            textAlign: "",
            fillRect: vi.fn(),
            fillText: vi.fn(),
            drawImage: vi.fn(),
        };

        vi.spyOn(
            HTMLCanvasElement.prototype,
            "getContext"
        ).mockReturnValue(
            context
        );

        vi.spyOn(
            HTMLCanvasElement.prototype,
            "toDataURL"
        ).mockReturnValue(
            "data:image/png;base64,label"
        );

        vi.spyOn(
            HTMLAnchorElement.prototype,
            "click"
        ).mockImplementation(
            function click() {
                downloadedFilename =
                    this.download;
            }
        );

        api.get.mockResolvedValueOnce({
            data: qrData,
        });

        renderQrCodeView();

        await screen.findByRole(
            "img",
            {
                name:
                    /qr-kod för helmet-007/i,
            }
        );

        const labelButton =
            screen.getByRole(
                "button",
                {
                    name:
                        /ladda ner etikett/i,
                }
            );

        fireEvent.click(
            labelButton
        );

        fireEvent.click(
            labelButton
        );

        expect(
            screen.getByRole(
                "button",
                {
                    name:
                        /skapar etikett/i,
                }
            )
        ).toBeDisabled();

        expect(
            createdImage
        ).toBeDefined();

        await act(async () => {
            createdImage.onload();
        });

        expect(
            context.drawImage
        ).toHaveBeenCalledTimes(1);

        expect(
            context.fillText
        ).toHaveBeenCalledWith(
            "HockeyLån",
            450,
            90
        );

        expect(
            downloadedFilename
        ).toBe(
            "HELMET-007-qr-etikett.png"
        );

        expect(
            await screen.findByText(
                /nedladdningen av qr-etiketten har startat/i
            )
        ).toBeInTheDocument();

        vi.unstubAllGlobals();
    });

    test("shows label error when canvas context is unavailable", async () => {
        const user =
            userEvent.setup();

        vi.spyOn(
            HTMLCanvasElement.prototype,
            "getContext"
        ).mockReturnValue(null);

        api.get.mockResolvedValueOnce({
            data: qrData,
        });

        renderQrCodeView();

        await screen.findByRole(
            "img",
            {
                name:
                    /qr-kod för helmet-007/i,
            }
        );

        await user.click(
            screen.getByRole(
                "button",
                {
                    name:
                        /ladda ner etikett/i,
                }
            )
        );

        expect(
            await screen.findByRole(
                "alert",
                {
                    name:
                        /åtgärden misslyckades/i,
                }
            )
        ).toHaveTextContent(
            /qr-etiketten kunde inte skapas/i
        );

        expect(
            screen.getByRole(
                "button",
                {
                    name:
                        /ladda ner etikett/i,
                }
            )
        ).toBeEnabled();
    });

    test("opens browser print dialog", async () => {
        const user =
            userEvent.setup();

        const print =
            vi.spyOn(
                window,
                "print"
            ).mockImplementation(
                () => {}
            );

        api.get.mockResolvedValueOnce({
            data: qrData,
        });

        renderQrCodeView();

        await screen.findByRole(
            "img",
            {
                name:
                    /qr-kod för helmet-007/i,
            }
        );

        await user.click(
            screen.getByRole(
                "button",
                {
                    name:
                        /skriv ut/i,
                }
            )
        );

        expect(
            print
        ).toHaveBeenCalledTimes(1);
    });

    test("aborts QR request when page unmounts", () => {
        api.get.mockReturnValue(
            new Promise(() => {})
        );

        const view =
            renderQrCodeView();

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

    test("delegates authentication-required error to global session handling", async () => {
        const authenticationError = {
            apiCode:
                "AUTHENTICATION_REQUIRED",
            displayMessage:
                "Du behöver logga in som administratör.",
        };

        api.get.mockRejectedValueOnce(
            authenticationError
        );

        renderQrCodeView();

        await waitFor(() => {
            expect(
                hasErrorCode
            ).toHaveBeenCalledWith(
                authenticationError,
                "AUTHENTICATION_REQUIRED"
            );
        });

        expect(
            getErrorMessage
        ).not.toHaveBeenCalledWith(
            authenticationError,
            "Kunde inte hämta QR-koden. Försök igen."
        );
    });
});