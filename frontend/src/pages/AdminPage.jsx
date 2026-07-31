import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    useLocation,
    useNavigate,
} from "react-router";
import api, {
    getErrorMessage,
    hasErrorCode,
} from "../api/api";
import { useAuth } from "../auth/useAuth";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import LinkButton from "../components/ui/LinkButton";
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

const conditionLabels =
    Object.fromEntries(
        equipmentConditions.map(
            (item) => [
                item.value,
                item.label,
            ]
        )
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

    const [loadAttempt, setLoadAttempt] =
        useState(0);

    const [loadError, setLoadError] =
        useState("");

    const [actionError, setActionError] =
        useState("");

    const [
        successMessage,
        setSuccessMessage,
    ] = useState(
        location.state?.successMessage ||
        ""
    );

    const [returning, setReturning] =
        useState(false);

    const [
        updatingActiveStatus,
        setUpdatingActiveStatus,
    ] = useState(false);

    const [loggingOut, setLoggingOut] =
        useState(false);

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

    const returnInProgressRef =
        useRef(false);

    const statusUpdateInProgressRef =
        useRef(false);

    const logoutInProgressRef =
        useRef(false);

    const actionErrorRef =
        useRef(null);

    useEffect(() => {
        const controller =
            new AbortController();

        let activeRequest = true;

        async function fetchEquipment() {
            setLoading(true);
            setLoadError("");

            try {
                const response =
                    await api.get(
                        "/admin/equipment",
                        {
                            signal:
                            controller.signal,
                        }
                    );

                if (activeRequest) {
                    setEquipment(
                        Array.isArray(
                            response.data
                        )
                            ? response.data
                            : []
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
                        "Kunde inte hämta utrustningen. Försök igen."
                    )
                );
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
    }, [loadAttempt]);

    useEffect(() => {
        if (
            location.state?.successMessage
        ) {
            navigate(
                location.pathname,
                {
                    replace: true,
                    state: null,
                }
            );
        }
    }, [
        location.pathname,
        location.state,
        navigate,
    ]);

    useEffect(() => {
        if (actionError) {
            actionErrorRef.current?.focus();
        }
    }, [actionError]);

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
                        !query ||
                        searchableValues
                            .filter(Boolean)
                            .some((value) =>
                                String(value)
                                    .toLowerCase()
                                    .includes(
                                        query
                                    )
                            );

                    const matchesType =
                        typeFilter ===
                        "ALL" ||
                        item.type ===
                        typeFilter;

                    const matchesCondition =
                        conditionFilter ===
                        "ALL" ||
                        item.condition ===
                        conditionFilter;

                    const matchesAgeCategory =
                        ageCategoryFilter ===
                        "ALL" ||
                        item.ageCategory ===
                        ageCategoryFilter;

                    const matchesActive =
                        activeFilter ===
                        "ALL" ||
                        (activeFilter ===
                            "ACTIVE" &&
                            item.active) ||
                        (activeFilter ===
                            "INACTIVE" &&
                            !item.active);

                    const matchesStatus =
                        statusFilter ===
                        "ALL" ||
                        (statusFilter ===
                            "AVAILABLE" &&
                            item.available) ||
                        (statusFilter ===
                            "LOANED" &&
                            !item.available);

                    return (
                        matchesSearch &&
                        matchesType &&
                        matchesCondition &&
                        matchesAgeCategory &&
                        matchesActive &&
                        matchesStatus
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
                item.active &&
                item.available
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
        Boolean(searchTerm.trim()) ||
        typeFilter !== "ALL" ||
        conditionFilter !== "ALL" ||
        ageCategoryFilter !== "ALL" ||
        activeFilter !== "ALL" ||
        statusFilter !== "ALL";

    const actionInProgress =
        returning ||
        updatingActiveStatus ||
        loggingOut;

    function clearFilters() {
        setSearchTerm("");
        setTypeFilter("ALL");
        setConditionFilter("ALL");
        setAgeCategoryFilter("ALL");
        setActiveFilter("ALL");
        setStatusFilter("ALL");
    }

    function openReturnDialog(item) {
        if (actionInProgress) {
            return;
        }

        setActionError("");
        setSuccessMessage("");
        setSelectedReturnEquipment(
            item
        );
    }

    function openStatusDialog(item) {
        if (actionInProgress) {
            return;
        }

        setActionError("");
        setSuccessMessage("");
        setSelectedStatusEquipment(
            item
        );
    }

    async function handleReturned() {
        if (
            !selectedReturnEquipment ||
            returnInProgressRef.current
        ) {
            return;
        }

        returnInProgressRef.current =
            true;

        setReturning(true);
        setActionError("");
        setSuccessMessage("");

        const equipmentBeingReturned =
            selectedReturnEquipment;

        try {
            const historyResponse =
                await api.get(
                    "/admin/loans",
                    {
                        params: {
                            status: "ACTIVE",
                            serialNumber:
                            equipmentBeingReturned
                                .serialNumber,
                            page: 0,
                            size: 1,
                        },
                    }
                );

            const activeLoan =
                historyResponse.data
                    ?.content?.[0];

            if (!activeLoan) {
                setSelectedReturnEquipment(
                    null
                );

                setActionError(
                    "Det finns inget aktivt lån för den valda utrustningen."
                );

                return;
            }

            await api.put(
                `/admin/loans/${encodeURIComponent(
                    activeLoan.id
                )}/returned`
            );

            setEquipment((current) =>
                current.map((item) =>
                    item.id ===
                    equipmentBeingReturned.id
                        ? {
                            ...item,
                            available:
                                true,
                        }
                        : item
                )
            );

            setSelectedReturnEquipment(
                null
            );

            setSuccessMessage(
                `${equipmentBeingReturned.serialNumber} är markerad som återlämnad.`
            );
        } catch (error) {
            setSelectedReturnEquipment(
                null
            );

            setActionError(
                getErrorMessage(
                    error,
                    "Kunde inte markera utrustningen som återlämnad. Försök igen."
                )
            );
        } finally {
            returnInProgressRef.current =
                false;

            setReturning(false);
        }
    }

    async function handleActiveStatus() {
        if (
            !selectedStatusEquipment ||
            statusUpdateInProgressRef.current
        ) {
            return;
        }

        statusUpdateInProgressRef.current =
            true;

        setUpdatingActiveStatus(true);
        setActionError("");
        setSuccessMessage("");

        const equipmentBeingUpdated =
            selectedStatusEquipment;

        const newActiveStatus =
            !equipmentBeingUpdated.active;

        try {
            const response =
                await api.put(
                    `/admin/equipment/${encodeURIComponent(
                        equipmentBeingUpdated.id
                    )}/active`,
                    {
                        active:
                        newActiveStatus,
                    }
                );

            setEquipment((current) =>
                current.map((item) =>
                    item.id ===
                    response.data.id
                        ? response.data
                        : item
                )
            );

            setSelectedStatusEquipment(
                null
            );

            setSuccessMessage(
                newActiveStatus
                    ? `${equipmentBeingUpdated.serialNumber} har återaktiverats.`
                    : `${equipmentBeingUpdated.serialNumber} har inaktiverats.`
            );
        } catch (error) {
            setSelectedStatusEquipment(
                null
            );

            setActionError(
                getErrorMessage(
                    error,
                    "Kunde inte ändra utrustningens status. Försök igen."
                )
            );
        } finally {
            statusUpdateInProgressRef.current =
                false;

            setUpdatingActiveStatus(
                false
            );
        }
    }

    async function handleLogout() {
        if (
            logoutInProgressRef.current
        ) {
            return;
        }

        logoutInProgressRef.current =
            true;

        setLoggingOut(true);
        setActionError("");
        setSuccessMessage("");

        try {
            await logout();

            navigate(
                "/admin/login",
                {
                    replace: true,
                }
            );
        } catch (error) {
            setActionError(
                getErrorMessage(
                    error,
                    "Utloggningen kunde inte slutföras. Försök igen."
                )
            );
        } finally {
            logoutInProgressRef.current =
                false;

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

        return details.length > 0
            ? details.join(" • ")
            : "–";
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
                <LinkButton
                    to={
                        `/admin/equipment/${item.id}/edit`
                    }
                    variant="outline"
                    size="sm"
                    fullWidth={mobile}
                    className="mobile-button"
                >
                    Redigera
                </LinkButton>

                <LinkButton
                    to={
                        `/admin/qr/${item.id}`
                    }
                    variant="outline"
                    size="sm"
                    fullWidth={mobile}
                    className="mobile-button"
                >
                    QR-kod
                </LinkButton>

                {!item.available && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        fullWidth={mobile}
                        className="mobile-button"
                        disabled={
                            actionInProgress
                        }
                        onClick={() =>
                            openReturnDialog(
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
                    disabled={
                        actionInProgress
                    }
                    onClick={() =>
                        openStatusDialog(
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
        <main
            className="mobile-page safe-bottom space-y-6"
            aria-labelledby="admin-equipment-heading"
        >
            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <Badge variant="hockey">
                            Admin
                        </Badge>

                        <h1
                            id="admin-equipment-heading"
                            className="mt-3"
                        >
                            Utrustning
                        </h1>

                        <p className="mt-2 max-w-2xl text-slate-700">
                            Skapa, redigera,
                            sök och administrera
                            utrustning utan att
                            radera lånehistorik.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <p className="text-sm font-semibold text-slate-700">
                            Inloggad som{" "}
                            {admin?.username}
                        </p>

                        <LinkButton
                            to="/admin/add"
                            size="lg"
                            fullWidth
                            className="mobile-button sm:w-auto"
                        >
                            Lägg till utrustning
                        </LinkButton>

                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            loading={
                                loggingOut
                            }
                            loadingText="Loggar ut..."
                            disabled={
                                returning ||
                                updatingActiveStatus
                            }
                            onClick={
                                handleLogout
                            }
                            fullWidth
                            className="mobile-button sm:w-auto"
                        >
                            Logga ut
                        </Button>
                    </div>
                </div>
            </section>

            <section
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                aria-label="Statistik för utrustning"
            >
                <StatisticCard
                    label="Totalt"
                    value={totalCount}
                    className="bg-blue-950 text-white"
                    labelClassName="text-blue-100"
                    valueClassName="text-white"
                />

                <StatisticCard
                    label="Tillgängliga"
                    value={
                        activeAvailableCount
                    }
                    valueClassName="text-green-700"
                />

                <StatisticCard
                    label="Utlånade"
                    value={loanedCount}
                    valueClassName="text-amber-700"
                />

                <StatisticCard
                    label="Inaktiverade"
                    value={inactiveCount}
                    valueClassName="text-slate-800"
                />
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

            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                    <h2>
                        Sök och filtrera
                    </h2>

                    <p className="mt-1 text-sm text-slate-700">
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
                            className="mb-2 block text-sm font-semibold text-slate-800"
                        >
                            Sök
                        </label>

                        <input
                            id="equipment-search"
                            type="search"
                            value={
                                searchTerm
                            }
                            onChange={(
                                event
                            ) =>
                                setSearchTerm(
                                    event
                                        .target
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
                        onChange={
                            setTypeFilter
                        }
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
                        value={
                            activeFilter
                        }
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
                        value={
                            statusFilter
                        }
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

            <section
                className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6"
                aria-busy={loading}
            >
                <div className="mb-5">
                    <h2>
                        Utrustningslista
                    </h2>

                    {!loading && (
                        <p
                            className="mt-1 text-sm text-slate-700"
                            role="status"
                            aria-live="polite"
                        >
                            Visar{" "}
                            {
                                filteredEquipment
                                    .length
                            }{" "}
                            av{" "}
                            {
                                equipment.length
                            }.
                        </p>
                    )}
                </div>

                {loading ? (
                    <EquipmentLoading />
                ) : loadError ? (
                    <div className="space-y-4">
                        <Alert
                            title="Utrustningen kunde inte hämtas"
                            variant="danger"
                        >
                            {loadError}
                        </Alert>

                        <Button
                            type="button"
                            onClick={() =>
                                setLoadAttempt(
                                    (current) =>
                                        current +
                                        1
                                )
                            }
                        >
                            Försök igen
                        </Button>
                    </div>
                ) : filteredEquipment.length ===
                0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                        <h3>
                            Ingen utrustning
                            hittades
                        </h3>

                        <p className="mt-2 text-sm text-slate-700">
                            {hasActiveFilters
                                ? "Prova en annan sökning eller rensa filtren."
                                : "Lägg till utrustning för att komma igång."}
                        </p>
                    </div>
                ) : (
                    <EquipmentList
                        equipment={
                            filteredEquipment
                        }
                        renderStatus={
                            renderStatus
                        }
                        renderDetails={
                            renderDetails
                        }
                        renderActions={
                            renderActions
                        }
                    />
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
                onConfirm={
                    handleReturned
                }
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
        </main>
    );
}

function StatisticCard({
                           label,
                           value,
                           className = "bg-white",
                           labelClassName = "text-slate-700",
                           valueClassName = "text-slate-900",
                       }) {
    return (
        <div
            className={[
                "rounded-2xl p-5 shadow-sm",
                className,
            ].join(" ")}
        >
            <p
                className={[
                    "text-sm font-semibold",
                    labelClassName,
                ].join(" ")}
            >
                {label}
            </p>

            <p
                className={[
                    "mt-2 text-3xl font-black",
                    valueClassName,
                ].join(" ")}
            >
                {value}
            </p>
        </div>
    );
}

function EquipmentLoading() {
    return (
        <div
            className="grid gap-3"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <span className="sr-only">
                Laddar utrustning...
            </span>

            {[1, 2, 3].map(
                (item) => (
                    <div
                        key={item}
                        className="h-20 animate-pulse rounded-2xl bg-slate-100"
                        aria-hidden="true"
                    />
                )
            )}
        </div>
    );
}

function EquipmentList({
                           equipment,
                           renderStatus,
                           renderDetails,
                           renderActions,
                       }) {
    return (
        <>
            <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 lg:block">
                <table>
                    <caption className="sr-only">
                        Administrerbar lista över
                        utrustning
                    </caption>

                    <thead>
                    <tr>
                        <th scope="col">
                            Utrustning
                        </th>
                        <th scope="col">
                            Detaljer
                        </th>
                        <th scope="col">
                            Skick
                        </th>
                        <th scope="col">
                            Förvaring
                        </th>
                        <th scope="col">
                            Status
                        </th>
                        <th scope="col">
                            Åtgärder
                        </th>
                    </tr>
                    </thead>

                    <tbody>
                    {equipment.map(
                        (item) => (
                            <tr
                                key={
                                    item.id
                                }
                            >
                                <th
                                    scope="row"
                                    className="text-left"
                                >
                                    <p className="font-semibold text-slate-900">
                                        {typeLabels[
                                                item
                                                    .type
                                                ] ||
                                            item.type}
                                    </p>

                                    <p className="mt-1 font-mono text-sm font-normal text-slate-700">
                                        {
                                            item.serialNumber
                                        }
                                    </p>
                                </th>

                                <td className="text-sm text-slate-700">
                                    {renderDetails(
                                        item
                                    )}

                                    {item.description && (
                                        <p className="mt-2 max-w-xs text-xs text-slate-600">
                                            {
                                                item.description
                                            }
                                        </p>
                                    )}
                                </td>

                                <td>
                                    {conditionLabels[
                                            item
                                                .condition
                                            ] ||
                                        item.condition}
                                </td>

                                <td>
                                    {item.storageLocation ||
                                        "–"}
                                </td>

                                <td>
                                    {renderStatus(
                                        item
                                    )}
                                </td>

                                <td>
                                    {renderActions(
                                        item
                                    )}
                                </td>
                            </tr>
                        )
                    )}
                    </tbody>
                </table>
            </div>

            <div className="grid gap-4 lg:hidden">
                {equipment.map(
                    (item) => (
                        <article
                            key={item.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            aria-labelledby={
                                `equipment-${item.id}-heading`
                            }
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3
                                        id={
                                            `equipment-${item.id}-heading`
                                        }
                                    >
                                        {typeLabels[
                                                item
                                                    .type
                                                ] ||
                                            item.type}
                                    </h3>

                                    <p className="mt-1 break-all font-mono text-sm text-slate-700">
                                        {
                                            item.serialNumber
                                        }
                                    </p>
                                </div>

                                {renderStatus(
                                    item
                                )}
                            </div>

                            <dl className="mt-4 grid gap-2 text-sm">
                                <DetailRow
                                    label="Detaljer"
                                    value={renderDetails(
                                        item
                                    )}
                                />

                                <DetailRow
                                    label="Skick"
                                    value={
                                        conditionLabels[
                                            item
                                                .condition
                                            ] ||
                                        item.condition
                                    }
                                />

                                <DetailRow
                                    label="Förvaring"
                                    value={
                                        item.storageLocation ||
                                        "–"
                                    }
                                />
                            </dl>

                            {item.description && (
                                <p className="mt-3 break-words text-sm text-slate-700">
                                    {
                                        item.description
                                    }
                                </p>
                            )}

                            <div className="mt-4">
                                {renderActions(
                                    item,
                                    true
                                )}
                            </div>
                        </article>
                    )
                )}
            </div>
        </>
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
                className="mb-2 block text-sm font-semibold text-slate-800"
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
                {options.map(
                    (option) => (
                        <option
                            key={
                                option.value
                            }
                            value={
                                option.value
                            }
                        >
                            {
                                option.label
                            }
                        </option>
                    )
                )}
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
            <dt className="font-semibold text-slate-700">
                {label}
            </dt>

            <dd className="break-words text-right text-slate-900">
                {value}
            </dd>
        </div>
    );
}

export default AdminPage;