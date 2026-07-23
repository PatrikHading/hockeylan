import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";

export default function LoanForm() {
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

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        fetchEquipment();
    }, []);

    async function fetchEquipment() {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(`/loan/${serialNumber}`);

            setEquipment(response.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Kunde inte hämta utrustning.");
        } finally {
            setLoading(false);
        }
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!equipment?.available) {
            setError("Denna utrustning är redan utlånad.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            setSuccessMessage("");

            await api.post(`/loan/${serialNumber}`, {
                borrowerName: formData.borrowerName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
            });

            setSuccessMessage("Utrustningen är nu utlånad.");

            setTimeout(() => {
                navigate("/loan/success", {
                    state: {
                        equipmentType: equipment.type,
                        serialNumber: equipment.serialNumber,
                        borrowerName: formData.borrowerName,
                        timestamp: new Date().toISOString(),
                    },
                });
            }, 1200);
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                err.displayMessage ||
                "Något gick fel. Försök igen."
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="mobile-page flex items-center justify-center bg-slate-950 px-4">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
                    <p className="text-slate-300">Hämtar utrustning...</p>
                </div>
            </div>
        );
    }

    const isAvailable = equipment?.available;

    return (
        <div className="mobile-page safe-bottom bg-slate-950 px-4 py-6">
            <div className="mx-auto max-w-xl">
                <div className="mobile-card overflow-hidden bg-slate-900 shadow-2xl ring-1 ring-slate-800">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
                        <h1 className="mb-2 text-3xl font-bold text-white">
                            Låna utrustning
                        </h1>

                        <p className="text-blue-100">
                            Fyll i dina uppgifter
                        </p>
                    </div>

                    <div className="p-5 sm:p-6">
                        {equipment && (
                            <>
                                <div
                                    className={
                                        isAvailable
                                            ? "mb-6 rounded-2xl border border-green-700 bg-green-950 p-4"
                                            : "mb-6 rounded-2xl border border-amber-700 bg-amber-950 p-4"
                                    }
                                >
                                    <p
                                        className={
                                            isAvailable
                                                ? "font-bold text-green-300"
                                                : "font-bold text-amber-300"
                                        }
                                    >
                                        {isAvailable ? "Tillgänglig" : "Redan utlånad"}
                                    </p>

                                    <p className="mt-1 text-sm text-slate-300">
                                        {isAvailable
                                            ? "Denna utrustning kan lånas nu."
                                            : "Denna utrustning kan inte lånas igen förrän den är återlämnad."}
                                    </p>
                                </div>

                                <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-800 p-4">
                                    <p className="mb-1 text-sm text-slate-400">
                                        Utrustning
                                    </p>

                                    <p className="text-lg font-semibold text-white">
                                        {equipment.type}
                                    </p>

                                    <p className="text-sm text-slate-400">
                                        {equipment.serialNumber}
                                    </p>

                                    {equipment.description && (
                                        <p className="mt-3 text-sm text-slate-300">
                                            {equipment.description}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {error && (
                            <div className="mb-6 rounded-2xl border border-red-800 bg-red-950 p-4">
                                <p className="font-medium text-red-300">
                                    {error}
                                </p>
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-6 rounded-2xl border border-green-800 bg-green-950 p-4">
                                <p className="font-medium text-green-300">
                                    {successMessage}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label
                                    htmlFor="borrowerName"
                                    className="mb-2 block text-slate-300"
                                >
                                    Namn
                                </label>

                                <input
                                    id="borrowerName"
                                    type="text"
                                    name="borrowerName"
                                    value={formData.borrowerName}
                                    onChange={handleChange}
                                    required
                                    disabled={!isAvailable || submitting}
                                    className="mobile-input w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-slate-300"
                                >
                                    E-post
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={!isAvailable || submitting}
                                    className="mobile-input w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="phoneNumber"
                                    className="mb-2 block text-slate-300"
                                >
                                    Telefonnummer
                                </label>

                                <input
                                    id="phoneNumber"
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    required
                                    disabled={!isAvailable || submitting}
                                    className="mobile-input w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !isAvailable}
                                className="mobile-button w-full rounded-2xl bg-blue-600 px-4 py-4 font-semibold text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
                            >
                                {!isAvailable
                                    ? "Redan utlånad"
                                    : submitting
                                        ? "Registrerar lån..."
                                        : "Låna utrustning"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}