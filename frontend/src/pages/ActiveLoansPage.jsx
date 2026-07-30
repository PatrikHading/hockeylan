import {
    useEffect,
    useState,
} from "react";
import api from "../api/api";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";

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

function ActiveLoansPage() {
    const [pageData, setPageData] =
        useState(createEmptyPage());

    const [filters, setFilters] =
        useState(INITIAL_FILTERS);

    const [
        appliedFilters,
        setAppliedFilters,
    ] = useState(INITIAL_FILTERS);

    const [page, setPage] =
        useState(0);

    const [loading, setLoading] =
        useState(true);

    const [returning, setReturning] =
        useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const [
        successMessage,
        setSuccessMessage,
    ] = useState("");

    const [
        selectedLoan,
        setSelectedLoan,
    ] = useState(null);

    useEffect(() => {
        let active = true;

        async function fetchLoanHistory() {
            try {
                setLoading(true);

                const params = {
                    status:
                    appliedFilters.status,
                    page,
                    size: 20,
                };

                Object.entries(
                    appliedFilters
                ).forEach(
                    ([key, value]) => {
                        if (
                            key !== "status"
                            && value
                        ) {
                            params[key] =
                                value;
                        }
                    }
                );

                const response =
                    await api.get(
                        "/admin/loans",
                        { params }
                    );

                if (active) {
                    setPageData(
                        response.data
                    );
                    setErrorMessage("");
                }
            } catch (error) {
                if (!active) {
                    return;
                }

                if (
                    error.response?.status
                    === 403
                ) {
                    setErrorMessage(
                        "Du saknar behörighet att visa lånehistoriken."
                    );
                } else if (
                    error.response?.status
                    !== 401
                ) {
                    setErrorMessage(
                        error.displayMessage
                        || "Kunde inte hämta lånehistoriken."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        fetchLoanHistory();

        return () => {
            active = false;
        };
    }, [appliedFilters, page]);

    function updateFilter(event) {
        const { name, value } =
            event.target;

        setFilters((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function applyFilters(event) {
        event.preventDefault();

        if (
            filters.from
            && filters.to
            && filters.from
            > filters.to
        ) {
            setErrorMessage(
                "Från-datum får inte ligga efter till-datum."
            );

            return;
        }

        setErrorMessage("");
        setSuccessMessage("");
        setPage(0);
        setAppliedFilters(filters);
    }

    function clearFilters() {
        setFilters(INITIAL_FILTERS);
        setAppliedFilters(
            INITIAL_FILTERS
        );
        setPage(0);
        setErrorMessage("");
        setSuccessMessage("");
    }

    async function handleReturned() {
        if (!selectedLoan) {
            return;
        }

        try {
            setReturning(true);
            setErrorMessage("");
            setSuccessMessage("");

            const response =
                await api.put(
                    `/admin/loans/${selectedLoan.id}/returned`,
                    {}
                );

            setPageData((current) => ({
                ...current,
                content:
                    current.content.map(
                        (loan) =>
                            loan.id
                            === selectedLoan.id
                                ? response.data
                                : loan
                    ),
            }));

            setSuccessMessage(
                `${selectedLoan.equipment.serialNumber} är markerad som återlämnad.`
            );

            setSelectedLoan(null);
        } catch (error) {
            if (
                error.response?.status
                === 403
            ) {
                setErrorMessage(
                    "Du saknar behörighet att registrera återlämningen."
                );
            } else if (
                error.response?.status
                !== 401
            ) {
                setErrorMessage(
                    error.displayMessage
                    || "Kunde inte markera lånet som återlämnat."
                );
            }
        } finally {
            setReturning(false);
        }
    }

    return (
        <div className="mobile-page safe-bottom space-y-6">
            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <Badge variant="hockey">
                    Admin
                </Badge>

                <h1 className="mt-3">
                    Lånehistorik
                </h1>

                <p className="mt-2 max-w-2xl">
                    Visa aktiva, försenade
                    och avslutade lån.
                    Personuppgifterna visas
                    endast för inloggade
                    administratörer.
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
                onChange={updateFilter}
                onSubmit={applyFilters}
                onClear={clearFilters}
            />

            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                {!loading && (
                    <p
                        className="mb-4 text-sm font-semibold text-slate-600"
                        aria-live="polite"
                    >
                        {pageData.totalElements} lån
                        hittades
                    </p>
                )}

                {loading ? (
                    <LoadingState />
                ) : pageData
                    .content
                    .length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="grid gap-4">
                        {pageData.content.map(
                            (loan) => (
                                <LoanCard
                                    key={loan.id}
                                    loan={loan}
                                    onReturn={
                                        setSelectedLoan
                                    }
                                />
                            )
                        )}
                    </div>
                )}

                {!loading
                    && pageData.totalPages
                    > 1 && (
                        <Pagination
                            pageData={
                                pageData
                            }
                            setPage={setPage}
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
                onConfirm={handleReturned}
                onCancel={() =>
                    setSelectedLoan(null)
                }
            />
        </div>
    );
}

function FilterForm({
                        filters,
                        onChange,
                        onSubmit,
                        onClear,
                    }) {
    return (
        <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
            <form
                onSubmit={onSubmit}
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
                <label className="text-sm font-bold text-slate-700">
                    Status

                    <select
                        name="status"
                        value={filters.status}
                        onChange={onChange}
                        className="mobile-input mt-2"
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
                </label>

                <label className="text-sm font-bold text-slate-700">
                    Från lånedatum

                    <input
                        name="from"
                        type="date"
                        value={filters.from}
                        onChange={onChange}
                        className="mobile-input mt-2"
                    />
                </label>

                <label className="text-sm font-bold text-slate-700">
                    Till lånedatum

                    <input
                        name="to"
                        type="date"
                        value={filters.to}
                        onChange={onChange}
                        className="mobile-input mt-2"
                    />
                </label>

                <label className="text-sm font-bold text-slate-700">
                    Serienummer

                    <input
                        name="serialNumber"
                        value={
                            filters.serialNumber
                        }
                        onChange={onChange}
                        maxLength={100}
                        className="mobile-input mt-2"
                    />
                </label>

                <label className="text-sm font-bold text-slate-700">
                    Utrustningstyp

                    <select
                        name="equipmentType"
                        value={
                            filters
                                .equipmentType
                        }
                        onChange={onChange}
                        className="mobile-input mt-2"
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
                                    {type.label}
                                </option>
                            )
                        )}
                    </select>
                </label>

                <label className="text-sm font-bold text-slate-700">
                    Låntagare

                    <input
                        name="borrower"
                        value={filters.borrower}
                        onChange={onChange}
                        maxLength={100}
                        className="mobile-input mt-2"
                    />
                </label>

                <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-3 sm:flex-row">
                    <Button type="submit">
                        Använd filter
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClear}
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
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2>
                        {loan.borrowerName}
                    </h2>

                    <p className="mt-1 font-mono text-sm text-slate-600">
                        {
                            loan.equipment
                                .serialNumber
                        }
                    </p>
                </div>

                <Badge
                    variant={status.variant}
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
                                href={`mailto:${loan.email}`}
                                className="block text-blue-800 underline"
                            >
                                {loan.email}
                            </a>

                            <a
                                href={`tel:${loan.phoneNumber}`}
                                className="block underline"
                            >
                                {loan.phoneNumber}
                            </a>
                        </div>
                    }
                />

                <LoanDetail
                    label="Utrustning"
                    value={
                        <>
                            {
                                loan.equipment
                                    .type
                            }

                            {loan.equipment
                                .description
                                ? ` – ${loan.equipment.description}`
                                : ""}
                        </>
                    }
                />

                <LoanDetail
                    label="Lånedatum"
                    value={
                        formatDateTime(
                            loan.loanDate
                        )
                    }
                />

                <LoanDetail
                    label="Förväntad återlämning"
                    value={
                        formatDate(
                            loan.expectedReturnDate
                        )
                    }
                    danger={loan.overdue}
                />

                <LoanDetail
                    label="Återlämnad"
                    value={
                        formatDateTime(
                            loan.returnedAt
                        )
                    }
                />
            </dl>

            {!loan.returned && (
                <div className="mt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
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
            <dt className="font-bold text-slate-700">
                {label}
            </dt>

            <dd
                className={
                    danger
                        ? "font-bold text-red-700"
                        : ""
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
            aria-label="Laddar lånehistorik"
        >
            <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        </div>
    );
}

function EmptyState() {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <h2>
                Inga lån hittades
            </h2>

            <p className="mt-2 text-sm text-slate-600">
                Ändra filtreringen eller
                kontrollera att lån har
                registrerats.
            </p>
        </div>
    );
}

function Pagination({
                        pageData,
                        setPage,
                    }) {
    return (
        <nav
            aria-label="Sidindelning"
            className="mt-6 flex items-center justify-between gap-4"
        >
            <Button
                type="button"
                variant="outline"
                disabled={pageData.first}
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

            <p className="text-sm font-bold text-slate-700">
                Sida {pageData.page + 1} av{" "}
                {pageData.totalPages}
            </p>

            <Button
                type="button"
                variant="outline"
                disabled={pageData.last}
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

function getLoanStatus(loan) {
    if (loan.returnedLate) {
        return {
            label: "Återlämnat sent",
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
        new Date(`${value}T00:00:00Z`)
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