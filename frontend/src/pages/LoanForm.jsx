import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function LoanForm() {

    const { serialNumber } = useParams();
    const navigate = useNavigate();

    const [equipment, setEquipment] = useState(null);

    const [formData, setFormData] = useState({
        borrowerName: "",
        email: "",
        phoneNumber: ""
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

            const response = await axios.get(
                `http://localhost:8080/api/loan/${serialNumber}`
            );

            setEquipment(response.data);
        } catch (err) {
            console.error(err);

            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError("Kunde inte hämta utrustning.");
            }
        } finally {
            setLoading(false);
        }
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
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

            await axios.post(
                `http://localhost:8080/api/loan/${serialNumber}`,
                {
                    borrowerName: formData.borrowerName,
                    email: formData.email,
                    phoneNumber: formData.phoneNumber
                }
            );

            setSuccessMessage("Utrustningen är nu utlånad.");

            setTimeout(() => {
                navigate("/thank-you", {
                    state: {
                        equipmentType: equipment.type,
                        serialNumber: equipment.serialNumber,
                        borrowerName: formData.borrowerName,
                        timestamp: new Date().toISOString()
                    }
                });
            }, 1200);

        } catch (err) {
            console.error(err);

            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.request) {
                setError("Kunde inte kontakta servern. Kontrollera internetanslutningen.");
            } else {
                setError("Något gick fel. Försök igen.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-300">Hämtar utrustning...</p>
                </div>
            </div>
        );
    }

    const isAvailable = equipment?.available;

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-8">
            <div className="max-w-xl mx-auto">

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">

                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Låna utrustning
                        </h1>

                        <p className="text-blue-100">
                            Fyll i dina uppgifter
                        </p>
                    </div>

                    <div className="p-6">

                        {equipment && (
                            <>
                                <div
                                    className={
                                        isAvailable
                                            ? "bg-green-950 border border-green-700 rounded-2xl p-4 mb-6"
                                            : "bg-amber-950 border border-amber-700 rounded-2xl p-4 mb-6"
                                    }
                                >
                                    <p
                                        className={
                                            isAvailable
                                                ? "text-green-300 font-bold"
                                                : "text-amber-300 font-bold"
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

                                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-6">
                                    <p className="text-slate-400 text-sm mb-1">
                                        Utrustning
                                    </p>

                                    <p className="text-white font-semibold text-lg">
                                        {equipment.type}
                                    </p>

                                    <p className="text-slate-400 text-sm">
                                        {equipment.serialNumber}
                                    </p>

                                    {equipment.description && (
                                        <p className="mt-3 text-slate-300 text-sm">
                                            {equipment.description}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {error && (
                            <div className="bg-red-950 border border-red-800 rounded-2xl p-4 mb-6">
                                <p className="text-red-300 font-medium">
                                    {error}
                                </p>
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-green-950 border border-green-800 rounded-2xl p-4 mb-6">
                                <p className="text-green-300 font-medium">
                                    {successMessage}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">

                            <div>
                                <label className="block text-slate-300 mb-2">
                                    Namn
                                </label>

                                <input
                                    type="text"
                                    name="borrowerName"
                                    value={formData.borrowerName}
                                    onChange={handleChange}
                                    required
                                    disabled={!isAvailable || submitting}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 mb-2">
                                    E-post
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={!isAvailable || submitting}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 mb-2">
                                    Telefonnummer
                                </label>

                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    required
                                    disabled={!isAvailable || submitting}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !isAvailable}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all"
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