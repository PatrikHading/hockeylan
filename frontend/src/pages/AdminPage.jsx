import {
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    Link,
    useLocation,
    useNavigate,
} from "react-router";
import api from "../api/api";
import { useAuth } from "../auth/useAuth";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import {
    ageCategories,
    equipmentConditions,
    equipmentTypes,
} from "../features/equipment/equipmentForm";

const statusOptions = [
    {
        value: "ALL",
        label: "Alla statusar",
    },
    {
        value: "AVAILABLE",
        label: "Tillgängliga",
    },
    {
        value: "LOANED",
        label: "Utlånade",
    },
];

const activeOptions = [
    {
        value: "ALL",
        label: "Aktiva och inaktiva",
    },
    {
        value: "ACTIVE",
        label: "Endast aktiva",
    },
    {
        value: "INACTIVE",
        label: "Endast inaktiva",
    },
];

const typeLabels = Object.fromEntries(
    equipmentTypes.map((item) => [
        item.value,
        item.label,
    ])
);

const conditionLabels = Object.fromEntries(
    equipmentConditions.map((item) => [
        item.value,
        item.label,
    ])
);

const ageCategoryLabels =
    Object.fromEntries(
        ageCategories.map((item) => [
            item.value,
            item.label,
        ])
    );

function AdminPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { admin, logout } = useAuth();

    const [equipment, setEquipment] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [returning, setReturning] =
        useState(false);

    const [
        updatingActiveStatus,
        setUpdatingActiveStatus,
    ] = useState(false);

    const [loggingOut, setLoggingOut] =
        useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const [
        successMessage,
        setSuccessMessage,
    ] = useState(
        location.state?.successMessage
        || ""
    );

    const [searchTerm, setSearchTerm] =
        useState("");

    const [typeFilter, setTypeFilter] =
        useState("ALL");

    const [
        conditionFilter,
        setConditionFilter,
    ] = useState("ALL");

    const [
        ageCategoryFilter,
        setAgeCategoryFilter,
    ] = useState("ALL");

    const [
        activeFilter,
        setActiveFilter,
    ] = useState("ALL");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState("ALL");

    const [
        selectedReturnEquipment,
        setSelectedReturnEquipment,
    ] = useState(null);

    const [
        selectedStatusEquipment,
        setSelectedStatusEquipment,
    ] = useState(null);

    useEffect(() => {
        fetchEquipment();
    }, []);

    useEffect(() => {
        if (
            location.state?.successMessage
        ) {
            navigate(location.pathname, {
                replace: true,
                state: null,
            });
        }
    }, [
        location.pathname,
        location.state,
        navigate,
    ]);

    async function fetchEquipment() {
        try {
            setLoading(true);

            const response =
                await api.get(
                    "/admin/equipment"
                );

            setEquipment(response.data);
            setErrorMessage("");
        } catch (error) {
            if (
                error.response?.status
                === 403
            ) {
                setErrorMessage(
                    "Du saknar behörighet att visa administratörsinnehållet."
                );
            } else if (
                error.response?.status
                !== 401
            ) {
                setErrorMessage(
                    error.displayMessage
                    || "Kunde inte hämta utrustning."
                );
            }
        } finally {
            setLoading(false);
        }
    }

    const filteredEquipment =
        useMemo(() => {
            const query =
                searchTerm
                    .toLowerCase()
                    .trim();

            return equipment.filter(
                (item) => {
                    const searchableValues = [
                        item.type,
                        item.serialNumber,
                        item.size,
                        item.brand,
                        item.model,
                        item.condition,
                        item.ageCategory,
                        item.storageLocation,
                        item.description,
                    ];

                    const matchesSearch =
                        !query
                        || searchableValues
                            .filter(Boolean)
                            .some((value) =>
                                String(value)
                                    .toLowerCase()
                                    .includes(query)
                            );

                    const matchesType =
                        typeFilter === "ALL"
                        || item.type
                        === typeFilter;

                    const matchesCondition =
                        conditionFilter
                        === "ALL"
                        || item.condition
                        === conditionFilter;

                    const matchesAgeCategory =
                        ageCategoryFilter
                        === "ALL"
                        || item.ageCategory
                        === ageCategoryFilter;

                    const matchesActive =
                        activeFilter === "ALL"
                        || (
                            activeFilter
                            === "ACTIVE"
                            && item.active
                        )
                        || (
                            activeFilter
                            === "INACTIVE"
                            && !item.active
                        );

                    const matchesStatus =
                        statusFilter === "ALL"
                        || (
                            statusFilter
                            === "AVAILABLE"
                            && item.available
                        )
                        || (
                            statusFilter
                            === "LOANED"
                            && !item.available
                        );

                    return (
                        matchesSearch
                        && matchesType
                        && matchesCondition
                        && matchesAgeCategory
                        && matchesActive
                        && matchesStatus
                    );
                }
            );
        }, [
            equipment,
            searchTerm,
            typeFilter,
            conditionFilter,
            ageCategoryFilter,
            activeFilter,
            statusFilter,
        ]);

    const totalCount =
        equipment.length;

    const activeAvailableCount =
        equipment.filter(
            (item) =>
                item.active
                && item.available
        ).length;

    const loanedCount =
        equipment.filter(
            (item) => !item.available
        ).length;

    const inactiveCount =
        equipment.filter(
            (item) => !item.active
        ).length;

    const hasActiveFilters =
        Boolean(searchTerm.trim())
        || typeFilter !== "ALL"
        || conditionFilter !== "ALL"
        || ageCategoryFilter !== "ALL"
        || activeFilter !== "ALL"
        || statusFilter !== "ALL";

    function clearFilters() {
        setSearchTerm("");
        setTypeFilter("ALL");
        setConditionFilter("ALL");
        setAgeCategoryFilter("ALL");
        setActiveFilter("ALL");
        setStatusFilter("ALL");
    }

    async function handleReturned() {
        if (!selectedReturnEquipment) {
            return;
        }

        try {
            setReturning(true);
            setErrorMessage("");
            setSuccessMessage("");

            const historyResponse =
                await api.get(
                    "/admin/loans",
                    {
                        params: {
                            status: "ACTIVE",
                            serialNumber:
                            selectedReturnEquipment
                                .serialNumber,
                            page: 0,
                            size: 1,
                        },
                    }
                );

            const activeLoan =
                historyResponse
                    .data
                    .content[0];

            if (!activeLoan) {
                setErrorMessage(
                    "Det finns inget aktivt lån för den valda utrustningen."
                );

                setSelectedReturnEquipment(
                    null
                );

                return;
            }

            await api.put(
                `/admin/loans/${activeLoan.id}/returned`
            );

            await fetchEquipment();

            setSuccessMessage(
                `${selectedReturnEquipment.serialNumber} är markerad som återlämnad.`
            );

            setSelectedReturnEquipment(
                null
            );
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
                    || "Kunde inte markera utrustningen som återlämnad."
                );
            }
        } finally {
            setReturning(false);
        }
    }

    async function handleActiveStatus() {
        if (!selectedStatusEquipment) {
            return;
        }

        const newActiveStatus =
            !selectedStatusEquipment.active;

        try {
            setUpdatingActiveStatus(true);
            setErrorMessage("");
            setSuccessMessage("");

            const response =
                await api.put(
                    `/admin/equipment/${selectedStatusEquipment.id}/active`,
                    {
                        active:
                        newActiveStatus,
                    }
                );

            setEquipment((current) =>
                current.map((item) =>
                    item.id
                    === response.data.id
                        ? response.data
                        : item
                )
            );

            setSuccessMessage(
                newActiveStatus
                    ? `${selectedStatusEquipment.serialNumber} har återaktiverats.`
                    : `${selectedStatusEquipment.serialNumber} har inaktiverats.`
            );

            setSelectedStatusEquipment(
                null
            );
        } catch (error) {
            if (
                error.response?.status
                === 403
            ) {
                setErrorMessage(
                    "Du saknar behörighet att ändra utrustningens status."
                );
            } else if (
                error.response?.status
                !== 401
            ) {
                setErrorMessage(
                    error.displayMessage
                    || "Kunde inte ändra utrustningens status."
                );
            }
        } finally {
            setUpdatingActiveStatus(
                false
            );
        }
    }

    async function handleLogout() {
        try {
            setLoggingOut(true);
            setErrorMessage("");
            setSuccessMessage("");

            await logout();

            navigate(
                "/admin/login",
                {
                    replace: true,
                }
            );
        } catch {
            setErrorMessage(
                "Utloggningen kunde inte slutföras. Försök igen."
            );
        } finally {
            setLoggingOut(false);
        }
    }

    function renderStatus(item) {
        if (!item.active) {
            return (
                <Badge variant="neutral">
                    Inaktiverad
                </Badge>
            );
        }

        if (item.available) {
            return (
                <Badge variant="success">
                    Tillgänglig
                </Badge>
            );
        }

        return (
            <Badge variant="warning">
                Utlånad
            </Badge>
        );
    }

    function renderDetails(item) {
        const details = [
            item.brand,
            item.model,
            item.size
                ? `Storlek: ${item.size}`
                : null,
            item.ageCategory
                ? ageCategoryLabels[
                    item.ageCategory
                    ]
                : null,
        ].filter(Boolean);

        if (details.length === 0) {
            return "-";
        }

        return details.join(" • ");
    }

    function renderActions(
        item,
        mobile = false
    ) {
        return (
            <div
                className={
                    mobile
                        ? "flex flex-col gap-2"
                        : "flex flex-wrap gap-2"
                }
            >
                <Link
                    to={
                        `/admin/equipment/${item.id}/edit`
                    }
                >
                    <Button
                        variant="outline"
                        size="sm"
                        fullWidth={mobile}
                        className="mobile-button"
                    >
                        Redigera
                    </Button>
                </Link>

                <Link
                    to={
                        `/admin/qr/${item.id}`
                    }
                >
                    <Button
                        variant="outline"
                        size="sm"
                        fullWidth={mobile}
                        className="mobile-button"
                    >
                        QR-kod
                    </Button>
                </Link>

                {!item.available && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        fullWidth={mobile}
                        className="mobile-button"
                        onClick={() =>
                            setSelectedReturnEquipment(
                                item
                            )
                        }
                    >
                        Markera återlämnad
                    </Button>
                )}

                <Button
                    type="button"
                    variant={
                        item.active
                            ? "outline"
                            : "secondary"
                    }
                    size="sm"
                    fullWidth={mobile}
                    className="mobile-button"
                    onClick={() =>
                        setSelectedStatusEquipment(
                            item
                        )
                    }
                >
                    {item.active
                        ? "Inaktivera"
                        : "Återaktivera"}
                </Button>
            </div>
        );
    }

    return (
        <div className="mobile-page safe-bottom space-y-6">
            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <Badge variant="hockey">
                            Admin
                        </Badge>

                        <h1 className="mt-3">
                            Utrustning
                        </h1>

                        <p className="mt-2 max-w-2xl">
                            Skapa, redigera,
                            sök och administrera
                            utrustning utan att
                            radera lånehistorik.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <p className="text-sm font-semibold text-slate-600">
                            Inloggad som{" "}
                            {admin?.username}
                        </p>

                        <Link to="/admin/add">
                            <Button
                                size="lg"
                                fullWidth
                                className="mobile-button sm:w-auto"
                            >
                                Lägg till utrustning
                            </Button>
                        </Link>

                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            disabled={
                                loggingOut
                            }
                            onClick={
                                handleLogout
                            }
                            fullWidth
                            className="mobile-button sm:w-auto"
                        >
                            {loggingOut
                                ? "Loggar ut..."
                                : "Logga ut"}
                        </Button>
                    </div>
                </div>
            </section>

            <section
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                aria-label="Statistik för utrustning"
            >
                <div className="rounded-2xl bg-blue-950 p-5 text-white shadow-sm">
                    <p className="text-sm font-semibold text-blue-100">
                        Totalt
                    </p>

                    <p className="mt-2 text-3xl font-black">
                        {totalCount}
                    </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">
                        Tillgängliga
                    </p>

                    <p className="mt-2 text-3xl font-black text-green-700">
                        {activeAvailableCount}
                    </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">
                        Utlånade
                    </p>

                    <p className="mt-2 text-3xl font-black text-amber-700">
                        {loanedCount}
                    </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">
                        Inaktiverade
                    </p>

                    <p className="mt-2 text-3xl font-black text-slate-700">
                        {inactiveCount}
                    </p>
                </div>
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
                <div className="mb-5">
                    <h2>Sök och filtrera</h2>

                    <p className="mt-1 text-sm text-slate-600">
                        Sök på serienummer,
                        storlek, märke, modell,
                        förvaringsplats eller
                        beskrivning.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="xl:col-span-2">
                        <label
                            htmlFor="equipment-search"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Sök
                        </label>

                        <input
                            id="equipment-search"
                            type="search"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(
                                    event.target
                                        .value
                                )
                            }
                            placeholder="Sök utrustning..."
                            className="mobile-input"
                        />
                    </div>

                    <FilterSelect
                        id="type-filter"
                        label="Typ"
                        value={typeFilter}
                        onChange={setTypeFilter}
                        options={[
                            {
                                value: "ALL",
                                label: "Alla typer",
                            },
                            ...equipmentTypes,
                        ]}
                    />

                    <FilterSelect
                        id="condition-filter"
                        label="Skick"
                        value={
                            conditionFilter
                        }
                        onChange={
                            setConditionFilter
                        }
                        options={[
                            {
                                value: "ALL",
                                label: "Alla skick",
                            },
                            ...equipmentConditions,
                        ]}
                    />

                    <FilterSelect
                        id="age-category-filter"
                        label="Ålderskategori"
                        value={
                            ageCategoryFilter
                        }
                        onChange={
                            setAgeCategoryFilter
                        }
                        options={[
                            {
                                value: "ALL",
                                label: "Alla ålderskategorier",
                            },
                            ...ageCategories.filter(
                                (item) =>
                                    item.value
                            ),
                        ]}
                    />

                    <FilterSelect
                        id="active-filter"
                        label="Aktiv status"
                        value={activeFilter}
                        onChange={
                            setActiveFilter
                        }
                        options={
                            activeOptions
                        }
                    />

                    <FilterSelect
                        id="loan-status-filter"
                        label="Lånestatus"
                        value={statusFilter}
                        onChange={
                            setStatusFilter
                        }
                        options={
                            statusOptions
                        }
                    />
                </div>

                {hasActiveFilters && (
                    <div className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={
                                clearFilters
                            }
                        >
                            Rensa filter
                        </Button>
                    </div>
                )}
            </section>

            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                    <h2>Utrustningslista</h2>

                    <p className="mt-1 text-sm text-slate-600">
                        Visar{" "}
                        {
                            filteredEquipment
                                .length
                        }{" "}
                        av {equipment.length}.
                    </p>
                </div>

                {loading ? (
                    <div
                        className="grid gap-3"
                        aria-label="Laddar utrustning"
                    >
                        <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                        <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                        <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                    </div>
                ) : filteredEquipment.length
                === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                        <h3>
                            Ingen utrustning
                            hittades
                        </h3>

                        <p className="mt-2 text-sm text-slate-600">
                            Prova en annan
                            sökning eller rensa
                            filtren.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 lg:block">
                            <table>
                                <thead>
                                <tr>
                                    <th>Utrustning</th>
                                    <th>Detaljer</th>
                                    <th>Skick</th>
                                    <th>Förvaring</th>
                                    <th>Status</th>
                                    <th>Åtgärder</th>
                                </tr>
                                </thead>

                                <tbody>
                                {filteredEquipment.map(
                                    (item) => (
                                        <tr
                                            key={
                                                item.id
                                            }
                                        >
                                            <td>
                                                <p className="font-semibold text-slate-900">
                                                    {
                                                        typeLabels[
                                                            item
                                                                .type
                                                            ]
                                                        || item.type
                                                    }
                                                </p>

                                                <p className="mt-1 font-mono text-sm text-slate-600">
                                                    {
                                                        item
                                                            .serialNumber
                                                    }
                                                </p>
                                            </td>

                                            <td className="text-sm text-slate-600">
                                                {
                                                    renderDetails(
                                                        item
                                                    )
                                                }

                                                {item.description && (
                                                    <p className="mt-2 max-w-xs text-xs text-slate-500">
                                                        {
                                                            item
                                                                .description
                                                        }
                                                    </p>
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    conditionLabels[
                                                        item
                                                            .condition
                                                        ]
                                                    || item.condition
                                                }
                                            </td>

                                            <td>
                                                {
                                                    item.storageLocation
                                                    || "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    renderStatus(
                                                        item
                                                    )
                                                }
                                            </td>

                                            <td>
                                                {
                                                    renderActions(
                                                        item
                                                    )
                                                }
                                            </td>
                                        </tr>
                                    )
                                )}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-4 lg:hidden">
                            {filteredEquipment.map(
                                (item) => (
                                    <article
                                        key={item.id}
                                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3>
                                                    {
                                                        typeLabels[
                                                            item
                                                                .type
                                                            ]
                                                        || item.type
                                                    }
                                                </h3>

                                                <p className="mt-1 font-mono text-sm text-slate-600">
                                                    {
                                                        item
                                                            .serialNumber
                                                    }
                                                </p>
                                            </div>

                                            {
                                                renderStatus(
                                                    item
                                                )
                                            }
                                        </div>

                                        <dl className="mt-4 grid gap-2 text-sm">
                                            <DetailRow
                                                label="Detaljer"
                                                value={
                                                    renderDetails(
                                                        item
                                                    )
                                                }
                                            />

                                            <DetailRow
                                                label="Skick"
                                                value={
                                                    conditionLabels[
                                                        item
                                                            .condition
                                                        ]
                                                    || item.condition
                                                }
                                            />

                                            <DetailRow
                                                label="Förvaring"
                                                value={
                                                    item.storageLocation
                                                    || "-"
                                                }
                                            />
                                        </dl>

                                        {item.description && (
                                            <p className="mt-3 text-sm text-slate-600">
                                                {
                                                    item
                                                        .description
                                                }
                                            </p>
                                        )}

                                        <div className="mt-4">
                                            {
                                                renderActions(
                                                    item,
                                                    true
                                                )
                                            }
                                        </div>
                                    </article>
                                )
                            )}
                        </div>
                    </>
                )}
            </section>

            <ConfirmDialog
                open={Boolean(
                    selectedReturnEquipment
                )}
                title="Markera som återlämnad?"
                message={
                    selectedReturnEquipment
                        ? `Vill du markera ${selectedReturnEquipment.serialNumber} som återlämnad?`
                        : ""
                }
                confirmText="Ja, markera återlämnad"
                cancelText="Avbryt"
                loading={returning}
                variant="secondary"
                onConfirm={handleReturned}
                onCancel={() =>
                    setSelectedReturnEquipment(
                        null
                    )
                }
            />

            <ConfirmDialog
                open={Boolean(
                    selectedStatusEquipment
                )}
                title={
                    selectedStatusEquipment
                        ?.active
                        ? "Inaktivera utrustning?"
                        : "Återaktivera utrustning?"
                }
                message={
                    selectedStatusEquipment
                        ? selectedStatusEquipment
                            .active
                            ? `${selectedStatusEquipment.serialNumber} kommer inte längre att kunna lånas. Lånehistoriken bevaras.`
                            : `${selectedStatusEquipment.serialNumber} kommer åter att kunna lånas när den är tillgänglig.`
                        : ""
                }
                confirmText={
                    selectedStatusEquipment
                        ?.active
                        ? "Ja, inaktivera"
                        : "Ja, återaktivera"
                }
                cancelText="Avbryt"
                loading={
                    updatingActiveStatus
                }
                variant="secondary"
                onConfirm={
                    handleActiveStatus
                }
                onCancel={() =>
                    setSelectedStatusEquipment(
                        null
                    )
                }
            />
        </div>
    );
}

function FilterSelect({
                          id,
                          label,
                          value,
                          onChange,
                          options,
                      }) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-2 block text-sm font-semibold text-slate-700"
            >
                {label}
            </label>

            <select
                id={id}
                value={value}
                onChange={(event) =>
                    onChange(
                        event.target.value
                    )
                }
            >
                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

function DetailRow({
                       label,
                       value,
                   }) {
    return (
        <div className="flex justify-between gap-4">
            <dt className="font-semibold text-slate-500">
                {label}
            </dt>

            <dd className="text-right text-slate-800">
                {value}
            </dd>
        </div>
    );
}

export default AdminPage;