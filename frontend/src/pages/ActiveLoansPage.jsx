import { useEffect, useState } from "react";
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
    "COMPLETE_KIT",
    "HELMET",
    "SKATES",
    "STICK",
];

function ActiveLoansPage() {
    const [pageData, setPageData] = useState({
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
    });

    const [filters, setFilters] =
        useState(INITIAL_FILTERS);

    const [appliedFilters, setAppliedFilters] =
        useState(INITIAL_FILTERS);

    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [returning, setReturning] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] =
        useState("");
    const [selectedLoan, setSelectedLoan] =
        useState(null);

    useEffect(() => {
        let active = true;

        async function fetchLoanHistory() {
            try {
                setLoading(true);

                const params = {
                    status: appliedFilters.status,
                    page,
                    size: 20,
                };

                Object.entries(appliedFilters).forEach(
                    ([key, value]) => {
                        if (key !== "status" && value) {
                            params[key] = value;
                        }
                    }
                );

                const response = await api.get(
                    "/admin/loans",
                    { params }
                );

                if (active) {
                    setPageData(response.data);
                    setErrorMessage("");
                }
            } catch (error) {
                if (!active) {
                    return;
                }

                if (error.response?.status === 403) {
                    setErrorMessage(
                        "Du saknar behörighet att visa lånehistoriken."
                    );
                } else if (
                    error.response?.status !== 401
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
        const { name, value } = event.target;

        setFilters((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function applyFilters(event) {
        event.preventDefault();

        setSuccessMessage("");
        setPage(0);
        setAppliedFilters(filters);
    }

    function clearFilters() {
        setFilters(INITIAL_FILTERS);
        setAppliedFilters(INITIAL_FILTERS);
        setPage(0);
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

            const response = await api.put(
                `/admin/loans/${selectedLoan.id}/returned`,
                {}
            );

            setPageData((current) => ({
                ...current,
                content: current.content.map((loan) =>
                    loan.id === selectedLoan.id
                        ? response.data
                        : loan
                ),
            }));

            setSuccessMessage(
                `${selectedLoan.equipment.serialNumber} är markerad som återlämnad.`
            );

            setSelectedLoan(null);
        } catch (error) {
            if (error.response?.status === 403) {
                setErrorMessage(
                    "Du saknar behörighet att registrera återlämningen."
                );
            } else if (
                error.response?.status !== 401
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

    function formatDate(value) {
        if (!value) {
            return "–";
        }

        return new Intl.DateTimeFormat("sv-SE", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
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
                    Visa och filtrera både aktiva och
                    avslutade lån. Personuppgifterna visas
                    endast för inloggade administratörer.
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

            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <form
                    onSubmit={applyFilters}
                    className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                    <label className="text-sm font-bold text-slate-700">
                        Status

                        <select
                            name="status"
                            value={filters.status}
                            onChange={updateFilter}
                            className="mobile-input mt-2"
                        >
                            <option value="ALL">
                                Alla lån
                            </option>

                            <option value="ACTIVE">
                                Aktiva
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
                            onChange={updateFilter}
                            className="mobile-input mt-2"
                        />
                    </label>

                    <label className="text-sm font-bold text-slate-700">
                        Till lånedatum

                        <input
                            name="to"
                            type="date"
                            value={filters.to}
                            onChange={updateFilter}
                            className="mobile-input mt-2"
                        />
                    </label>

                    <label className="text-sm font-bold text-slate-700">
                        Serienummer

                        <input
                            name="serialNumber"
                            value={filters.serialNumber}
                            onChange={updateFilter}
                            maxLength={100}
                            className="mobile-input mt-2"
                        />
                    </label>

                    <label className="text-sm font-bold text-slate-700">
                        Utrustningstyp

                        <select
                            name="equipmentType"
                            value={filters.equipmentType}
                            onChange={updateFilter}
                            className="mobile-input mt-2"
                        >
                            <option value="">
                                Alla typer
                            </option>

                            {EQUIPMENT_TYPES.map(
                                (type) => (
                                    <option
                                        key={type}
                                        value={type}
                                    >
                                        {type}
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
                            onChange={updateFilter}
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
                            onClick={clearFilters}
                        >
                            Rensa filter
                        </Button>
                    </div>
                </form>
            </section>

            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                {!loading && (
                    <p
                        className="mb-4 text-sm font-semibold text-slate-600"
                        aria-live="polite"
                    >
                        {pageData.totalElements} lån hittades
                    </p>
                )}

                {loading ? (
                    <div
                        className="grid gap-3"
                        aria-label="Laddar lånehistorik"
                    >
                        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />

                        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />

                        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                    </div>
                ) : pageData.content.length === 0 ? (
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
                ) : (
                    <div className="grid gap-4">
                        {pageData.content.map((loan) => (
                            <article
                                key={loan.id}
                                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2>
                                            {loan.borrowerName}
                                        </h2>

                                        <p className="mt-1 font-mono text-sm text-slate-600">
                                            {
                                                loan
                                                    .equipment
                                                    .serialNumber
                                            }
                                        </p>
                                    </div>

                                    <Badge
                                        variant={
                                            loan.returned
                                                ? "success"
                                                : "warning"
                                        }
                                    >
                                        {loan.returned
                                            ? "Återlämnat"
                                            : "Aktivt"}
                                    </Badge>
                                </div>

                                <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
                                    <div>
                                        <dt className="font-bold text-slate-700">
                                            Kontakt
                                        </dt>

                                        <dd>
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
                                                {
                                                    loan.phoneNumber
                                                }
                                            </a>
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="font-bold text-slate-700">
                                            Utrustning
                                        </dt>

                                        <dd>
                                            {
                                                loan
                                                    .equipment
                                                    .type
                                            }

                                            {loan.equipment
                                                .description
                                                ? ` – ${loan.equipment.description}`
                                                : ""}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="font-bold text-slate-700">
                                            Lånedatum
                                        </dt>

                                        <dd>
                                            {formatDate(
                                                loan.loanDate
                                            )}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="font-bold text-slate-700">
                                            Återlämnad
                                        </dt>

                                        <dd>
                                            {formatDate(
                                                loan.returnedAt
                                            )}
                                        </dd>
                                    </div>
                                </dl>

                                {!loan.returned && (
                                    <div className="mt-4">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() =>
                                                setSelectedLoan(
                                                    loan
                                                )
                                            }
                                        >
                                            Markera som
                                            återlämnad
                                        </Button>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                )}

                {!loading
                    && pageData.totalPages > 1 && (
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
                    )}
            </section>

            <ConfirmDialog
                open={Boolean(selectedLoan)}
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

export default ActiveLoansPage;