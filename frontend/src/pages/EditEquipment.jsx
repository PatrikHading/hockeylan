import {
    useEffect,
    useState,
} from "react";
import {
    useNavigate,
    useParams,
} from "react-router";
import api from "../api/api";
import EquipmentForm from "../components/equipment/EquipmentForm";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import {
    createEquipmentPayload,
    equipmentToFormData,
    initialEquipmentFormData,
} from "../features/equipment/equipmentForm";

function EditEquipment() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] =
        useState({
            ...initialEquipmentFormData,
        });

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    useEffect(() => {
        let activeRequest = true;

        async function fetchEquipment() {
            try {
                setLoading(true);
                setErrorMessage("");

                const response =
                    await api.get(
                        `/admin/equipment/${id}`
                    );

                if (activeRequest) {
                    setFormData(
                        equipmentToFormData(
                            response.data
                        )
                    );
                }
            } catch (error) {
                if (
                    activeRequest
                    && error.response?.status
                    !== 401
                ) {
                    setErrorMessage(
                        error.response?.data
                            ?.message
                        || error.displayMessage
                        || "Kunde inte hämta utrustningen."
                    );
                }
            } finally {
                if (activeRequest) {
                    setLoading(false);
                }
            }
        }

        fetchEquipment();

        return () => {
            activeRequest = false;
        };
    }, [id]);

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

            await api.put(
                `/admin/equipment/${id}`,
                createEquipmentPayload(
                    formData
                )
            );

            navigate("/admin", {
                state: {
                    successMessage:
                        "Utrustningen har uppdaterats.",
                },
            });
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message
                || error.displayMessage
                || "Kunde inte uppdatera utrustningen."
            );
        } finally {
            setSaving(false);
        }
    }

    function handleCancel() {
        navigate("/admin");
    }

    if (loading) {
        return (
            <div
                className="mx-auto max-w-3xl"
                aria-label="Laddar utrustning"
            >
                <div className="h-72 animate-pulse rounded-3xl bg-white shadow-sm" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <Badge variant="hockey">
                    Redigera utrustning
                </Badge>

                <h1 className="mt-3">
                    Redigera utrustning
                </h1>

                <p className="mt-2">
                    Uppdatera egenskaperna för
                    utrustningen. Aktiv status
                    hanteras från adminlistan.
                </p>
            </section>

            {errorMessage && (
                <Alert
                    title="Något gick fel"
                    variant="danger"
                >
                    {errorMessage}
                </Alert>
            )}

            {!errorMessage && (
                <Alert
                    title="Tänk på QR-koden"
                    variant="info"
                >
                    Om serienumret ändras
                    behöver du skriva ut en ny
                    QR-etikett. Den gamla
                    QR-koden innehåller det
                    tidigare serienumret.
                </Alert>
            )}

            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <EquipmentForm
                    formData={formData}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    saving={saving}
                    submitText="Spara ändringar"
                    showSerialNumberWarning
                />
            </section>
        </div>
    );
}

export default EditEquipment;