import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function QrCodeView() {
    const { id } = useParams();

    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

            alert("Länk kopierad!");
        } catch (err) {
            console.error(err);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
                    <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>

                    <p className="text-slate-300 text-lg">
                        Hämtar QR-kod...
                    </p>
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

                    <p className="text-red-200">
                        {error}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-8">
            <div className="max-w-xl mx-auto">

                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">

                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-center">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            QR-kod
                        </h1>

                        <p className="text-blue-100">
                            Skanna för att låna utrustningen
                        </p>
                    </div>

                    <div className="p-6 md:p-8">

                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-6">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400">
                                    Serienummer
                                </span>

                                <span className="text-white font-semibold">
                                    {qrData.serialNumber}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 shadow-inner mb-6">
                            <img
                                src={`data:image/png;base64,${qrData.qrCodeBase64}`}
                                alt="QR-kod"
                                className="w-full max-w-sm mx-auto"
                            />
                        </div>

                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-6 break-all">
                            <p className="text-slate-400 text-sm mb-2">
                                Lånelänk
                            </p>

                            <p className="text-blue-400 text-sm">
                                {qrData.loanUrl}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

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

                        </div>

                        <div className="mt-6 bg-green-950 border border-green-800 rounded-2xl p-4">
                            <p className="text-green-300 text-sm text-center">
                                Tips: Skriv ut QR-koden och sätt den direkt på utrustningen.
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}