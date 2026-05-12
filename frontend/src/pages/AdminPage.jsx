import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

function AdminPage() {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    async function fetchEquipment() {
        try {
            setLoading(true);
            const response = await api.get("/admin/equipment");
            setEquipment(response.data);
            setErrorMessage("");
        } catch (error) {
            setErrorMessage("Kunde inte hämta utrustning.");
        } finally {
            setLoading(false);
        }
    }

    async function handleReturned(id) {
        try {
            await api.put(`/admin/equipment/${id}/returned`);
            await fetchEquipment();
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Kunde inte markera som återlämnad."
            );
        }
    }

    useEffect(() => {
        fetchEquipment();
    }, []);

    return (
        <main className="min-h-screen bg-slate-100 p-6">
            <div className="mx-auto max-w-6xl rounded-xl bg-white p-6 shadow">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
                        <p className="mt-1 text-slate-600">
                            Hantera hockeyutrustning och utlåningar.
                        </p>
                    </div>

                    <Link
                        to="/admin/add"
                        className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
                    >
                        Lägg till utrustning
                    </Link>
                </div>

                {errorMessage && (
                    <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
                        {errorMessage}
                    </div>
                )}

                {loading ? (
                    <p className="text-slate-600">Laddar...</p>
                ) : equipment.length === 0 ? (
                    <p className="text-slate-600">Ingen utrustning finns ännu.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                            <tr className="border-b bg-slate-50">
                                <th className="p-3">Typ</th>
                                <th className="p-3">Serienummer</th>
                                <th className="p-3">Beskrivning</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Åtgärder</th>
                            </tr>
                            </thead>
                            <tbody>
                            {equipment.map((item) => (
                                <tr key={item.id} className="border-b">
                                    <td className="p-3">{item.type}</td>
                                    <td className="p-3 font-medium">{item.serialNumber}</td>
                                    <td className="p-3">{item.description || "-"}</td>
                                    <td className="p-3">
                                        {item.available ? (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                          Tillgänglig
                        </span>
                                        ) : (
                                            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700">
                          Utlånad
                        </span>
                                        )}
                                    </td>
                                    <td className="flex flex-wrap gap-2 p-3">
                                        <Link
                                            to={`/admin/qr/${item.id}`}
                                            className="rounded-lg bg-slate-200 px-3 py-2 text-sm hover:bg-slate-300"
                                        >
                                            QR
                                        </Link>

                                        {!item.available && (
                                            <button
                                                type="button"
                                                onClick={() => handleReturned(item.id)}
                                                className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700"
                                            >
                                                Återlämnad
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <Link
                    to="/"
                    className="mt-6 inline-block text-sm text-slate-600 hover:text-slate-900"
                >
                    Till startsidan
                </Link>
            </div>
        </main>
    );
}

export default AdminPage;