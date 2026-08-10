import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import api, {
    getErrorMessage,
    getFieldErrors,
    hasErrorCode,
} from "../api/api";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import FormField from "../components/ui/FormField";
import LinkButton from "../components/ui/LinkButton";

const typeLabels = {
    COMPLETE_KIT: "Komplett utrustning",
    HELMET: "Hjälm",
    SKATES: "Skridskor",
    STICK: "Klubba",
};

const conditionLabels = {
    NEW: "Ny",
    GOOD: "Bra",
    WORN: "Sliten",
    NEEDS_REPAIR: "Behöver repareras",
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
    aliasName: "",
    expectedReturnDate: "",
};

const FIELD_ORDER = [
    "borrowerName",
    "aliasName",
    "email",
    "phoneNumber",
    "expectedReturnDate",
];

export default function LoanForm() {
    const { serialNumber } = useParams();
    const navigate = useNavigate();

    const [equipment, setEquipment] = useState(null);

    const [aliases, setAliases] = useState([]);
    const [aliasesLoading, setAliasesLoading] = useState(true);
    const [aliasesError, setAliasesError] = useState("");

    const [selectedAliasId, setSelectedAliasId] = useState("");
    const [selectedAliasLoading, setSelectedAliasLoading] = useState(false);
    const [selectedAliasError, setSelectedAliasError] = useState("");

    const [saveAsAlias, setSaveAsAlias] = useState(false);

    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [fieldErrors, setFieldErrors] = useState({});

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const [loadError, setLoadError] = useState(null);
    const [submitError, setSubmitError] = useState("");

    const submissionInProgressRef = useRef(false);
    const submitErrorRef = useRef(null);

    const minimumReturnDate = formatLocalDateInput(new Date());

    useEffect(() => {
        const controller = new AbortController();
        let activeRequest = true;

        async function fetchEquipment() {
            setLoading(true);
            setLoadError(null);
            setSubmitError("");
            setEquipment(null);

            try {
                const response = await api.get(
                    `/loan/${encodeURIComponent(serialNumber)}`,
                    {
                        signal: controller.signal,
                    }
                );

                if (activeRequest) {
                    setEquipment(response.data);
                }
            } catch (error) {
                if (
                    activeRequest &&
                    !controller.signal.aborted
                ) {
                    setLoadError({
                        unknownEquipment:
                            hasErrorCode(
                                error,
                                "EQUIPMENT_NOT_FOUND"
                            ) ||
                            hasErrorCode(
                                error,
                                "RESOURCE_NOT_FOUND"
                            ),
                        message: getErrorMessage(
                            error,
                            "Utrustningen kunde inte hämtas. Försök igen."
                        ),
                    });
                }
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
    }, [loadAttempt, serialNumber]);

    useEffect(() => {
        const controller = new AbortController();
        let activeRequest = true;

        async function fetchAliases() {
            setAliasesLoading(true);
            setAliasesError("");

            try {
                const response = await api.get(
                    "/admin/borrower-aliases",
                    {
                        signal: controller.signal,
                    }
                );

                if (activeRequest) {
                    setAliases(
                        Array.isArray(response.data)
                            ? response.data
                            : []
                    );
                }
            } catch (error) {
                if (
                    activeRequest &&
                    !controller.signal.aborted
                ) {
                    setAliases([]);
                    setAliasesError(
                        getErrorMessage(
                            error,
                            "Alias kunde inte hämtas. Du kan fortfarande fylla i låntagaruppgifterna manuellt."
                        )
                    );
                }
            } finally {
                if (activeRequest) {
                    setAliasesLoading(false);
                }
            }
        }

        void fetchAliases();

        return () => {
            activeRequest = false;
            controller.abort();
        };
    }, []);

    useEffect(() => {
        if (!selectedAliasId) {
            setSelectedAliasLoading(false);
            return undefined;
        }

        const controller = new AbortController();
        let activeRequest = true;

        async function fetchSelectedAlias() {
            setSelectedAliasLoading(true);
            setSelectedAliasError("");

            try {
                const response = await api.get(
                    `/admin/borrower-aliases/${encodeURIComponent(
                        selectedAliasId
                    )}`,
                    {
                        signal: controller.signal,
                    }
                );

                if (!activeRequest) {
                    return;
                }

                const alias = response.data;

                setFormData((current) => ({
                    ...current,
                    borrowerName: alias.borrowerName || "",
                    email: alias.email || "",
                    phoneNumber: alias.phoneNumber || "",
                    aliasName: "",
                }));

                setFieldErrors((current) => {
                    const nextErrors = {
                        ...current,
                    };

                    delete nextErrors.borrowerName;
                    delete nextErrors.email;
                    delete nextErrors.phoneNumber;
                    delete nextErrors.aliasName;

                    return nextErrors;
                });
            } catch (error) {
                if (
                    activeRequest &&
                    !controller.signal.aborted
                ) {
                    setSelectedAliasError(
                        getErrorMessage(
                            error,
                            "Aliaset kunde inte hämtas. Välj Alias igen eller fyll i uppgifterna manuellt."
                        )
                    );

                    setSelectedAliasId("");
                }
            } finally {
                if (activeRequest) {
                    setSelectedAliasLoading(false);
                }
            }
        }

        void fetchSelectedAlias();

        return () => {
            activeRequest = false;
            controller.abort();
        };
    }, [selectedAliasId]);

    useEffect(() => {
        if (submitError) {
            submitErrorRef.current?.focus();
        }
    }, [submitError]);

    function handleChange(event) {
        const { name, value } = event.target;

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

    function handleAliasSelection(event) {
        const value = event.target.value;

        setSelectedAliasError("");
        setSelectedAliasId(value);
        setSaveAsAlias(false);

        setFormData((current) => ({
            ...current,
            aliasName: "",
        }));

        setFieldErrors((current) => {
            if (!current.aliasName) {
                return current;
            }

            const nextErrors = {
                ...current,
            };

            delete nextErrors.aliasName;

            return nextErrors;
        });
    }

    function handleSaveAsAliasChange(event) {
        const checked = event.target.checked;

        setSaveAsAlias(checked);

        if (!checked) {
            setFormData((current) => ({
                ...current,
                aliasName: "",
            }));

            setFieldErrors((current) => {
                if (!current.aliasName) {
                    return current;
                }

                const nextErrors = {
                    ...current,
                };

                delete nextErrors.aliasName;

                return nextErrors;
            });

            return;
        }

        window.requestAnimationFrame(() => {
            document
                .getElementById("aliasName")
                ?.focus();
        });
    }

    function focusFirstInvalidField(errors) {
        const firstInvalidField = FIELD_ORDER.find(
            (fieldName) => Boolean(errors[fieldName])
        );

        if (!firstInvalidField) {
            return;
        }

        window.requestAnimationFrame(() => {
            document
                .getElementById(firstInvalidField)
                ?.focus();
        });
    }

    function validateForm() {
        const errors = {};

        const normalizedName =
            formData.borrowerName.trim();

        const normalizedEmail =
            formData.email.trim();

        const normalizedPhone =
            formData.phoneNumber.trim();

        const normalizedAliasName =
            formData.aliasName
                .trim()
                .replace(/\s+/g, " ");

        if (!normalizedName) {
            errors.borrowerName =
                "Låntagarens namn måste anges.";
        } else if (normalizedName.length < 2) {
            errors.borrowerName =
                "Låntagarens namn måste innehålla minst 2 tecken.";
        } else if (normalizedName.length > 100) {
            errors.borrowerName =
                "Låntagarens namn får innehålla högst 100 tecken.";
        }

        if (!normalizedEmail) {
            errors.email =
                "Låntagarens e-postadress måste anges.";
        } else if (!isValidEmail(normalizedEmail)) {
            errors.email =
                "Ange en giltig e-postadress.";
        } else if (normalizedEmail.length > 150) {
            errors.email =
                "E-postadressen får innehålla högst 150 tecken.";
        }

        if (!normalizedPhone) {
            errors.phoneNumber =
                "Låntagarens telefonnummer måste anges.";
        } else if (normalizedPhone.length < 6) {
            errors.phoneNumber =
                "Telefonnumret måste innehålla minst 6 tecken.";
        } else if (normalizedPhone.length > 30) {
            errors.phoneNumber =
                "Telefonnumret får innehålla högst 30 tecken.";
        }

        if (
            saveAsAlias &&
            !selectedAliasId
        ) {
            if (!normalizedAliasName) {
                errors.aliasName =
                    "Aliasnamn måste anges.";
            } else if (normalizedAliasName.length < 2) {
                errors.aliasName =
                    "Aliasnamnet måste innehålla minst 2 tecken.";
            } else if (normalizedAliasName.length > 100) {
                errors.aliasName =
                    "Aliasnamnet får innehålla högst 100 tecken.";
            }
        }

        if (
            formData.expectedReturnDate &&
            formData.expectedReturnDate <
            minimumReturnDate
        ) {
            errors.expectedReturnDate =
                "Förväntat återlämningsdatum får inte ligga före dagens datum.";
        }

        return errors;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (submissionInProgressRef.current) {
            return;
        }

        setSubmitError("");

        if (!equipment?.active) {
            setSubmitError(
                "Utrustningen är inaktiverad och kan inte lånas."
            );
            return;
        }

        if (!equipment?.available) {
            setSubmitError(
                "Utrustningen är redan utlånad."
            );
            return;
        }

        const validationErrors =
            validateForm();

        if (
            Object.keys(validationErrors).length > 0
        ) {
            setFieldErrors(validationErrors);
            focusFirstInvalidField(
                validationErrors
            );
            return;
        }

        submissionInProgressRef.current = true;

        setSubmitting(true);
        setFieldErrors({});

        try {
            const response = await api.post(
                `/admin/loans/${encodeURIComponent(
                    serialNumber
                )}`,
                {
                    borrowerName:
                        formData.borrowerName.trim(),

                    email:
                        formData.email.trim(),

                    phoneNumber:
                        formData.phoneNumber.trim(),

                    aliasName:
                        saveAsAlias &&
                        !selectedAliasId
                            ? formData.aliasName
                                .trim()
                                .replace(/\s+/g, " ")
                            : null,

                    expectedReturnDate:
                        formData.expectedReturnDate ||
                        null,
                }
            );

            const registeredLoan =
                response.data;

            navigate("/loan/success", {
                replace: true,
                state: {
                    loanId:
                    registeredLoan.id,
                    equipmentType:
                    registeredLoan.equipment.type,
                    serialNumber:
                    registeredLoan.equipment
                        .serialNumber,
                    borrowerName:
                    registeredLoan.borrowerName,
                    loanDate:
                    registeredLoan.loanDate,
                    expectedReturnDate:
                    registeredLoan
                        .expectedReturnDate,
                },
            });
        } catch (error) {
            const apiFieldErrors =
                getFieldErrors(error);

            const duplicateAlias =
                saveAsAlias &&
                hasErrorCode(
                    error,
                    "DUPLICATE_RESOURCE"
                );

            if (
                apiFieldErrors &&
                Object.keys(apiFieldErrors).length > 0
            ) {
                setFieldErrors(apiFieldErrors);
                focusFirstInvalidField(
                    apiFieldErrors
                );
            }

            if (duplicateAlias) {
                const aliasErrors = {
                    aliasName:
                        "Det finns redan ett Alias med det namnet.",
                };

                setFieldErrors((current) => ({
                    ...current,
                    ...aliasErrors,
                }));

                focusFirstInvalidField(
                    aliasErrors
                );
            }

            if (
                hasErrorCode(
                    error,
                    "EQUIPMENT_ALREADY_LOANED"
                ) ||
                hasErrorCode(
                    error,
                    "EQUIPMENT_NOT_AVAILABLE"
                )
            ) {
                setEquipment((current) =>
                    current
                        ? {
                            ...current,
                            available: false,
                        }
                        : current
                );
            }

            if (
                hasErrorCode(
                    error,
                    "EQUIPMENT_INACTIVE"
                )
            ) {
                setEquipment((current) =>
                    current
                        ? {
                            ...current,
                            active: false,
                        }
                        : current
                );
            }

            if (
                (
                    !apiFieldErrors ||
                    Object.keys(
                        apiFieldErrors
                    ).length === 0
                ) &&
                !duplicateAlias
            ) {
                setSubmitError(
                    getErrorMessage(
                        error,
                        "Lånet kunde inte registreras. Försök igen."
                    )
                );
            }
        } finally {
            submissionInProgressRef.current =
                false;

            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <main
                className="mobile-page flex items-center justify-center"
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
                    <div
                        className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-950"
                        aria-hidden="true"
                    />

                    <p className="font-medium text-slate-700">
                        Hämtar utrustning...
                    </p>
                </div>
            </main>
        );
    }

    if (loadError || !equipment) {
        return (
            <main
                className="mobile-page safe-bottom"
                aria-labelledby="equipment-load-error-heading"
            >
                <div className="mx-auto max-w-xl space-y-5">
                    <Alert
                        title={
                            loadError?.unknownEquipment
                                ? "Ogiltig eller okänd QR-kod"
                                : "Utrustningen kunde inte hämtas"
                        }
                        variant="danger"
                    >
                        {loadError?.message ||
                            "Utrustningen kunde inte hittas."}
                    </Alert>

                    <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                        <h1
                            id="equipment-load-error-heading"
                            className="text-xl font-black text-slate-900"
                        >
                            Hur vill du fortsätta?
                        </h1>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                            {!loadError?.unknownEquipment && (
                                <Button
                                    type="button"
                                    onClick={() =>
                                        setLoadAttempt(
                                            (current) =>
                                                current + 1
                                        )
                                    }
                                    fullWidth
                                >
                                    Försök igen
                                </Button>
                            )}

                            <LinkButton
                                to="/scan"
                                variant="outline"
                                fullWidth
                            >
                                Skanna en annan QR-kod
                            </LinkButton>

                            <LinkButton
                                to="/admin"
                                variant="ghost"
                                fullWidth
                            >
                                Till adminvyn
                            </LinkButton>
                        </div>
                    </section>
                </div>
            </main>
        );
    }

    const canBeLoaned =
        equipment.active &&
        equipment.available;

    const contactFieldsDisabled =
        !canBeLoaned ||
        submitting ||
        selectedAliasLoading;

    return (
        <main
            className="mobile-page safe-bottom space-y-6"
            aria-labelledby="loan-form-heading"
        >
            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <Badge variant="hockey">
                    Admin
                </Badge>

                <h1
                    id="loan-form-heading"
                    className="mt-3"
                >
                    Registrera lån
                </h1>

                <p className="mt-2 max-w-2xl text-slate-700">
                    Registreringen får endast
                    genomföras av en utsedd
                    klubbadministratör.
                </p>
            </section>

            <EquipmentStatus
                equipment={equipment}
            />

            {submitError && (
                <div
                    ref={submitErrorRef}
                    tabIndex={-1}
                    className="rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2"
                >
                    <Alert
                        title="Lånet kunde inte registreras"
                        variant="danger"
                    >
                        {submitError}
                    </Alert>
                </div>
            )}

            {Object.keys(fieldErrors).length > 0 && (
                <Alert
                    title="Kontrollera formuläret"
                    variant="danger"
                >
                    Ett eller flera fält behöver
                    rättas innan lånet kan
                    registreras.
                </Alert>
            )}

            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <EquipmentDetails
                    equipment={equipment}
                />

                <form
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-5"
                    noValidate
                    aria-busy={
                        submitting ||
                        selectedAliasLoading
                    }
                >
                    <FormField
                        id="borrowerAlias"
                        label="Välj Alias (valfritt)"
                        helperText={
                            aliases.length === 0 &&
                            !aliasesLoading &&
                            !aliasesError
                                ? "Det finns inga sparade Alias ännu. Fyll i låntagaruppgifterna manuellt."
                                : "Välj ett sparat Alias för att fylla i låntagaruppgifterna automatiskt."
                        }
                    >
                        <select
                            name="borrowerAlias"
                            value={selectedAliasId}
                            onChange={
                                handleAliasSelection
                            }
                            disabled={
                                !canBeLoaned ||
                                submitting ||
                                aliasesLoading
                            }
                            className="mobile-input"
                        >
                            <option value="">
                                {aliasesLoading
                                    ? "Hämtar Alias..."
                                    : "Ingen – fyll i manuellt"}
                            </option>

                            {aliases.map((alias) => (
                                <option
                                    key={alias.id}
                                    value={alias.id}
                                >
                                    {alias.aliasName}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    {aliasesError && (
                        <Alert
                            title="Alias kunde inte hämtas"
                            variant="warning"
                        >
                            {aliasesError}
                        </Alert>
                    )}

                    {selectedAliasError && (
                        <Alert
                            title="Aliaset kunde inte hämtas"
                            variant="warning"
                        >
                            {selectedAliasError}
                        </Alert>
                    )}

                    {selectedAliasLoading && (
                        <p
                            className="text-sm font-medium text-slate-600"
                            role="status"
                            aria-live="polite"
                        >
                            Hämtar uppgifter för valt Alias...
                        </p>
                    )}

                    <FormField
                        id="borrowerName"
                        label="Låntagarens namn"
                        required
                        error={
                            fieldErrors.borrowerName
                        }
                    >
                        <input
                            name="borrowerName"
                            type="text"
                            value={
                                formData.borrowerName
                            }
                            onChange={handleChange}
                            minLength={2}
                            maxLength={100}
                            disabled={
                                contactFieldsDisabled
                            }
                            autoComplete="name"
                            className="mobile-input"
                        />
                    </FormField>

                    {!selectedAliasId && (
                        <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
                            <label
                                htmlFor="saveAsAlias"
                                className="flex cursor-pointer items-start gap-3 text-sm font-bold text-slate-800"
                            >
                                <input
                                    id="saveAsAlias"
                                    name="saveAsAlias"
                                    type="checkbox"
                                    checked={saveAsAlias}
                                    onChange={
                                        handleSaveAsAliasChange
                                    }
                                    disabled={
                                        !canBeLoaned ||
                                        submitting
                                    }
                                    className="mt-0.5 h-5 w-5 rounded border-slate-300 text-blue-950 focus:ring-2 focus:ring-blue-950 focus:ring-offset-2"
                                />

                                <span>
                                    Spara som Alias
                                </span>
                            </label>

                            {saveAsAlias && (
                                <FormField
                                    id="aliasName"
                                    label="Aliasnamn"
                                    required
                                    error={
                                        fieldErrors.aliasName
                                    }
                                    helperText="Aliasnamnet används för att snabbt hitta låntagaren vid framtida utlåningar."
                                >
                                    <input
                                        name="aliasName"
                                        type="text"
                                        value={
                                            formData.aliasName
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        minLength={2}
                                        maxLength={100}
                                        disabled={
                                            !canBeLoaned ||
                                            submitting
                                        }
                                        autoComplete="off"
                                        className="mobile-input"
                                    />
                                </FormField>
                            )}
                        </div>
                    )}

                    {selectedAliasId &&
                        !selectedAliasLoading && (
                            <p className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-950">
                                Uppgifterna har fyllts i från valt Alias.
                                Manuella ändringar nedan gäller endast detta
                                lån och ändrar inte det sparade Aliaset.
                            </p>
                        )}

                    <FormField
                        id="email"
                        label="Låntagarens e-post"
                        required
                        error={fieldErrors.email}
                    >
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            maxLength={150}
                            disabled={
                                contactFieldsDisabled
                            }
                            autoComplete="email"
                            inputMode="email"
                            className="mobile-input"
                        />
                    </FormField>

                    <FormField
                        id="phoneNumber"
                        label="Låntagarens telefonnummer"
                        required
                        error={
                            fieldErrors.phoneNumber
                        }
                    >
                        <input
                            name="phoneNumber"
                            type="tel"
                            value={
                                formData.phoneNumber
                            }
                            onChange={handleChange}
                            minLength={6}
                            maxLength={30}
                            disabled={
                                contactFieldsDisabled
                            }
                            autoComplete="tel"
                            inputMode="tel"
                            className="mobile-input"
                        />
                    </FormField>

                    <FormField
                        id="expectedReturnDate"
                        label="Förväntat återlämningsdatum"
                        error={
                            fieldErrors
                                .expectedReturnDate
                        }
                        helperText="Valfritt. Välj datum om klubben och låntagaren har kommit överens om en förväntad återlämning. Det finns ingen maximal lånetid."
                    >
                        <input
                            name="expectedReturnDate"
                            type="date"
                            value={
                                formData
                                    .expectedReturnDate
                            }
                            onChange={handleChange}
                            min={
                                minimumReturnDate
                            }
                            disabled={
                                !canBeLoaned ||
                                submitting
                            }
                            className="mobile-input"
                        />
                    </FormField>

                    <Button
                        type="submit"
                        size="lg"
                        fullWidth
                        disabled={
                            !canBeLoaned ||
                            selectedAliasLoading
                        }
                        loading={submitting}
                        loadingText="Registrerar lån..."
                    >
                        {getSubmitText(equipment)}
                    </Button>
                </form>
            </section>
        </main>
    );
}

function EquipmentStatus({ equipment }) {
    if (!equipment.active) {
        return (
            <Alert
                title="Inaktiverad"
                variant="danger"
            >
                Utrustningen är inaktiverad och
                kan inte lånas.
            </Alert>
        );
    }

    if (!equipment.available) {
        return (
            <Alert
                title="Redan utlånad"
                variant="warning"
            >
                Utrustningen måste återlämnas
                innan ett nytt lån kan
                registreras.
            </Alert>
        );
    }

    return (
        <Alert
            title="Tillgänglig"
            variant="success"
        >
            Utrustningen kan registreras som
            utlånad.
        </Alert>
    );
}

function EquipmentDetails({ equipment }) {
    const rows = [
        {
            label: "Typ",
            value:
                typeLabels[equipment.type] ||
                equipment.type,
        },
        {
            label: "Serienummer",
            value: equipment.serialNumber,
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
                    ] || equipment.condition,
        },
        {
            label: "Ålderskategori",
            value:
                ageCategoryLabels[
                    equipment.ageCategory
                    ] || equipment.ageCategory,
        },
        {
            label: "Förvaringsplats",
            value:
            equipment.storageLocation,
        },
    ].filter((row) => row.value);

    return (
        <div>
            <h2>Utrustning</h2>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {rows.map((row) => (
                    <div
                        key={row.label}
                        className="rounded-2xl bg-slate-50 p-3"
                    >
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-600">
                            {row.label}
                        </dt>

                        <dd className="mt-1 break-words font-semibold text-slate-900">
                            {row.value}
                        </dd>
                    </div>
                ))}
            </dl>

            {equipment.description && (
                <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        Beskrivning
                    </p>

                    <p className="mt-1 break-words text-slate-800">
                        {equipment.description}
                    </p>
                </div>
            )}
        </div>
    );
}

function getSubmitText(equipment) {
    if (!equipment.active) {
        return "Utrustningen är inaktiverad";
    }

    if (!equipment.available) {
        return "Utrustningen är redan utlånad";
    }

    return "Registrera lån";
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        value
    );
}

function formatLocalDateInput(date) {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}