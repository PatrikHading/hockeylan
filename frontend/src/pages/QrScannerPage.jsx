import {
    useEffect,
    useRef,
    useState,
} from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router";
import Alert from "../components/ui/Alert";
import {
    extractLoanSerialNumber,
} from "../utils/qrCode";

export default function QrScannerPage() {
    const navigate = useNavigate();

    const scannerRef = useRef(null);
    const scanHandledRef = useRef(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    const [scannerStatus, setScannerStatus] =
        useState("scanning");

    useEffect(() => {
        let mounted = true;

        async function clearScanner() {
            const scanner =
                scannerRef.current;

            if (!scanner) {
                return;
            }

            scannerRef.current = null;

            try {
                await scanner.clear();
            } catch {
                /*
                 * Skannerns DOM kan redan vara
                 * borttagen vid avmontering.
                 */
            }
        }

        async function handleScanSuccess(
            decodedText
        ) {
            if (scanHandledRef.current) {
                return;
            }

            try {
                const serialNumber =
                    extractLoanSerialNumber(
                        decodedText
                    );

                scanHandledRef.current = true;

                if (mounted) {
                    setErrorMessage("");
                    setScannerStatus(
                        "opening"
                    );
                }

                await clearScanner();

                if (mounted) {
                    navigate(
                        `/loan/${encodeURIComponent(
                            serialNumber
                        )}`
                    );
                }
            } catch (error) {
                if (mounted) {
                    setErrorMessage(
                        error instanceof Error
                            ? error.message
                            : "QR-koden är inte giltig."
                    );

                    setScannerStatus(
                        "scanning"
                    );
                }
            }
        }

        function handleScanError() {
            /*
             * html5-qrcode anropar denna
             * funktion kontinuerligt när en
             * bildruta inte innehåller en
             * läsbar QR-kod. Det är normalt
             * och ska inte visas som ett fel.
             */
        }

        try {
            const scanner =
                new Html5QrcodeScanner(
                    "qr-reader",
                    {
                        fps: 10,
                        qrbox: {
                            width: 250,
                            height: 250,
                        },
                        rememberLastUsedCamera:
                            true,
                    },
                    false
                );

            scannerRef.current = scanner;

            scanner.render(
                handleScanSuccess,
                handleScanError
            );
        } catch {
            setScannerStatus(
                "unavailable"
            );

            setErrorMessage(
                "Kameran kunde inte startas. Kontrollera webbläsarens kamerabehörighet och försök igen."
            );
        }

        return () => {
            mounted = false;
            scanHandledRef.current = true;
            void clearScanner();
        };
    }, [navigate]);

    return (
        <main
            className="mobile-page bg-slate-950 px-4 py-6"
            aria-labelledby="qr-scanner-heading"
        >
            <div className="mx-auto max-w-xl">
                <section className="mobile-card overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
                    <header className="bg-gradient-to-r from-blue-700 to-cyan-700 p-6 text-center">
                        <h1
                            id="qr-scanner-heading"
                            className="mb-2 text-3xl font-bold text-white"
                        >
                            Skanna QR-kod
                        </h1>

                        <p
                            id="qr-scanner-instructions"
                            className="text-blue-50"
                        >
                            Rikta kameran mot
                            QR-koden på
                            utrustningen.
                        </p>
                    </header>

                    <div className="p-5 sm:p-6">
                        {errorMessage && (
                            <div className="mb-6">
                                <Alert
                                    title="QR-koden kunde inte läsas"
                                    variant="danger"
                                >
                                    {errorMessage}

                                    {scannerStatus ===
                                        "scanning" && (
                                            <>
                                                {" "}
                                                Rikta kameran
                                                mot en giltig
                                                Hockeylån-kod
                                                för att
                                                försöka igen.
                                            </>
                                        )}
                                </Alert>
                            </div>
                        )}

                        <div className="overflow-hidden rounded-3xl border border-slate-700">
                            <div
                                id="qr-reader"
                                className="min-h-64 bg-black"
                                aria-describedby="qr-scanner-instructions"
                            />
                        </div>

                        <div
                            className="mt-6 rounded-2xl border border-slate-700 bg-slate-950 p-4"
                            role="status"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            <p className="text-center text-sm text-slate-200">
                                {getScannerStatusText(
                                    scannerStatus
                                )}
                            </p>
                        </div>

                        <p className="mt-4 text-center text-xs leading-relaxed text-slate-400">
                            Kamerabilden behandlas
                            lokalt i webbläsaren och
                            sparas inte.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}

function getScannerStatusText(
    scannerStatus
) {
    if (
        scannerStatus === "unavailable"
    ) {
        return "Kameran är inte tillgänglig.";
    }

    if (scannerStatus === "opening") {
        return "QR-kod hittad. Öppnar låneformuläret...";
    }

    return "Kameran söker efter en QR-kod...";
}