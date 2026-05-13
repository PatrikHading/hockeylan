import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function QrCodeView() {
    const { id } = useParams();
    const labelRef = useRef(null);

    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copyMessage, setCopyMessage] = useState("");

    useEffect(() => {
        fetchQrCode();
    }, []);

    async function fetchQrCode() {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `http://localhost:8080/api/admin/equipment/${id}/qr`
            );

            setQrData(response.data);
        } catch (err) {
            console.error(err);
            setError("Kunde inte hämta QR-kod.");
        } finally {
            setLoading(false);
        }
    }

    async function copyUrl() {
        try {
            await navigator.clipboard.writeText(qrData.loanUrl);
            setCopyMessage("Länk kopierad!");

            setTimeout(() => {
                setCopyMessage("");
            }, 2500);
        } catch (err) {
            console.error(err);
            setCopyMessage("Kunde inte kopiera länken.");
        }
    }

    function downloadQrCode() {
        const link = document.createElement("a");

        link.href = `data:image/png;base64,${qrData.qrCodeBase64}`;
        link.download = `${qrData.serialNumber}-qr.png`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function downloadQrLabel() {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = 900;
        canvas.height = 1200;

        const qrImage = new Image();

        qrImage.onload = () => {
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);

            context.fillStyle = "#0f172a";
            context.font = "bold 54px Arial";
            context.textAlign = "center";
            context.fillText("Hockeylan", canvas.width / 2, 90);

            context.fillStyle = "#334155";
            context.font = "32px Arial";
            context.fillText("Skanna för att låna utrustning", canvas.width / 2, 145);

            context.drawImage(qrImage, 190, 220, 520, 520);

            context.fillStyle = "#0f172a";
            context.font = "bold 42px Arial";
            context.fillText(qrData.type || "Utrustning", canvas.width / 2, 820);

            context.fillStyle = "#475569";
            context.font = "30px Arial";
            context.fillText(qrData.serialNumber, canvas.width / 2, 875);

            if (qrData.description) {
                context.font = "26px Arial";
                context.fillText(qrData.description, canvas.width / 2, 925);
            }

            context.fillStyle = qrData.available ? "#166534" : "#92400e";
            context.font = "bold 30px Arial";
            context.fillText(
                qrData.available ? "Tillgänglig" : "Utlånad",
                canvas.width / 2,
                990
            );

            context.fillStyle = "#64748b";
            context.font = "22px Arial";
            context.fillText("QR-koden leder direkt till låneformuläret", canvas.width / 2, 1070);

            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = `${qrData.serialNumber}-qr-etikett.png`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        qrImage.src = `data:image/png;base64,${qrData.qrCodeBase64}`;
    }

    function printQrLabel() {
        window.print();
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
                    <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-300 text-lg">Hämtar QR-kod...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
                <div className="bg-red-950 border border-red-800 rounded-2xl p-8 max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-red-300 mb-4">
                        Något gick fel
                    </h2>
                    <p className="text-red-200">{error}</p>
                </div>
            </div>
        );
    }

    const isAvailable = qrData.available;

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-8 print:bg-white">
            <div className="max-w-xl mx-auto">

                <div
                    ref={labelRef}
                    className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:border-none print:bg-white"
                >

                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-center print:bg-none print:bg-white">
                        <h1 className="text-3xl font-bold text-white mb-2 print:text-slate-950">
                            QR-kod
                        </h1>
                        <p className="text-blue-100 print:text-slate-700">
                            Skanna för att låna utrustningen
                        </p>
                    </div>

                    <div className="p-6 md:p-8">

                        <div
                            className={
                                isAvailable
                                    ? "mb-6 rounded-2xl border border-green-700 bg-green-950 p-4 print:bg-white"
                                    : "mb-6 rounded-2xl border border-amber-700 bg-amber-950 p-4 print:bg-white"
                            }
                        >
                            <p
                                className={
                                    isAvailable
                                        ? "text-sm font-bold text-green-300 print:text-green-700"
                                        : "text-sm font-bold text-amber-300 print:text-amber-700"
                                }
                            >
                                {isAvailable ? "Tillgänglig" : "Utlånad"}
                            </p>

                            <p className="mt-1 text-sm text-slate-300 print:text-slate-700">
                                {isAvailable
                                    ? "Denna utrustning kan lånas via QR-koden."
                                    : "Denna utrustning är redan utlånad och kan inte lånas igen just nu."}
                            </p>
                        </div>

                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-6 space-y-3 print:bg-white print:border-slate-300">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-400 print:text-slate-600">Typ</span>
                                <span className="text-white font-semibold text-right print:text-slate-950">
                                    {qrData.type}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-400 print:text-slate-600">Serienummer</span>
                                <span className="text-white font-semibold text-right print:text-slate-950">
                                    {qrData.serialNumber}
                                </span>
                            </div>

                            {qrData.description && (
                                <div className="border-t border-slate-700 pt-3 print:border-slate-300">
                                    <p className="text-slate-400 text-sm mb-1 print:text-slate-600">
                                        Beskrivning
                                    </p>
                                    <p className="text-slate-200 text-sm print:text-slate-950">
                                        {qrData.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-3xl p-6 shadow-inner mb-6">
                            <img
                                src={`data:image/png;base64,${qrData.qrCodeBase64}`}
                                alt="QR-kod"
                                className="w-full max-w-sm mx-auto"
                            />
                        </div>

                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-6 break-all print:hidden">
                            <p className="text-slate-400 text-sm mb-2">
                                Lånelänk
                            </p>

                            <p className="text-blue-400 text-sm">
                                {qrData.loanUrl}
                            </p>
                        </div>

                        {copyMessage && (
                            <div className="mb-6 rounded-2xl border border-green-800 bg-green-950 p-4 print:hidden">
                                <p className="text-green-300 text-sm text-center font-medium">
                                    {copyMessage}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
                            <button
                                onClick={copyUrl}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all"
                            >
                                Kopiera länk
                            </button>

                            <button
                                onClick={downloadQrCode}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-2xl transition-all"
                            >
                                Ladda ner QR
                            </button>

                            <button
                                onClick={downloadQrLabel}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-4 rounded-2xl transition-all"
                            >
                                Ladda ner etikett
                            </button>

                            <button
                                onClick={printQrLabel}
                                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-2xl transition-all"
                            >
                                Skriv ut
                            </button>
                        </div>

                        <div className="mt-6 bg-green-950 border border-green-800 rounded-2xl p-4 print:hidden">
                            <p className="text-green-300 text-sm text-center">
                                Tips: Ladda ner etiketten om du vill skriva ut en tydligare QR-lapp till utrustningen.
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}