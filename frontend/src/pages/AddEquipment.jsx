import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import FormField from "../components/ui/FormField";

const equipmentTypes = [
    { value: "COMPLETE_KIT", label: "Komplett utrustning" },
    { value: "HELMET", label: "Hjälm" },
    { value: "SKATES", label: "Skridskor" },
    { value: "STICK", label: "Klubba" },
];

function AddEquipment() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        type: "HELMET",
        serialNumber: "",
        description: "",
    });

    const [errorMessage, setErrorMessage] = useState("");
    const [saving, setSaving] = useState(false);

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
            setSaving(true);
            setErrorMessage("");

            await api.post("/admin/equipment", {
                ...formData,
                serialNumber: formData.serialNumber.trim(),
                description: formData.description.trim(),
            });

            navigate("/admin");
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Kunde inte lägga till utrustning."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            <section className="rounded-3xl bg-white p-6 shadow-sm">
                <Badge variant="hockey">Ny utrustning</Badge>

                <h1 className="mt-3">
                    Lägg till utrustning
                </h1>

                <p className="mt-2 max-w-2xl">
                    Registrera ny utrustning som senare kan lånas ut via QR-kod.
                </p>
            </section>

            {errorMessage && (
                <Alert title="Kunde inte spara" variant="danger">
                    {errorMessage}
                </Alert>
            )}

            <section className="rounded-3xl bg-white p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <FormField
                        id="type"
                        label="Typ av utrustning"
                        required
                        helperText="Välj den kategori som passar bäst."
                    >
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            required
                        >
                            {equipmentTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    <FormField
                        id="serialNumber"
                        label="Serienummer"
                        required
                        helperText="Använd gärna ett tydligt format, till exempel HELMET-001."
                    >
                        <input
                            id="serialNumber"
                            name="serialNumber"
                            value={formData.serialNumber}
                            onChange={handleChange}
                            placeholder="Exempel: HELMET-001"
                            required
                            autoComplete="off"
                        />
                    </FormField>

                    <FormField
                        id="description"
                        label="Beskrivning"
                        helperText="Lägg gärna till storlek, märke eller skick."
                    >
            <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Exempel: Bauer hjälm, medium, svart"
            />
                    </FormField>

                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                        <Link to="/admin">
                            <Button variant="outline" fullWidth className="sm:w-auto">
                                Avbryt
                            </Button>
                        </Link>

                        <Button
                            type="submit"
                            disabled={saving}
                            fullWidth
                            className="sm:w-auto"
                        >
                            {saving ? "Sparar..." : "Spara utrustning"}
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default AddEquipment;