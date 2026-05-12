import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";

function LoanForm() {
    const { serialNumber } = useParams();
    const navigate = useNavigate();

    const [equipment, setEquipment] = useState(null);
    const [formData, setFormData] = useState({
        borrowerName: "",
        email: "",
        phoneNumber: "",
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        async function fetchEquipment() {
            try {
                const response = await api.get(`/loan/${serialNumber}`);
                setEquipment(response.data);
            } catch (error) {
                setErrorMessage("Kunde inte hitta utrustningen.");
            } finally {
                setLoading(false);
            }
        }

        fetchEquipment();
    }, [serialNumber]);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!formData.borrowerName.trim()) {
            setErrorMessage("Namn måste fyllas i.");
            return;
        }

        if (!formData.email.trim()) {
            setErrorMessage("E-post måste fyllas i.");
            return;
        }

        if (!formData.phoneNumber.trim()) {
            setErrorMessage("Telefonnummer måste fyllas i.");
            return;
        }

        try {
            setSubmitting(true);
            setErrorMessage("");

            await api.post(`/loan/${serialNumber}`, formData);

            navigate("/loan/success");
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Kunde inte registrera lånet."
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-100 p-6">
                <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
                    <p className="text-slate-600">Laddar utrustning...</p>
                </div>
            </main>
        );
    }

    if (errorMessage && !equipment) {
        return (
            <main className="min-h-screen bg-slate-100 p-6">
                <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Utrustning hittades inte
                    </h1>
                    <p className="mt-3 text-red-700">{errorMessage}</p>
                </div>
            </main>
        );
    }

    if (!equipment.available) {
        return (
            <main className="min-h-screen bg-slate-100 p-6">
                <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Utrustningen är redan utlånad
                    </h1>

                    <div className="mt-4 rounded-lg bg-yellow-100 p-4 text-yellow-800">
                        Denna utrustning är inte tillgänglig just nu.
                    </div>

                    <div className="mt-6 text-slate-700">
                        <p>
                            <strong>Typ:</strong> {equipment.type}
                        </p>
                        <p>
                            <strong>Serienummer:</strong> {equipment.serialNumber}
                        </p>
                        <p>
                            <strong>Beskrivning:</strong> {equipment.description || "-"}
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-100 p-6">
            <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
                <h1 className="text-2xl font-bold text-slate-900">
                    Låna hockeyutrustning
                </h1>

                <div className="mt-4 rounded-lg bg-slate-50 p-4 text-slate-700">
                    <p>
                        <strong>Typ:</strong> {equipment.type}
                    </p>
                    <p>
                        <strong>Serienummer:</strong> {equipment.serialNumber}
                    </p>
                    <p>
                        <strong>Beskrivning:</strong> {equipment.description || "-"}
                    </p>
                </div>

                {errorMessage && (
                    <div className="mt-4 rounded-lg bg-red-100 p-3 text-red-700">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label className="mb-1 block font-medium text-slate-700">
                            Namn
                        </label>
                        <input
                            name="borrowerName"
                            value={formData.borrowerName}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 p-3"
                            placeholder="För- och efternamn"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block font-medium text-slate-700">
                            E-postadress
                        </label>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 p-3"
                            placeholder="namn@example.com"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block font-medium text-slate-700">
                            Telefonnummer
                        </label>
                        <input
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 p-3"
                            placeholder="0701-234 567"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-lg bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {submitting ? "Registrerar..." : "Registrera lån"}
                    </button>
                </form>
            </div>
        </main>
    );
}

export default LoanForm;