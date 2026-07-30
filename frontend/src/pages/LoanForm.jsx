import {
    useEffect,
    useState,
} from "react";
import {
    useNavigate,
    useParams,
} from "react-router";
import api from "../api/api";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import FormField from "../components/ui/FormField";

const typeLabels = {
    COMPLETE_KIT:
        "Komplett utrustning",
    HELMET: "Hjälm",
    SKATES: "Skridskor",
    STICK: "Klubba",
};

const conditionLabels = {
    NEW: "Ny",
    GOOD: "Bra",
    WORN: "Sliten",
    NEEDS_REPAIR:
        "Behöver repareras",
};

const ageCategoryLabels = {
    CHILD: "Barn",
    JUNIOR: "Junior",
    SENIOR: "Senior",
};

const INITIAL_FORM_DATA = {
    borrowerName: "",
    email: "",
    phoneNumber: "",
    expectedReturnDate: "",
};

export default function LoanForm() {
    const { serialNumber } =
        useParams();

    const navigate = useNavigate();

    const [equipment, setEquipment] =
        useState(null);

    const [formData, setFormData] =
        useState(INITIAL_FORM_DATA);

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    const minimumReturnDate =
        formatLocalDateInput(
            new Date()
        );

    useEffect(() => {
        let activeRequest = true;

        async function fetchEquipment() {
            try {
                setLoading(true);
                setErrorMessage("");

                const response =
                    await api.get(
                        `/loan/${serialNumber}`
                    );

                if (activeRequest) {
                    setEquipment(
                        response.data
                    );
                }
            } catch (error) {
                if (activeRequest) {
                    setErrorMessage(
                        error.response
                            ?.data
                            ?.message
                        || error.displayMessage
                        || "Kunde inte hämta utrustning."
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
    }, [serialNumber]);

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

        if (!equipment?.active) {
            setErrorMessage(
                "Utrustningen är inaktiverad och kan inte lånas."
            );

            return;
        }

        if (!equipment?.available) {
            setErrorMessage(
                "Utrustningen är redan utlånad."
            );

            return;
        }

        if (
            !formData.expectedReturnDate
        ) {
            setErrorMessage(
                "Förväntat återlämningsdatum måste anges."
            );

            return;
        }

        if (
            formData.expectedReturnDate
            < minimumReturnDate
        ) {
            setErrorMessage(
                "Förväntat återlämningsdatum får inte ligga före dagens datum."
            );

            return;
        }

        try {
            setSubmitting(true);
            setErrorMessage("");

            const response =
                await api.post(
                    `/admin/loans/${serialNumber}`,
                    {
                        borrowerName:
                        formData
                            .borrowerName,
                        email:
                        formData.email,
                        phoneNumber:
                        formData
                            .phoneNumber,
                        expectedReturnDate:
                        formData
                            .expectedReturnDate,
                    }
                );

            const registeredLoan =
                response.data;

            navigate(
                "/loan/success",
                {
                    replace: true,
                    state: {
                        loanId:
                        registeredLoan.id,
                        equipmentType:
                        registeredLoan
                            .equipment
                            .type,
                        serialNumber:
                        registeredLoan
                            .equipment
                            .serialNumber,
                        borrowerName:
                        registeredLoan
                            .borrowerName,
                        loanDate:
                        registeredLoan
                            .loanDate,
                        expectedReturnDate:
                        registeredLoan
                            .expectedReturnDate,
                    },
                }
            );
        } catch (error) {
            setErrorMessage(
                error.response
                    ?.data
                    ?.message
                || error.displayMessage
                || "Lånet kunde inte registreras."
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div
                className="mobile-page flex items-center justify-center"
                aria-label="Hämtar utrustning"
            >
                <p>
                    Hämtar utrustning...
                </p>
            </div>
        );
    }

    if (!equipment) {
        return (
            <div className="mobile-page safe-bottom">
                <Alert
                    title="Utrustningen kunde inte visas"
                    variant="danger"
                >
                    {errorMessage
                        || "Utrustningen kunde inte hittas."}
                </Alert>
            </div>
        );
    }

    const canBeLoaned =
        equipment.active
        && equipment.available;

    return (
        <div className="mobile-page safe-bottom space-y-6">
            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <Badge variant="hockey">
                    Admin
                </Badge>

                <h1 className="mt-3">
                    Registrera lån
                </h1>

                <p className="mt-2 max-w-2xl">
                    Registreringen får endast
                    genomföras av en utsedd
                    klubbadministratör.
                </p>
            </section>

            <EquipmentStatus
                equipment={equipment}
            />

            {errorMessage && (
                <Alert
                    title="Lånet kunde inte registreras"
                    variant="danger"
                >
                    {errorMessage}
                </Alert>
            )}

            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <EquipmentDetails
                    equipment={equipment}
                />

                <form
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-5"
                >
                    <FormField
                        id="borrowerName"
                        label="Låntagarens namn"
                        required
                    >
                        <input
                            id="borrowerName"
                            name="borrowerName"
                            type="text"
                            value={
                                formData
                                    .borrowerName
                            }
                            onChange={
                                handleChange
                            }
                            minLength={2}
                            maxLength={100}
                            required
                            disabled={
                                !canBeLoaned
                                || submitting
                            }
                            autoComplete="name"
                            className="mobile-input"
                        />
                    </FormField>

                    <FormField
                        id="email"
                        label="Låntagarens e-post"
                        required
                    >
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={
                                formData.email
                            }
                            onChange={
                                handleChange
                            }
                            maxLength={150}
                            required
                            disabled={
                                !canBeLoaned
                                || submitting
                            }
                            autoComplete="email"
                            className="mobile-input"
                        />
                    </FormField>

                    <FormField
                        id="phoneNumber"
                        label="Låntagarens telefonnummer"
                        required
                    >
                        <input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            value={
                                formData
                                    .phoneNumber
                            }
                            onChange={
                                handleChange
                            }
                            minLength={6}
                            maxLength={30}
                            required
                            disabled={
                                !canBeLoaned
                                || submitting
                            }
                            autoComplete="tel"
                            className="mobile-input"
                        />
                    </FormField>

                    <FormField
                        id="expectedReturnDate"
                        label="Förväntat återlämningsdatum"
                        required
                        helperText="Välj det datum som klubben och låntagaren har kommit överens om. Det finns ingen maximal lånetid."
                    >
                        <input
                            id="expectedReturnDate"
                            name="expectedReturnDate"
                            type="date"
                            value={
                                formData
                                    .expectedReturnDate
                            }
                            onChange={
                                handleChange
                            }
                            min={
                                minimumReturnDate
                            }
                            required
                            disabled={
                                !canBeLoaned
                                || submitting
                            }
                            className="mobile-input"
                        />
                    </FormField>

                    <Button
                        type="submit"
                        size="lg"
                        fullWidth
                        disabled={
                            submitting
                            || !canBeLoaned
                        }
                    >
                        {getSubmitText(
                            equipment,
                            submitting
                        )}
                    </Button>
                </form>
            </section>
        </div>
    );
}

function EquipmentStatus({
                             equipment,
                         }) {
    if (!equipment.active) {
        return (
            <Alert
                title="Inaktiverad"
                variant="danger"
            >
                Utrustningen är inaktiverad
                och kan inte lånas.
            </Alert>
        );
    }

    if (!equipment.available) {
        return (
            <Alert
                title="Redan utlånad"
                variant="warning"
            >
                Utrustningen måste
                återlämnas innan ett nytt
                lån kan registreras.
            </Alert>
        );
    }

    return (
        <Alert
            title="Tillgänglig"
            variant="success"
        >
            Utrustningen kan registreras
            som utlånad.
        </Alert>
    );
}

function EquipmentDetails({
                              equipment,
                          }) {
    const rows = [
        {
            label: "Typ",
            value:
                typeLabels[
                    equipment.type
                    ] || equipment.type,
        },
        {
            label: "Serienummer",
            value:
            equipment.serialNumber,
        },
        {
            label: "Storlek",
            value: equipment.size,
        },
        {
            label: "Märke",
            value: equipment.brand,
        },
        {
            label: "Modell",
            value: equipment.model,
        },
        {
            label: "Skick",
            value:
                conditionLabels[
                    equipment.condition
                    ]
                || equipment.condition,
        },
        {
            label: "Ålderskategori",
            value:
                ageCategoryLabels[
                    equipment.ageCategory
                    ]
                || equipment
                    .ageCategory,
        },
        {
            label: "Förvaringsplats",
            value:
            equipment.storageLocation,
        },
    ].filter(
        (row) => row.value
    );

    return (
        <div>
            <h2>
                Utrustning
            </h2>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {rows.map((row) => (
                    <div
                        key={row.label}
                        className="rounded-2xl bg-slate-50 p-3"
                    >
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            {row.label}
                        </dt>

                        <dd className="mt-1 font-semibold text-slate-900">
                            {row.value}
                        </dd>
                    </div>
                ))}
            </dl>

            {equipment.description && (
                <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Beskrivning
                    </p>

                    <p className="mt-1 text-slate-800">
                        {equipment.description}
                    </p>
                </div>
            )}
        </div>
    );
}

function getSubmitText(
    equipment,
    submitting
) {
    if (!equipment.active) {
        return "Utrustningen är inaktiverad";
    }

    if (!equipment.available) {
        return "Utrustningen är redan utlånad";
    }

    if (submitting) {
        return "Registrerar lån...";
    }

    return "Registrera lån";
}

function formatLocalDateInput(date) {
    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}