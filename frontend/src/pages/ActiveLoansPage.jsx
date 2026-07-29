import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const ALL_TYPES = "ALL";

function ActiveLoansPage() {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [returning, setReturning] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [equipmentType, setEquipmentType] =
        useState(ALL_TYPES);
    const [selectedLoan, setSelectedLoan] = useState(null);

    async function fetchActiveLoans() {
        try {
            setLoading(true);

            const response =
                await api.get("/admin/loans/active");

            setLoans(response.data);
            setErrorMessage("");
        } catch (error) {
            if (error.response?.status === 403) {
                setErrorMessage(
                    "Du saknar behörighet att visa aktiva lån."
                );
            } else if (error.response?.status !== 401) {
                setErrorMessage(
                    error.displayMessage
                    || "Kunde inte hämta aktiva lån."
                );
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchActiveLoans();
    }, []);

    const equipmentTypes = useMemo(() => {
        return [...new Set(
            loans
                .map((loan) => loan.equipment?.type)
                .filter(Boolean)
        )].sort();
    }, [loans]);

    const filteredLoans = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return loans.filter((loan) => {
            const matchesType =
                equipmentType === ALL_TYPES
                || loan.equipment?.type === equipmentType;

            if (!matchesType) {
                return false;
            }

            if (!query) {
                return true;
            }

            const searchableValues = [
                loan.borrowerName,
                loan.email,
                loan.phoneNumber,
                loan.equipment?.serialNumber,
                loan.equipment?.type,
                loan.equipment?.description,
            ];

            return searchableValues.some((value) =>
                value?.toLowerCase().includes(query)
            );
        });
    }, [equipmentType, loans, searchTerm]);

    async function handleReturned() {
        if (!selectedLoan) {
            return;
        }

        try {
            setReturning(true);
            setErrorMessage("");
            setSuccessMessage("");

            await api.put(
                `/admin/loans/${selectedLoan.id}/returned`
            );

            setLoans((currentLoans) =>
                currentLoans.filter(
                    (loan) => loan.id !== selectedLoan.id
                )
            );

            setSuccessMessage(
                `${selectedLoan.equipment.serialNumber} är markerad som återlämnad.`
            );

            setSelectedLoan(null);
        } catch (error) {
            if (error.response?.status === 403) {
                setErrorMessage(
                    "Du saknar behörighet att registrera återlämningen."
                );
            } else if (error.response?.status !== 401) {
                setErrorMessage(
                    error.displayMessage
                    || "Kunde inte markera lånet som återlämnat."
                );
            }
        } finally {
            setReturning(false);
        }
    }

    function formatLoanDate(value) {
        if (!value) {
            return "Datum saknas";
        }

        return new Intl.DateTimeFormat("sv-SE", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    }

    return (
        <div className="mobile-page safe-bottom space-y-6">
            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <Badge variant="hockey">Admin</Badge>

                <h1 className="mt-3">Aktiva lån</h1>

                <p className="mt-2 max-w-2xl">
                    Se vem som har lånat utrustningen och
                    registrera återlämningar.
                </p>
            </section>

            {errorMessage && (
                <Alert title="Något gick fel" variant="danger">
                    {errorMessage}
                </Alert>
            )}

            {successMessage && (
                <Alert title="Klart" variant="success">
                    {successMessage}
                </Alert>
            )}

            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 grid gap-4 md:grid-cols-[1fr_16rem]">
                    <div>
                        <label
                            htmlFor="loan-search"
                            className="mb-2 block text-sm font-bold text-slate-700"
                        >
                            Sök
                        </label>

                        <input
                            id="loan-search"
                            type="search"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(event.target.value)
                            }
                            placeholder="Namn, e-post, telefon eller utrustning"
                            className="mobile-input"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="equipment-type-filter"
                            className="mb-2 block text-sm font-bold text-slate-700"
                        >
                            Utrustningstyp
                        </label>

                        <select
                            id="equipment-type-filter"
                            value={equipmentType}
                            onChange={(event) =>
                                setEquipmentType(event.target.value)
                            }
                            className="mobile-input"
                        >
                            <option value={ALL_TYPES}>
                                Alla typer
                            </option>

                            {equipmentTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {!loading && loans.length > 0 && (
                    <p
                        className="mb-4 text-sm font-semibold text-slate-600"
                        aria-live="polite"
                    >
                        Visar {filteredLoans.length} av {loans.length} aktiva lån
                    </p>
                )}

                {loading ? (
                    <div
                        className="grid gap-3"
                        aria-label="Laddar aktiva lån"
                    >
                        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                    </div>
                ) : loans.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                        <h2>Inga aktiva lån</h2>

                        <p className="mt-2 text-sm text-slate-600">
                            All registrerad utrustning är återlämnad
                            eller tillgänglig.
                        </p>
                    </div>
                ) : filteredLoans.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                        <h2>Inga matchande lån</h2>

                        <p className="mt-2 text-sm text-slate-600">
                            Ändra sökningen eller valt filter.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 lg:block">
                            <table>
                                <thead>
                                <tr>
                                    <th>Låntagare</th>
                                    <th>Kontakt</th>
                                    <th>Utrustning</th>
                                    <th>Lånedatum</th>
                                    <th>Åtgärd</th>
                                </tr>
                                </thead>

                                <tbody>
                                {filteredLoans.map((loan) => (
                                    <tr key={loan.id}>
                                        <td className="font-semibold text-slate-900">
                                            {loan.borrowerName}
                                        </td>

                                        <td>
                                            <a
                                                href={`mailto:${loan.email}`}
                                                className="block font-semibold text-blue-800 underline"
                                            >
                                                {loan.email}
                                            </a>

                                            <a
                                                href={`tel:${loan.phoneNumber}`}
                                                className="mt-1 block text-slate-700 underline"
                                            >
                                                {loan.phoneNumber}
                                            </a>
                                        </td>

                                        <td>
                                            <p className="font-semibold text-slate-900">
                                                {loan.equipment.type}
                                            </p>

                                            <p className="font-mono text-sm text-slate-700">
                                                {loan.equipment.serialNumber}
                                            </p>

                                            {loan.equipment.description && (
                                                <p className="mt-1 text-sm text-slate-600">
                                                    {loan.equipment.description}
                                                </p>
                                            )}
                                        </td>

                                        <td>
                                            {formatLoanDate(loan.loanDate)}
                                        </td>

                                        <td>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() =>
                                                    setSelectedLoan(loan)
                                                }
                                            >
                                                Återlämnad
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-4 lg:hidden">
                            {filteredLoans.map((loan) => (
                                <article
                                    key={loan.id}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h2>{loan.borrowerName}</h2>

                                            <p className="mt-1 font-mono text-sm text-slate-600">
                                                {loan.equipment.serialNumber}
                                            </p>
                                        </div>

                                        <Badge variant="warning">
                                            Aktivt
                                        </Badge>
                                    </div>

                                    <dl className="mt-4 grid gap-3 text-sm">
                                        <div>
                                            <dt className="font-bold text-slate-700">
                                                Utrustning
                                            </dt>
                                            <dd>
                                                {loan.equipment.type}
                                                {loan.equipment.description
                                                    ? ` – ${loan.equipment.description}`
                                                    : ""}
                                            </dd>
                                        </div>

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
                                                    {loan.phoneNumber}
                                                </a>
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="font-bold text-slate-700">
                                                Utlånad
                                            </dt>
                                            <dd>
                                                {formatLoanDate(loan.loanDate)}
                                            </dd>
                                        </div>
                                    </dl>

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        fullWidth
                                        className="mobile-button mt-4"
                                        onClick={() =>
                                            setSelectedLoan(loan)
                                        }
                                    >
                                        Markera som återlämnad
                                    </Button>
                                </article>
                            ))}
                        </div>
                    </>
                )}
            </section>

            <ConfirmDialog
                open={Boolean(selectedLoan)}
                title="Markera lånet som återlämnat?"
                message={
                    selectedLoan
                        ? `Vill du markera ${selectedLoan.equipment.serialNumber}, lånad av ${selectedLoan.borrowerName}, som återlämnad?`
                        : ""
                }
                confirmText="Ja, markera återlämnad"
                cancelText="Avbryt"
                loading={returning}
                variant="secondary"
                onConfirm={handleReturned}
                onCancel={() => setSelectedLoan(null)}
            />
        </div>
    );
}

export default ActiveLoansPage;