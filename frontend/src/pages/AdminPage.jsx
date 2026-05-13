import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";

function AdminPage() {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [returning, setReturning] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEquipment, setSelectedEquipment] = useState(null);

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

    useEffect(() => {
        fetchEquipment();
    }, []);

    const filteredEquipment = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();

        if (!query) {
            return equipment;
        }

        return equipment.filter((item) => {
            return (
                item.type?.toLowerCase().includes(query) ||
                item.serialNumber?.toLowerCase().includes(query) ||
                item.description?.toLowerCase().includes(query)
            );
        });
    }, [equipment, searchTerm]);

    const totalCount = equipment.length;
    const availableCount = equipment.filter((item) => item.available).length;
    const loanedCount = totalCount - availableCount;

    async function handleReturned() {
        if (!selectedEquipment) {
            return;
        }

        try {
            setReturning(true);
            setErrorMessage("");
            setSuccessMessage("");

            await api.put(`/admin/equipment/${selectedEquipment.id}/returned`);
            await fetchEquipment();

            setSuccessMessage(
                `${selectedEquipment.serialNumber} är markerad som återlämnad.`
            );

            setSelectedEquipment(null);
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Kunde inte markera som återlämnad."
            );
        } finally {
            setReturning(false);
        }
    }

    return (
        <div className="mobile-page safe-bottom space-y-6">
            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <Badge variant="hockey">Admin</Badge>

                        <h1 className="mt-3">Utrustning</h1>

                        <p className="mt-2 max-w-2xl">
                            Hantera utrustning, skapa QR-koder och markera återlämningar.
                        </p>
                    </div>

                    <Link to="/admin/add">
                        <Button size="lg" fullWidth className="mobile-button sm:w-auto">
                            Lägg till utrustning
                        </Button>
                    </Link>
                </div>
            </section>

            <section
                className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                aria-label="Statistik för utrustning"
            >
                <div className="rounded-2xl bg-blue-950 p-5 text-white shadow-sm">
                    <p className="text-sm font-semibold text-blue-100">Totalt</p>
                    <p className="mt-2 text-3xl font-black">{totalCount}</p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">Tillgängliga</p>
                    <p className="mt-2 text-3xl font-black text-green-700">
                        {availableCount}
                    </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">Utlånade</p>
                    <p className="mt-2 text-3xl font-black text-amber-700">
                        {loanedCount}
                    </p>
                </div>
            </section>

            {errorMessage && (
                <Alert title="Något gick fel" variant="danger">
                    {errorMessage}
                </Alert>
            )}

            {successMessage && (
                <Alert title="Klart" variant="success">
                    {successMessage}
                </Alert>
            )}

            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2>Lista</h2>

                        <p className="mt-1 text-sm text-slate-600">
                            Sök på typ, serienummer eller beskrivning.
                        </p>
                    </div>

                    <div className="w-full md:max-w-sm">
                        <label htmlFor="equipment-search" className="sr-only">
                            Sök utrustning
                        </label>

                        <input
                            id="equipment-search"
                            type="search"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Sök utrustning..."
                            aria-label="Sök utrustning"
                            className="mobile-input"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-3">
                        <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                        <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                        <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                    </div>
                ) : filteredEquipment.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                        <h3>Ingen utrustning hittades</h3>

                        <p className="mt-2 text-sm text-slate-600">
                            Prova en annan sökning eller lägg till ny utrustning.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
                            <table>
                                <thead>
                                <tr>
                                    <th>Typ</th>
                                    <th>Serienummer</th>
                                    <th>Beskrivning</th>
                                    <th>Status</th>
                                    <th>Åtgärder</th>
                                </tr>
                                </thead>

                                <tbody>
                                {filteredEquipment.map((item) => (
                                    <tr key={item.id}>
                                        <td className="font-semibold text-slate-900">
                                            {item.type}
                                        </td>

                                        <td className="font-mono text-sm font-semibold text-slate-700">
                                            {item.serialNumber}
                                        </td>

                                        <td className="text-slate-600">
                                            {item.description || "-"}
                                        </td>

                                        <td>
                                            {item.available ? (
                                                <Badge variant="success">Tillgänglig</Badge>
                                            ) : (
                                                <Badge variant="warning">Utlånad</Badge>
                                            )}
                                        </td>

                                        <td>
                                            <div className="flex flex-wrap gap-2">
                                                <Link to={`/admin/qr/${item.id}`}>
                                                    <Button variant="outline" size="sm" className="mobile-button">
                                                        QR
                                                    </Button>
                                                </Link>

                                                {!item.available && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="mobile-button"
                                                        onClick={() => setSelectedEquipment(item)}
                                                    >
                                                        Återlämnad
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-4 md:hidden">
                            {filteredEquipment.map((item) => (
                                <article
                                    key={item.id}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3>{item.type}</h3>

                                            <p className="mt-1 font-mono text-sm text-slate-600">
                                                {item.serialNumber}
                                            </p>
                                        </div>

                                        {item.available ? (
                                            <Badge variant="success">Tillgänglig</Badge>
                                        ) : (
                                            <Badge variant="warning">Utlånad</Badge>
                                        )}
                                    </div>

                                    <p className="mt-3 text-sm text-slate-600">
                                        {item.description || "Ingen beskrivning angiven."}
                                    </p>

                                    <div className="mt-4 flex flex-col gap-2">
                                        <Link to={`/admin/qr/${item.id}`}>
                                            <Button variant="outline" fullWidth className="mobile-button">
                                                Visa QR-kod
                                            </Button>
                                        </Link>

                                        {!item.available && (
                                            <Button
                                                variant="secondary"
                                                fullWidth
                                                className="mobile-button"
                                                onClick={() => setSelectedEquipment(item)}
                                            >
                                                Markera som återlämnad
                                            </Button>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </>
                )}
            </section>

            <ConfirmDialog
                open={Boolean(selectedEquipment)}
                title="Markera som återlämnad?"
                message={
                    selectedEquipment
                        ? `Vill du markera ${selectedEquipment.serialNumber} som återlämnad?`
                        : ""
                }
                confirmText="Ja, markera återlämnad"
                cancelText="Avbryt"
                loading={returning}
                variant="secondary"
                onConfirm={handleReturned}
                onCancel={() => setSelectedEquipment(null)}
            />
        </div>
    );
}

export default AdminPage;