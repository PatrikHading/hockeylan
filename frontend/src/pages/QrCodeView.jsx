import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/api";

function QrCodeView() {
    const { id } = useParams();

    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        async function fetchQrCode() {
            try {
                const response = await api.get(`/admin/equipment/${id}/qr`);
                setQrData(response.data);
            } catch (error) {
                setErrorMessage("Kunde inte hämta QR-kod.");
            } finally {
                setLoading(false);
            }
        }

        fetchQrCode();
    }, [id]);

    return (
        <main className="min-h-screen bg-slate-100 p-6">
            <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 text-center shadow">
                <h1 className="text-2xl font-bold text-slate-900">QR-kod</h1>

                {loading && <p className="mt-4 text-slate-600">Laddar...</p>}

                {errorMessage && (
                    <div className="mt-4 rounded-lg bg-red-100 p-3 text-red-700">
                        {errorMessage}
                    </div>
                )}

                {qrData && (
                    <div className="mt-6">
                        <p className="mb-2 text-slate-700">
                            Serienummer: <strong>{qrData.serialNumber}</strong>
                        </p>

                        <img
                            src={`data:image/png;base64,${qrData.qrCodeBase64}`}
                            alt={`QR-kod för ${qrData.serialNumber}`}
                            className="mx-auto h-72 w-72"
                        />

                        <p className="mt-4 break-all text-sm text-slate-600">
                            {qrData.loanUrl}
                        </p>
                    </div>
                )}

                <Link
                    to="/admin"
                    className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
                >
                    Tillbaka
                </Link>
            </div>
        </main>
    );
}

export default QrCodeView;