import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/api";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

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
        <div className="mx-auto max-w-4xl space-y-6">
            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <Badge variant="hockey">QR-kod</Badge>

                <h1 className="mt-3">QR-kod</h1>

                <p className="mt-2 max-w-2xl">
                    Skriv ut eller spara QR-koden och fäst den på utrustningen.
                </p>
            </section>

            {loading && (
                <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                    <div className="h-6 w-40 animate-pulse rounded-full bg-slate-100" />
                    <div className="mt-5 h-72 w-72 max-w-full animate-pulse rounded-3xl bg-slate-100" />
                </section>
            )}

            {errorMessage && (
                <Alert title="Något gick fel" variant="danger">
                    {errorMessage}
                </Alert>
            )}

            {qrData && (
                <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                        <h2>Utrustning</h2>

                        <dl className="mt-5 grid gap-4">
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <dt className="text-sm font-bold text-slate-500">
                                    Serienummer
                                </dt>

                                <dd className="mt-1 font-mono font-semibold text-slate-900">
                                    {qrData.serialNumber}
                                </dd>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                                <dt className="text-sm font-bold text-slate-500">
                                    Lånelänk
                                </dt>

                                <dd className="mt-1 break-all font-mono text-sm font-semibold text-slate-900">
                                    {qrData.loanUrl}
                                </dd>
                            </div>
                        </dl>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <Link to="/admin">
                                <Button variant="outline" fullWidth className="sm:w-auto">
                                    Tillbaka
                                </Button>
                            </Link>

                            <Button
                                fullWidth
                                className="sm:w-auto"
                                onClick={() => window.print()}
                            >
                                Skriv ut
                            </Button>
                        </div>
                    </div>

                    <aside className="rounded-3xl bg-blue-950 p-5 text-center text-white shadow-sm sm:p-6">
                        <h2 className="text-white">Skanna här</h2>

                        <div className="mt-5 rounded-3xl bg-white p-4 sm:p-5">
                            <img
                                src={`data:image/png;base64,${qrData.qrCodeBase64}`}
                                alt={`QR-kod för ${qrData.serialNumber}`}
                                className="mx-auto h-72 w-72 max-w-full"
                            />
                        </div>

                        <p className="mt-4 text-sm text-blue-100">
                            QR-koden leder till låneformuläret.
                        </p>
                    </aside>
                </section>
            )}
        </div>
    );
}

export default QrCodeView;