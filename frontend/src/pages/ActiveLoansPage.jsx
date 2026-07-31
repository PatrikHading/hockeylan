import {
    useEffect,
    useRef,
    useState,
} from "react";
import api, {
    getErrorMessage,
    hasErrorCode,
} from "../api/api";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import FormField from "../components/ui/FormField";

const INITIAL_FILTERS = {
    status: "ALL",
    from: "",
    to: "",
    serialNumber: "",
    equipmentType: "",
    borrower: "",
};

const EQUIPMENT_TYPES = [
    {
        value: "COMPLETE_KIT",
        label: "Komplett utrustning",
    },
    {
        value: "HELMET",
        label: "Hjälm",
    },
    {
        value: "SKATES",
        label: "Skridskor",
    },
    {
        value: "STICK",
        label: "Klubba",
    },
];

const equipmentTypeLabels =
    Object.fromEntries(
        EQUIPMENT_TYPES.map(
            (type) => [
                type.value,
                type.label,
            ]
        )
    );

function ActiveLoansPage() {
    const [pageData, setPageData] =
        useState(createEmptyPage());

    const [filters, setFilters] =
        useState({
            ...INITIAL_FILTERS,
        });

    const [
        appliedFilters,
        setAppliedFilters,
    ] = useState({
        ...INITIAL_FILTERS,
    });

    const [page, setPage] =
        useState(0);

    const [loading, setLoading] =
        useState(true);

    const [loadAttempt, setLoadAttempt] =
        useState(0);

    const [returning, setReturning] =
        useState(false);

    const [loadError, setLoadError] =
        useState("");

    const [filterError, setFilterError] =
        useState("");

    const [actionError, setActionError] =
        useState("");

    const [
        successMessage,
        setSuccessMessage,
    ] = useState("");

    const [
        selectedLoan,
        setSelectedLoan,
    ] = useState(null);

    const returnInProgressRef =
        useRef(false);

    const actionErrorRef =
        useRef(null);

    useEffect(() => {
        const controller =
            new AbortController();

        let activeRequest = true;

        async function fetchLoanHistory() {
            setLoading(true);
            setLoadError("");

            const params =
                createRequestParameters(
                    appliedFilters,
                    page
                );

            try {
                const response =
                    await api.get(
                        "/admin/loans",
                        {
                            params,
                            signal:
                            controller.signal,
                        }
                    );

                if (activeRequest) {
                    setPageData(
                        normalizePageData(
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

                setLoadError(
                    getErrorMessage(
                        error,
                        "Kunde inte hämta lånehistoriken. Försök igen."
                    )
                );
            } finally {
                if (activeRequest) {
                    setLoading(false);
                }
            }
        }

        void fetchLoanHistory();

        return () => {
            activeRequest = false;
            controller.abort();
        };
    }, [
        appliedFilters,
        loadAttempt,
        page,
    ]);

    useEffect(() => {
        if (actionError) {
            actionErrorRef.current?.focus();
        }
    }, [actionError]);

    function updateFilter(event) {
        const { name, value } =
            event.target;

        setFilters((current) => ({
            ...current,
            [name]: value,
        }));

        if (
            name === "from" ||
            name === "to"
        ) {
            setFilterError("");
        }
    }

    function applyFilters(event) {
        event.preventDefault();

        if (
            filters.from &&
            filters.to &&
            filters.from > filters.to
        ) {
            setFilterError(
                "Från-datum får inte ligga efter till-datum."
            );

            window.requestAnimationFrame(
                () => {
                    document
                        .getElementById(
                            "history-from"
                        )
                        ?.focus();
                }
            );

            return;
        }

        setFilterError("");
        setActionError("");
        setSuccessMessage("");
        setPage(0);

        setAppliedFilters(
            normalizeFilters(filters)
        );
    }

    function clearFilters() {
        setFilters({
            ...INITIAL_FILTERS,
        });

        setAppliedFilters({
            ...INITIAL_FILTERS,
        });

        setPage(0);
        setFilterError("");
        setActionError("");
        setSuccessMessage("");
    }

    function openReturnDialog(loan) {
        if (returning) {
            return;
        }

        setActionError("");
        setSuccessMessage("");
        setSelectedLoan(loan);
    }

    async function handleReturned() {
        if (
            !selectedLoan ||
            returnInProgressRef.current
        ) {
            return;
        }

        returnInProgressRef.current =
            true;

        setReturning(true);
        setActionError("");
        setSuccessMessage("");

        const loanBeingReturned =
            selectedLoan;

        try {
            const response =
                await api.put(
                    `/admin/loans/${encodeURIComponent(
                        loanBeingReturned.id
                    )}/returned`,
                    {}
                );

            setPageData((current) =>
                updatePageAfterReturn(
                    current,
                    response.data,
                    appliedFilters.status
                )
            );

            setSelectedLoan(null);

            setSuccessMessage(
                `${loanBeingReturned.equipment.serialNumber} är markerad som återlämnad.`
            );
        } catch (error) {
            setSelectedLoan(null);

            setActionError(
                getErrorMessage(
                    error,
                    "Kunde inte markera lånet som återlämnat. Försök igen."
                )
            );

            if (
                hasErrorCode(
                    error,
                    "LOAN_ALREADY_RETURNED"
                )
            ) {
                setLoadAttempt(
                    (current) =>
                        current + 1
                );
            }
        } finally {
            returnInProgressRef.current =
                false;

            setReturning(false);
        }
    }

    return (
        <main
            className="mobile-page safe-bottom space-y-6"
            aria-labelledby="loan-history-heading"
        >
            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <Badge variant="hockey">
                    Admin
                </Badge>

                <h1
                    id="loan-history-heading"
                    className="mt-3"
                >
                    Lånehistorik
                </h1>

                <p className="mt-2 max-w-2xl text-slate-700">
                    Visa aktiva, försenade
                    och avslutade lån.
                    Personuppgifterna visas
                    endast för inloggade
                    administratörer.
                </p>
            </section>

            {actionError && (
                <div
                    ref={actionErrorRef}
                    tabIndex={-1}
                    className="rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2"
                >
                    <Alert
                        title="Åtgärden misslyckades"
                        variant="danger"
                    >
                        {actionError}
                    </Alert>
                </div>
            )}

            {successMessage && (
                <Alert
                    title="Klart"
                    variant="success"
                >
                    {successMessage}
                </Alert>
            )}

            <FilterForm
                filters={filters}
                filterError={
                    filterError
                }
                disabled={returning}
                onChange={updateFilter}
                onSubmit={applyFilters}
                onClear={clearFilters}
            />

            <section
                className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6"
                aria-busy={loading}
            >
                {!loading &&
                    !loadError && (
                        <p
                            className="mb-4 text-sm font-semibold text-slate-700"
                            role="status"
                            aria-live="polite"
                        >
                            {
                                pageData.totalElements
                            }{" "}
                            lån hittades
                        </p>
                    )}

                {loading ? (
                    <LoadingState />
                ) : loadError ? (
                    <LoadErrorState
                        message={
                            loadError
                        }
                        onRetry={() =>
                            setLoadAttempt(
                                (current) =>
                                    current +
                                    1
                            )
                        }
                    />
                ) : pageData.content
                    .length === 0 ? (
                    <EmptyState
                        hasFilters={
                            hasFilters(
                                appliedFilters
                            )
                        }
                    />
                ) : (
                    <div className="grid gap-4">
                        {pageData.content.map(
                            (loan) => (
                                <LoanCard
                                    key={
                                        loan.id
                                    }
                                    loan={
                                        loan
                                    }
                                    actionDisabled={
                                        returning
                                    }
                                    onReturn={
                                        openReturnDialog
                                    }
                                />
                            )
                        )}
                    </div>
                )}

                {!loading &&
                    !loadError &&
                    pageData.totalPages >
                    1 && (
                        <Pagination
                            pageData={
                                pageData
                            }
                            disabled={
                                returning
                            }
                            setPage={
                                setPage
                            }
                        />
                    )}
            </section>

            <ConfirmDialog
                open={Boolean(
                    selectedLoan
                )}
                title="Markera som återlämnad?"
                message={
                    selectedLoan
                        ? `Vill du markera ${selectedLoan.equipment.serialNumber} som återlämnad?`
                        : ""
                }
                confirmText="Ja, markera återlämnad"
                cancelText="Avbryt"
                loading={returning}
                variant="secondary"
                onConfirm={
                    handleReturned
                }
                onCancel={() =>
                    setSelectedLoan(null)
                }
            />
        </main>
    );
}

function FilterForm({
                        filters,
                        filterError,
                        disabled,
                        onChange,
                        onSubmit,
                        onClear,
                    }) {
    return (
        <section
            className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6"
            aria-labelledby="history-filter-heading"
        >
            <h2
                id="history-filter-heading"
                className="mb-4"
            >
                Filtrera lånehistorik
            </h2>

            {filterError && (
                <div className="mb-4">
                    <Alert
                        title="Kontrollera datumen"
                        variant="danger"
                    >
                        {filterError}
                    </Alert>
                </div>
            )}

            <form
                onSubmit={onSubmit}
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                noValidate
            >
                <FormField
                    id="history-status"
                    label="Status"
                >
                    <select
                        name="status"
                        value={
                            filters.status
                        }
                        onChange={
                            onChange
                        }
                        disabled={
                            disabled
                        }
                        className="mobile-input"
                    >
                        <option value="ALL">
                            Alla lån
                        </option>

                        <option value="ACTIVE">
                            Aktiva
                        </option>

                        <option value="OVERDUE">
                            Försenade
                        </option>

                        <option value="RETURNED">
                            Återlämnade
                        </option>
                    </select>
                </FormField>

                <FormField
                    id="history-from"
                    label="Från lånedatum"
                    error={
                        filterError ||
                        undefined
                    }
                >
                    <input
                        name="from"
                        type="date"
                        value={
                            filters.from
                        }
                        onChange={
                            onChange
                        }
                        disabled={
                            disabled
                        }
                        className="mobile-input"
                    />
                </FormField>

                <FormField
                    id="history-to"
                    label="Till lånedatum"
                    error={
                        filterError ||
                        undefined
                    }
                >
                    <input
                        name="to"
                        type="date"
                        value={filters.to}
                        onChange={
                            onChange
                        }
                        disabled={
                            disabled
                        }
                        className="mobile-input"
                    />
                </FormField>

                <FormField
                    id="history-serial-number"
                    label="Serienummer"
                >
                    <input
                        name="serialNumber"
                        value={
                            filters.serialNumber
                        }
                        onChange={
                            onChange
                        }
                        maxLength={50}
                        autoCapitalize="characters"
                        spellCheck="false"
                        disabled={
                            disabled
                        }
                        className="mobile-input"
                    />
                </FormField>

                <FormField
                    id="history-equipment-type"
                    label="Utrustningstyp"
                >
                    <select
                        name="equipmentType"
                        value={
                            filters
                                .equipmentType
                        }
                        onChange={
                            onChange
                        }
                        disabled={
                            disabled
                        }
                        className="mobile-input"
                    >
                        <option value="">
                            Alla typer
                        </option>

                        {EQUIPMENT_TYPES.map(
                            (type) => (
                                <option
                                    key={
                                        type.value
                                    }
                                    value={
                                        type.value
                                    }
                                >
                                    {
                                        type.label
                                    }
                                </option>
                            )
                        )}
                    </select>
                </FormField>

                <FormField
                    id="history-borrower"
                    label="Låntagare"
                >
                    <input
                        name="borrower"
                        value={
                            filters.borrower
                        }
                        onChange={
                            onChange
                        }
                        maxLength={100}
                        autoComplete="off"
                        disabled={
                            disabled
                        }
                        className="mobile-input"
                    />
                </FormField>

                <div className="flex flex-col gap-2 md:col-span-2 sm:flex-row lg:col-span-3">
                    <Button
                        type="submit"
                        disabled={
                            disabled
                        }
                    >
                        Använd filter
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        disabled={
                            disabled
                        }
                        onClick={
                            onClear
                        }
                    >
                        Rensa filter
                    </Button>
                </div>
            </form>
        </section>
    );
}

function LoanCard({
                      loan,
                      actionDisabled,
                      onReturn,
                  }) {
    const status =
        getLoanStatus(loan);

    return (
        <article
            className={[
                "rounded-2xl border p-4",
                loan.overdue
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200 bg-slate-50",
            ].join(" ")}
            aria-labelledby={
                `loan-${loan.id}-heading`
            }
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2
                        id={
                            `loan-${loan.id}-heading`
                        }
                    >
                        {
                            loan.borrowerName
                        }
                    </h2>

                    <p className="mt-1 break-all font-mono text-sm text-slate-700">
                        {
                            loan.equipment
                                .serialNumber
                        }
                    </p>
                </div>

                <Badge
                    variant={
                        status.variant
                    }
                >
                    {status.label}
                </Badge>
            </div>

            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
                <LoanDetail
                    label="Kontakt"
                    value={
                        <div>
                            <a
                                href={
                                    `mailto:${loan.email}`
                                }
                                className="block break-all text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-950 focus:ring-offset-2"
                            >
                                {
                                    loan.email
                                }
                            </a>

                            <a
                                href={
                                    `tel:${loan.phoneNumber}`
                                }
                                className="block underline focus:outline-none focus:ring-2 focus:ring-blue-950 focus:ring-offset-2"
                            >
                                {
                                    loan.phoneNumber
                                }
                            </a>
                        </div>
                    }
                />

                <LoanDetail
                    label="Utrustning"
                    value={
                        <>
                            {equipmentTypeLabels[
                                    loan
                                        .equipment
                                        .type
                                    ] ||
                                loan
                                    .equipment
                                    .type}

                            {loan.equipment
                                .description
                                ? ` – ${loan.equipment.description}`
                                : ""}
                        </>
                    }
                />

                <LoanDetail
                    label="Lånedatum"
                    value={formatDateTime(
                        loan.loanDate
                    )}
                />

                <LoanDetail
                    label="Förväntad återlämning"
                    value={formatDate(
                        loan.expectedReturnDate
                    )}
                    danger={
                        loan.overdue
                    }
                />

                <LoanDetail
                    label="Återlämnad"
                    value={formatDateTime(
                        loan.returnedAt
                    )}
                />
            </dl>

            {!loan.returned && (
                <div className="mt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={
                            actionDisabled
                        }
                        onClick={() =>
                            onReturn(loan)
                        }
                    >
                        Markera som återlämnad
                    </Button>
                </div>
            )}
        </article>
    );
}

function LoanDetail({
                        label,
                        value,
                        danger = false,
                    }) {
    return (
        <div>
            <dt className="font-bold text-slate-800">
                {label}
            </dt>

            <dd
                className={
                    danger
                        ? "font-bold text-red-700"
                        : "text-slate-900"
                }
            >
                {value}
            </dd>
        </div>
    );
}

function LoadingState() {
    return (
        <div
            className="grid gap-3"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <span className="sr-only">
                Laddar lånehistorik...
            </span>

            {[1, 2, 3].map(
                (item) => (
                    <div
                        key={item}
                        className="h-28 animate-pulse rounded-2xl bg-slate-100"
                        aria-hidden="true"
                    />
                )
            )}
        </div>
    );
}

function LoadErrorState({
                            message,
                            onRetry,
                        }) {
    return (
        <div className="space-y-4">
            <Alert
                title="Lånehistoriken kunde inte hämtas"
                variant="danger"
            >
                {message}
            </Alert>

            <Button
                type="button"
                onClick={onRetry}
            >
                Försök igen
            </Button>
        </div>
    );
}

function EmptyState({
                        hasFilters: filtersApplied,
                    }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <h2>
                Inga lån hittades
            </h2>

            <p className="mt-2 text-sm text-slate-700">
                {filtersApplied
                    ? "Ändra filtreringen eller rensa filtren."
                    : "Det finns ännu inga registrerade lån."}
            </p>
        </div>
    );
}

function Pagination({
                        pageData,
                        disabled,
                        setPage,
                    }) {
    return (
        <nav
            aria-label="Sidindelning"
            className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row"
        >
            <Button
                type="button"
                variant="outline"
                disabled={
                    disabled ||
                    pageData.first
                }
                onClick={() =>
                    setPage((current) =>
                        Math.max(
                            0,
                            current - 1
                        )
                    )
                }
            >
                Föregående
            </Button>

            <p
                className="text-sm font-bold text-slate-800"
                aria-live="polite"
            >
                Sida{" "}
                {pageData.page + 1} av{" "}
                {pageData.totalPages}
            </p>

            <Button
                type="button"
                variant="outline"
                disabled={
                    disabled ||
                    pageData.last
                }
                onClick={() =>
                    setPage(
                        (current) =>
                            current + 1
                    )
                }
            >
                Nästa
            </Button>
        </nav>
    );
}

function createRequestParameters(
    appliedFilters,
    page
) {
    const params = {
        status:
        appliedFilters.status,
        page,
        size: 20,
    };

    Object.entries(
        appliedFilters
    ).forEach(([key, value]) => {
        if (
            key === "status" ||
            !value
        ) {
            return;
        }

        params[key] =
            typeof value === "string"
                ? value.trim()
                : value;
    });

    return params;
}

function normalizeFilters(filters) {
    return {
        status: filters.status,
        from: filters.from,
        to: filters.to,
        serialNumber:
            filters.serialNumber.trim(),
        equipmentType:
        filters.equipmentType,
        borrower:
            filters.borrower.trim(),
    };
}

function normalizePageData(value) {
    if (
        !value ||
        !Array.isArray(
            value.content
        )
    ) {
        return createEmptyPage();
    }

    return {
        ...createEmptyPage(),
        ...value,
        content: value.content,
    };
}

function updatePageAfterReturn(
    current,
    returnedLoan,
    appliedStatus
) {
    if (
        appliedStatus === "ACTIVE" ||
        appliedStatus === "OVERDUE"
    ) {
        const content =
            current.content.filter(
                (loan) =>
                    loan.id !==
                    returnedLoan.id
            );

        return {
            ...current,
            content,
            totalElements:
                Math.max(
                    0,
                    current.totalElements -
                    1
                ),
        };
    }

    return {
        ...current,
        content:
            current.content.map(
                (loan) =>
                    loan.id ===
                    returnedLoan.id
                        ? returnedLoan
                        : loan
            ),
    };
}

function hasFilters(filters) {
    return (
        filters.status !== "ALL" ||
        Boolean(filters.from) ||
        Boolean(filters.to) ||
        Boolean(
            filters.serialNumber
        ) ||
        Boolean(
            filters.equipmentType
        ) ||
        Boolean(filters.borrower)
    );
}

function getLoanStatus(loan) {
    if (loan.returnedLate) {
        return {
            label:
                "Återlämnat sent",
            variant: "warning",
        };
    }

    if (loan.returned) {
        return {
            label: "Återlämnat",
            variant: "success",
        };
    }

    if (loan.overdue) {
        return {
            label: "Försenat",
            variant: "danger",
        };
    }

    return {
        label: "Aktivt",
        variant: "info",
    };
}

function formatDate(value) {
    if (!value) {
        return "–";
    }

    return new Intl.DateTimeFormat(
        "sv-SE",
        {
            dateStyle: "medium",
            timeZone: "UTC",
        }
    ).format(
        new Date(
            `${value}T00:00:00Z`
        )
    );
}

function formatDateTime(value) {
    if (!value) {
        return "–";
    }

    return new Intl.DateTimeFormat(
        "sv-SE",
        {
            dateStyle: "medium",
            timeStyle: "short",
        }
    ).format(
        new Date(value)
    );
}

function createEmptyPage() {
    return {
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
    };
}

export default ActiveLoansPage;