import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

const equipmentTypes = ["COMPLETE_KIT", "HELMET", "SKATES", "STICK"];

function AddEquipment() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        type: "HELMET",
        serialNumber: "",
        description: "",
    });

    const [errorMessage, setErrorMessage] = useState("");

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!formData.serialNumber.trim()) {
            setErrorMessage("Serienummer måste fyllas i.");
            return;
        }

        try {
            await api.post("/admin/equipment", formData);
            navigate("/admin");
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Kunde inte lägga till utrustning."
            );
        }
    }

    return (
        <main className="min-h-screen bg-slate-100 p-6">
            <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
                <h1 className="text-2xl font-bold text-slate-900">
                    Lägg till utrustning
                </h1>

                {errorMessage && (
                    <div className="mt-4 rounded-lg bg-red-100 p-3 text-red-700">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label className="mb-1 block font-medium text-slate-700">
                            Typ
                        </label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 p-3"
                        >
                            {equipmentTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block font-medium text-slate-700">
                            Serienummer
                        </label>
                        <input
                            name="serialNumber"
                            value={formData.serialNumber}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 p-3"
                            placeholder="Exempel: HELMET-001"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block font-medium text-slate-700">
                            Beskrivning
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 p-3"
                            rows="4"
                            placeholder="Exempel: Bauer hjälm medium"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
                        >
                            Spara
                        </button>

                        <Link
                            to="/admin"
                            className="rounded-lg bg-slate-200 px-4 py-2 text-slate-900 hover:bg-slate-300"
                        >
                            Avbryt
                        </Link>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default AddEquipment;