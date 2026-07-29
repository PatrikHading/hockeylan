import {
    useEffect,
    useState,
} from "react";
import {
    useNavigate,
    useParams,
} from "react-router";
import api from "../api/api";

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

export default function LoanForm() {
    const { serialNumber } =
        useParams();

    const navigate = useNavigate();

    const [equipment, setEquipment] =
        useState(null);

    const [formData, setFormData] =
        useState({
            borrowerName: "",
            email: "",
            phoneNumber: "",
        });

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [
        successMessage,
        setSuccessMessage,
    ] = useState("");

    useEffect(() => {
        let activeRequest = true;

        async function fetchEquipment() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await api.get(
                        `/loan/${serialNumber}`
                    );

                if (activeRequest) {
                    setEquipment(
                        response.data
                    );
                }
            } catch (requestError) {
                if (activeRequest) {
                    setError(
                        requestError
                            .response
                            ?.data
                            ?.message
                        || requestError
                            .displayMessage
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
            setError(
                "Denna utrustning är inaktiverad och kan inte lånas."
            );

            return;
        }

        if (!equipment?.available) {
            setError(
                "Denna utrustning är redan utlånad."
            );

            return;
        }

        try {
            setSubmitting(true);
            setError("");
            setSuccessMessage("");

            await api.post(
                `/loan/${serialNumber}`,
                {
                    borrowerName:
                    formData
                        .borrowerName,
                    email:
                    formData.email,
                    phoneNumber:
                    formData
                        .phoneNumber,
                }
            );

            setSuccessMessage(
                "Utrustningen är nu utlånad."
            );

            window.setTimeout(() => {
                navigate(
                    "/loan/success",
                    {
                        state: {
                            equipmentType:
                            equipment.type,
                            serialNumber:
                            equipment
                                .serialNumber,
                            borrowerName:
                            formData
                                .borrowerName,
                            timestamp:
                                new Date()
                                    .toISOString(),
                        },
                    }
                );
            }, 1200);
        } catch (requestError) {
            setError(
                requestError
                    .response
                    ?.data
                    ?.message
                || requestError
                    .displayMessage
                || "Något gick fel. Försök igen."
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

                    <p className="text-slate-300">
                        Hämtar utrustning...
                    </p>
                </div>
            </div>
        );
    }

    if (!equipment) {
        return (
            <div className="mobile-page flex items-center justify-center bg-slate-950 px-4">
                <div className="w-full max-w-md rounded-2xl border border-red-800 bg-red-950 p-6">
                    <h1 className="text-2xl font-bold text-red-300">
                        Utrustningen kunde
                        inte visas
                    </h1>

                    <p className="mt-3 text-red-200">
                        {error
                            || "Utrustningen kunde inte hittas."}
                    </p>
                </div>
            </div>
        );
    }

    const isActive =
        equipment.active;

    const isAvailable =
        equipment.available;

    const canBeLoaned =
        isActive && isAvailable;

    const status = getStatus(
        isActive,
        isAvailable
    );

    return (
        <div className="mobile-page safe-bottom bg-slate-950 px-4 py-6">
            <div className="mx-auto max-w-xl">
                <div className="mobile-card overflow-hidden bg-slate-900 shadow-2xl ring-1 ring-slate-800">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
                        <h1 className="mb-2 text-3xl font-bold text-white">
                            Låna utrustning
                        </h1>

                        <p className="text-blue-100">
                            Fyll i dina
                            kontaktuppgifter
                        </p>
                    </div>

                    <div className="p-5 sm:p-6">
                        <StatusPanel
                            status={status}
                        />

                        <EquipmentDetails
                            equipment={
                                equipment
                            }
                        />

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
                                    {
                                        successMessage
                                    }
                                </p>
                            </div>
                        )}

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="space-y-5"
                        >
                            <LoanInput
                                id="borrowerName"
                                label="Namn"
                                type="text"
                                value={
                                    formData
                                        .borrowerName
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    !canBeLoaned
                                    || submitting
                                }
                                autoComplete="name"
                            />

                            <LoanInput
                                id="email"
                                label="E-post"
                                type="email"
                                value={
                                    formData.email
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    !canBeLoaned
                                    || submitting
                                }
                                autoComplete="email"
                            />

                            <LoanInput
                                id="phoneNumber"
                                label="Telefonnummer"
                                type="tel"
                                value={
                                    formData
                                        .phoneNumber
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    !canBeLoaned
                                    || submitting
                                }
                                autoComplete="tel"
                            />

                            <button
                                type="submit"
                                disabled={
                                    submitting
                                    || !canBeLoaned
                                }
                                className="mobile-button w-full rounded-2xl bg-blue-600 px-4 py-4 font-semibold text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
                            >
                                {
                                    getSubmitText(
                                        isActive,
                                        isAvailable,
                                        submitting
                                    )
                                }
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusPanel({ status }) {
    const statusStyles = {
        AVAILABLE: {
            container:
                "border-green-700 bg-green-950",
            heading:
                "text-green-300",
            title: "Tillgänglig",
            description:
                "Denna utrustning kan lånas nu.",
        },
        LOANED: {
            container:
                "border-amber-700 bg-amber-950",
            heading:
                "text-amber-300",
            title: "Redan utlånad",
            description:
                "Utrustningen kan inte lånas igen förrän den är återlämnad.",
        },
        INACTIVE: {
            container:
                "border-slate-600 bg-slate-800",
            heading:
                "text-slate-200",
            title: "Inaktiverad",
            description:
                "Utrustningen är inte längre tillgänglig för utlåning.",
        },
    };

    const selectedStatus =
        statusStyles[status];

    return (
        <div
            className={[
                "mb-6 rounded-2xl border p-4",
                selectedStatus.container,
            ].join(" ")}
        >
            <p
                className={[
                    "font-bold",
                    selectedStatus.heading,
                ].join(" ")}
            >
                {selectedStatus.title}
            </p>

            <p className="mt-1 text-sm text-slate-300">
                {
                    selectedStatus
                        .description
                }
            </p>
        </div>
    );
}

function EquipmentDetails({
                              equipment,
                          }) {
    const detailRows = [
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
    ].filter((row) => row.value);

    return (
        <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-800 p-4">
            <dl className="space-y-3">
                {detailRows.map((row) => (
                    <div
                        key={row.label}
                        className="flex justify-between gap-4"
                    >
                        <dt className="text-sm text-slate-400">
                            {row.label}
                        </dt>

                        <dd className="text-right text-sm font-semibold text-white">
                            {row.value}
                        </dd>
                    </div>
                ))}
            </dl>

            {equipment.description && (
                <div className="mt-4 border-t border-slate-700 pt-4">
                    <p className="text-sm text-slate-400">
                        Beskrivning
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                        {
                            equipment
                                .description
                        }
                    </p>
                </div>
            )}
        </div>
    );
}

function LoanInput({
                       id,
                       label,
                       type,
                       value,
                       onChange,
                       disabled,
                       autoComplete,
                   }) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-2 block text-slate-300"
            >
                {label}
            </label>

            <input
                id={id}
                type={type}
                name={id}
                value={value}
                onChange={onChange}
                required
                disabled={disabled}
                autoComplete={autoComplete}
                className="mobile-input w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:outline-none"
            />
        </div>
    );
}

function getStatus(
    active,
    available
) {
    if (!active) {
        return "INACTIVE";
    }

    return available
        ? "AVAILABLE"
        : "LOANED";
}

function getSubmitText(
    active,
    available,
    submitting
) {
    if (!active) {
        return "Utrustningen är inaktiverad";
    }

    if (!available) {
        return "Redan utlånad";
    }

    if (submitting) {
        return "Registrerar lån...";
    }

    return "Låna utrustning";
}