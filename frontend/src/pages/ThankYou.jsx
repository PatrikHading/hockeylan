import {
    useLocation,
} from "react-router";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import LinkButton from "../components/ui/LinkButton";

const typeLabels = {
    COMPLETE_KIT:
        "Komplett utrustning",
    HELMET: "Hjälm",
    SKATES: "Skridskor",
    STICK: "Klubba",
};

export default function ThankYou() {
    const location = useLocation();

    const {
        loanId,
        equipmentType,
        serialNumber,
        borrowerName,
        loanDate,
        expectedReturnDate,
    } = location.state || {};

    if (!loanId) {
        return (
            <main
                className="mobile-page safe-bottom"
                aria-labelledby="missing-summary-heading"
            >
                <Alert
                    title="Ingen lånesammanfattning"
                    variant="warning"
                >
                    Öppna ett registrerat lån
                    från administratörsvyn.
                </Alert>

                <h1
                    id="missing-summary-heading"
                    className="sr-only"
                >
                    Lånesammanfattning saknas
                </h1>

                <div className="mt-4">
                    <LinkButton
                        to="/admin"
                    >
                        Till adminvyn
                    </LinkButton>
                </div>
            </main>
        );
    }

    return (
        <main
            className="mobile-page safe-bottom space-y-6"
            aria-labelledby="loan-success-heading"
        >
            <section className="mobile-card rounded-3xl bg-white p-6 text-center shadow-sm">
                <Badge variant="success">
                    Lån registrerat
                </Badge>

                <h1
                    id="loan-success-heading"
                    className="mt-4"
                >
                    Registreringen är klar
                </h1>

                <p className="mt-2 text-slate-700">
                    Utrustningen är nu
                    markerad som utlånad.
                </p>
            </section>

            <section
                className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6"
                aria-labelledby="loan-summary-heading"
            >
                <h2 id="loan-summary-heading">
                    Sammanfattning
                </h2>

                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <SummaryItem
                        label="Låne-id"
                        value={loanId}
                    />

                    <SummaryItem
                        label="Utrustning"
                        value={
                            typeLabels[
                                equipmentType
                                ] ||
                            equipmentType
                        }
                    />

                    <SummaryItem
                        label="Serienummer"
                        value={serialNumber}
                    />

                    <SummaryItem
                        label="Låntagare"
                        value={borrowerName}
                    />

                    <SummaryItem
                        label="Registrerat"
                        value={formatDateTime(
                            loanDate
                        )}
                    />

                    <SummaryItem
                        label="Förväntad återlämning"
                        value={formatDate(
                            expectedReturnDate
                        )}
                    />
                </dl>
            </section>

            <nav
                className="flex flex-col gap-3 sm:flex-row"
                aria-label="Fortsätt efter registrerat lån"
            >
                <LinkButton
                    to="/admin"
                    size="lg"
                    fullWidth
                    className="sm:flex-1"
                >
                    Till utrustningen
                </LinkButton>

                <LinkButton
                    to="/admin/loans"
                    variant="outline"
                    size="lg"
                    fullWidth
                    className="sm:flex-1"
                >
                    Visa lånehistorik
                </LinkButton>
            </nav>
        </main>
    );
}

function SummaryItem({
                         label,
                         value,
                     }) {
    return (
        <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-700">
                {label}
            </dt>

            <dd className="mt-1 break-words font-semibold text-slate-900">
                {value || "–"}
            </dd>
        </div>
    );
}

function formatDate(value) {
    if (!value) {
        return "–";
    }

    return new Intl.DateTimeFormat(
        "sv-SE",
        {
            dateStyle: "long",
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