import {
    Link,
    useLocation,
} from "react-router";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

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
            <div className="mobile-page safe-bottom">
                <Alert
                    title="Ingen lånesammanfattning"
                    variant="warning"
                >
                    Öppna ett registrerat lån
                    från administratörsvyn.
                </Alert>

                <div className="mt-4">
                    <Link to="/admin">
                        <Button>
                            Till adminvyn
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mobile-page safe-bottom space-y-6">
            <section className="mobile-card rounded-3xl bg-white p-6 text-center shadow-sm">
                <Badge variant="success">
                    Lån registrerat
                </Badge>

                <h1 className="mt-4">
                    Registreringen är klar
                </h1>

                <p className="mt-2 text-slate-600">
                    Utrustningen är nu
                    markerad som utlånad.
                </p>
            </section>

            <section className="mobile-card rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <h2>
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
                                ] || equipmentType
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
                        value={
                            formatDateTime(
                                loanDate
                            )
                        }
                    />

                    <SummaryItem
                        label="Förväntad återlämning"
                        value={
                            formatDate(
                                expectedReturnDate
                            )
                        }
                    />
                </dl>
            </section>

            <section className="flex flex-col gap-3 sm:flex-row">
                <Link
                    to="/admin"
                    className="sm:flex-1"
                >
                    <Button
                        fullWidth
                        size="lg"
                    >
                        Till utrustningen
                    </Button>
                </Link>

                <Link
                    to="/admin/loans"
                    className="sm:flex-1"
                >
                    <Button
                        variant="outline"
                        fullWidth
                        size="lg"
                    >
                        Visa lånehistorik
                    </Button>
                </Link>
            </section>
        </div>
    );
}

function SummaryItem({
                         label,
                         value,
                     }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
            </dt>

            <dd className="mt-1 font-semibold text-slate-900">
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