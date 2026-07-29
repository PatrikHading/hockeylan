import { useState } from "react";
import { useNavigate } from "react-router";
import api from "../api/api";
import EquipmentForm from "../components/equipment/EquipmentForm";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import {
    createEquipmentPayload,
    initialEquipmentFormData,
} from "../features/equipment/equipmentForm";

function AddEquipment() {
    const navigate = useNavigate();

    const [formData, setFormData] =
        useState({
            ...initialEquipmentFormData,
        });

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const [saving, setSaving] =
        useState(false);

    function handleChange(event) {
        const { name, value } =
            event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (
            !formData.serialNumber.trim()
        ) {
            setErrorMessage(
                "Serienummer måste fyllas i."
            );

            return;
        }

        try {
            setSaving(true);
            setErrorMessage("");

            await api.post(
                "/admin/equipment",
                createEquipmentPayload(
                    formData
                )
            );

            navigate("/admin", {
                state: {
                    successMessage:
                        "Utrustningen har lagts till.",
                },
            });
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message
                || error.displayMessage
                || "Kunde inte lägga till utrustning."
            );
        } finally {
            setSaving(false);
        }
    }

    function handleCancel() {
        navigate("/admin");
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <Badge variant="hockey">
                    Ny utrustning
                </Badge>

                <h1 className="mt-3">
                    Lägg till utrustning
                </h1>

                <p className="mt-2">
                    Registrera utrustningens
                    egenskaper och skapa sedan
                    QR-koden från adminpanelen.
                </p>
            </section>

            {errorMessage && (
                <Alert
                    title="Kunde inte spara"
                    variant="danger"
                >
                    {errorMessage}
                </Alert>
            )}

            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <EquipmentForm
                    formData={formData}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    saving={saving}
                    submitText="Spara utrustning"
                />
            </section>
        </div>
    );
}

export default AddEquipment;