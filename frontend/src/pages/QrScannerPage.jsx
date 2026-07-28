import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router";

export default function QrScannerPage() {

    const navigate = useNavigate();

    const scannerRef = useRef(null);

    const [error, setError] = useState("");
    const [scanning, setScanning] = useState(true);

    useEffect(() => {

        if (scannerRef.current) {
            return;
        }

        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            {
                fps: 10,
                qrbox: {
                    width: 250,
                    height: 250
                },
                rememberLastUsedCamera: true,
            },
            false
        );

        scanner.render(
            handleScanSuccess,
            handleScanError
        );

        scannerRef.current = scanner;

        return () => {
            scanner.clear().catch(console.error);
        };

    }, []);

    function handleScanSuccess(decodedText) {

        try {

            setScanning(false);

            const url = new URL(decodedText);

            const pathParts = url.pathname.split("/");

            const serialNumber = pathParts[pathParts.length - 1];

            scannerRef.current?.clear();

            navigate(`/loan/${serialNumber}`);

        } catch (err) {

            console.error(err);

            setError("QR-koden är inte giltig.");
        }
    }

    function handleScanError(errorMessage) {
        console.debug(errorMessage);
    }

    return (
        <div className="mobile-page bg-slate-950 px-4 py-6">

            <div className="mx-auto max-w-xl">

                <div className="mobile-card overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">

                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-center">

                        <h1 className="mb-2 text-3xl font-bold text-white">
                            Skanna QR-kod
                        </h1>

                        <p className="text-blue-100">
                            Rikta kameran mot utrustningens QR-kod
                        </p>

                    </div>

                    <div className="p-5 sm:p-6">

                        {error && (
                            <div className="mb-6 rounded-2xl border border-red-800 bg-red-950 p-4">
                                <p className="text-red-300">
                                    {error}
                                </p>
                            </div>
                        )}

                        <div className="overflow-hidden rounded-3xl border border-slate-700">

                            <div
                                id="qr-reader"
                                className="bg-black"
                            />

                        </div>

                        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">

                            <p className="text-center text-sm text-slate-300">
                                {scanning
                                    ? "Kameran söker efter QR-kod..."
                                    : "QR-kod hittad"}
                            </p>

                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}