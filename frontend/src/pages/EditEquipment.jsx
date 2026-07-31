import {
    useEffect,
    useRef,
    useState,
} from "react";
import {
    useNavigate,
    useParams,
} from "react-router";
import api, {
    getErrorMessage,
    getFieldErrors,
    hasErrorCode,
} from "../api/api";
import EquipmentForm from "../components/equipment/EquipmentForm";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import LinkButton from "../components/ui/LinkButton";
import {
    createEquipmentPayload,
    equipmentToFormData,
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

function EditEquipment() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] =
        useState({
            ...initialEquipmentFormData,
        });

    const [
        fieldErrors,
        setFieldErrors,
    ] = useState({});

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [loadAttempt, setLoadAttempt] =
        useState(0);

    const [loadError, setLoadError] =
        useState(null);

    const [saveError, setSaveError] =
        useState("");

    const submissionInProgressRef =
        useRef(false);

    const saveErrorRef =
        useRef(null);

    useEffect(() => {
        const controller =
            new AbortController();

        let activeRequest = true;

        async function fetchEquipment() {
            setLoading(true);
            setLoadError(null);
            setSaveError("");
            setFieldErrors({});

            try {
                const response =
                    await api.get(
                        `/admin/equipment/${encodeURIComponent(
                            id
                        )}`,
                        {
                            signal:
                            controller.signal,
                        }
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
                    !activeRequest ||
                    controller.signal.aborted
                ) {
                    return;
                }

                if (
                    hasErrorCode(
                        error,
                        "AUTHENTICATION_REQUIRED"
                    )
                ) {
                    return;
                }

                setLoadError({
                    notFound:
                        hasErrorCode(
                            error,
                            "EQUIPMENT_NOT_FOUND"
                        ) ||
                        hasErrorCode(
                            error,
                            "RESOURCE_NOT_FOUND"
                        ),

                    message:
                        getErrorMessage(
                            error,
                            "Utrustningen kunde inte hämtas. Försök igen."
                        ),
                });
            } finally {
                if (activeRequest) {
                    setLoading(false);
                }
            }
        }

        void fetchEquipment();

        return () => {
            activeRequest = false;
            controller.abort();
        };
    }, [
        id,
        loadAttempt,
    ]);

    useEffect(() => {
        if (saveError) {
            saveErrorRef.current?.focus();
        }
    }, [saveError]);

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

        setSaveError("");

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
            await api.put(
                `/admin/equipment/${encodeURIComponent(
                    id
                )}`,
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
                setSaveError(
                    getErrorMessage(
                        error,
                        "Kunde inte uppdatera utrustningen. Försök igen."
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

    if (loading) {
        return (
            <main
                className="mx-auto max-w-3xl"
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <div
                    className="h-72 animate-pulse rounded-3xl bg-white shadow-sm"
                    aria-hidden="true"
                />

                <span className="sr-only">
                    Laddar utrustning...
                </span>
            </main>
        );
    }

    if (loadError) {
        return (
            <main
                className="mx-auto max-w-3xl space-y-6"
                aria-labelledby="edit-load-error-heading"
            >
                <Alert
                    title={
                        loadError.notFound
                            ? "Utrustningen finns inte"
                            : "Utrustningen kunde inte hämtas"
                    }
                    variant="danger"
                >
                    {loadError.message}
                </Alert>

                <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                    <h1
                        id="edit-load-error-heading"
                        className="text-xl font-black text-slate-900"
                    >
                        Hur vill du fortsätta?
                    </h1>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        {!loadError.notFound && (
                            <Button
                                type="button"
                                onClick={() =>
                                    setLoadAttempt(
                                        (current) =>
                                            current +
                                            1
                                    )
                                }
                                fullWidth
                            >
                                Försök igen
                            </Button>
                        )}

                        <LinkButton
                            to="/admin"
                            variant="outline"
                            fullWidth
                        >
                            Till adminvyn
                        </LinkButton>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main
            className="mx-auto max-w-3xl space-y-6"
            aria-labelledby="edit-equipment-heading"
        >
            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <Badge variant="hockey">
                    Redigera utrustning
                </Badge>

                <h1
                    id="edit-equipment-heading"
                    className="mt-3"
                >
                    Redigera utrustning
                </h1>

                <p className="mt-2 text-slate-700">
                    Uppdatera egenskaperna för
                    utrustningen. Aktiv status
                    hanteras från adminlistan.
                </p>
            </section>

            {saveError && (
                <div
                    ref={saveErrorRef}
                    tabIndex={-1}
                    className="rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2"
                >
                    <Alert
                        title="Kunde inte spara ändringarna"
                        variant="danger"
                    >
                        {saveError}
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
                    rättas innan ändringarna
                    kan sparas.
                </Alert>
            )}

            <Alert
                title="Tänk på QR-koden"
                variant="info"
            >
                Om serienumret ändras behöver
                du skriva ut en ny QR-etikett.
                Den gamla QR-koden innehåller
                det tidigare serienumret.
            </Alert>

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
                    submitText="Spara ändringar"
                    showSerialNumberWarning
                />
            </section>
        </main>
    );
}

export default EditEquipment;