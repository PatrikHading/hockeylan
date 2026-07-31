import {
    useEffect,
    useRef,
    useState,
} from "react";
import { useNavigate } from "react-router";
import api, {
    getErrorMessage,
    getFieldErrors,
} from "../api/api";
import EquipmentForm from "../components/equipment/EquipmentForm";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import {
    createEquipmentPayload,
    initialEquipmentFormData,
} from "../features/equipment/equipmentForm";

const SERIAL_NUMBER_PATTERN =
    /^[A-Za-z0-9_-]+$/;

const FIELD_ORDER = [
    "type",
    "serialNumber",
    "size",
    "ageCategory",
    "brand",
    "model",
    "condition",
    "storageLocation",
    "description",
];

function AddEquipment() {
    const navigate = useNavigate();

    const [formData, setFormData] =
        useState({
            ...initialEquipmentFormData,
        });

    const [fieldErrors, setFieldErrors] =
        useState({});

    const [errorMessage, setErrorMessage] =
        useState("");

    const [saving, setSaving] =
        useState(false);

    const submissionInProgressRef =
        useRef(false);

    const errorContainerRef =
        useRef(null);

    useEffect(() => {
        if (errorMessage) {
            errorContainerRef.current?.focus();
        }
    }, [errorMessage]);

    function handleChange(event) {
        const { name, value } =
            event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));

        setFieldErrors((current) => {
            if (!current[name]) {
                return current;
            }

            const nextErrors = {
                ...current,
            };

            delete nextErrors[name];

            return nextErrors;
        });
    }

    function validateForm() {
        const errors = {};

        if (!formData.type) {
            errors.type =
                "Typ av utrustning måste väljas.";
        }

        const serialNumber =
            formData.serialNumber.trim();

        if (!serialNumber) {
            errors.serialNumber =
                "Serienummer måste fyllas i.";
        } else if (
            serialNumber.length < 2
        ) {
            errors.serialNumber =
                "Serienumret måste innehålla minst 2 tecken.";
        } else if (
            serialNumber.length > 50
        ) {
            errors.serialNumber =
                "Serienumret får innehålla högst 50 tecken.";
        } else if (
            !SERIAL_NUMBER_PATTERN.test(
                serialNumber
            )
        ) {
            errors.serialNumber =
                "Serienumret får endast innehålla bokstäver, siffror, bindestreck och understreck.";
        }

        if (!formData.condition) {
            errors.condition =
                "Utrustningens skick måste väljas.";
        }

        return errors;
    }

    function focusFirstInvalidField(
        errors
    ) {
        const firstInvalidField =
            FIELD_ORDER.find(
                (fieldName) =>
                    Boolean(
                        errors[fieldName]
                    )
            );

        if (!firstInvalidField) {
            return;
        }

        window.requestAnimationFrame(
            () => {
                document
                    .getElementById(
                        firstInvalidField
                    )
                    ?.focus();
            }
        );
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (
            submissionInProgressRef.current
        ) {
            return;
        }

        setErrorMessage("");

        const validationErrors =
            validateForm();

        if (
            Object.keys(
                validationErrors
            ).length > 0
        ) {
            setFieldErrors(
                validationErrors
            );

            focusFirstInvalidField(
                validationErrors
            );

            return;
        }

        submissionInProgressRef.current =
            true;

        setSaving(true);
        setFieldErrors({});

        try {
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
            const apiFieldErrors =
                getFieldErrors(error);

            if (
                apiFieldErrors &&
                Object.keys(
                    apiFieldErrors
                ).length > 0
            ) {
                setFieldErrors(
                    apiFieldErrors
                );

                focusFirstInvalidField(
                    apiFieldErrors
                );
            } else {
                setErrorMessage(
                    getErrorMessage(
                        error,
                        "Kunde inte lägga till utrustningen. Försök igen."
                    )
                );
            }
        } finally {
            submissionInProgressRef.current =
                false;

            setSaving(false);
        }
    }

    function handleCancel() {
        if (saving) {
            return;
        }

        navigate("/admin");
    }

    return (
        <main
            className="mx-auto max-w-3xl space-y-6"
            aria-labelledby="add-equipment-heading"
        >
            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <Badge variant="hockey">
                    Ny utrustning
                </Badge>

                <h1
                    id="add-equipment-heading"
                    className="mt-3"
                >
                    Lägg till utrustning
                </h1>

                <p className="mt-2 text-slate-700">
                    Registrera utrustningens
                    egenskaper och skapa sedan
                    QR-koden från adminpanelen.
                </p>
            </section>

            {errorMessage && (
                <div
                    ref={errorContainerRef}
                    tabIndex={-1}
                    className="rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2"
                >
                    <Alert
                        title="Kunde inte spara"
                        variant="danger"
                    >
                        {errorMessage}
                    </Alert>
                </div>
            )}

            {Object.keys(
                fieldErrors
            ).length > 0 && (
                <Alert
                    title="Kontrollera formuläret"
                    variant="danger"
                >
                    Ett eller flera fält behöver
                    rättas innan utrustningen
                    kan sparas.
                </Alert>
            )}

            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <EquipmentForm
                    formData={formData}
                    fieldErrors={
                        fieldErrors
                    }
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    saving={saving}
                    submitText="Spara utrustning"
                />
            </section>
        </main>
    );
}

export default AddEquipment;