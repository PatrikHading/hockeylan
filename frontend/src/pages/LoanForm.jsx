import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import FormField from "../components/ui/FormField";

function LoanForm() {
    const { serialNumber } = useParams();
    const navigate = useNavigate();

    const [equipment, setEquipment] = useState(null);
    const [formData, setFormData] = useState({
        borrowerName: "",
        email: "",
        phoneNumber: "",
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        async function fetchEquipment() {
            try {
                const response = await api.get(`/loan/${serialNumber}`);
                setEquipment(response.data);
                setErrorMessage("");
            } catch (error) {
                setErrorMessage("Kunde inte hitta utrustningen.");
            } finally {
                setLoading(false);
            }
        }

        fetchEquipment();
    }, [serialNumber]);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function validateForm() {
        if (!formData.borrowerName.trim()) {
            setErrorMessage("Namn måste fyllas i.");
            return false;
        }

        if (!formData.email.trim()) {
            setErrorMessage("E-post måste fyllas i.");
            return false;
        }

        if (!formData.phoneNumber.trim()) {
            setErrorMessage("Telefonnummer måste fyllas i.");
            return false;
        }

        return true;
    }

    function handleSubmit(event) {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        setErrorMessage("");
        setConfirmOpen(true);
    }

    async function handleConfirmLoan() {
        try {
            setSubmitting(true);
            setErrorMessage("");

            await api.post(`/loan/${serialNumber}`, {
                borrowerName: formData.borrowerName.trim(),
                email: formData.email.trim(),
                phoneNumber: formData.phoneNumber.trim(),
            });

            navigate("/loan/success");
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Kunde inte registrera lånet."
            );
            setConfirmOpen(false);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-3xl space-y-6">
                <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                    <div className="h-6 w-32 animate-pulse rounded-full bg-slate-100" />
                    <div className="mt-4 h-10 w-3/4 animate-pulse rounded-xl bg-slate-100" />
                    <div className="mt-3 h-5 w-full animate-pulse rounded-xl bg-slate-100" />
                </section>

                <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                    <div className="grid gap-4">
                        <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
                        <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
                        <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
                    </div>
                </section>
            </div>
        );
    }

    if (errorMessage && !equipment) {
        return (
            <div className="mx-auto max-w-3xl space-y-6">
                <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                    <Badge variant="danger">Utrustning saknas</Badge>

                    <h1 className="mt-3">Utrustning hittades inte</h1>

                    <p className="mt-2">
                        Kontrollera att QR-koden är korrekt eller kontakta ansvarig.
                    </p>
                </section>

                <Alert title="Något gick fel" variant="danger">
                    {errorMessage}
                </Alert>
            </div>
        );
    }

    if (!equipment.available) {
        return (
            <div className="mx-auto max-w-3xl space-y-6">
                <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                    <Badge variant="warning">Ej tillgänglig</Badge>

                    <h1 className="mt-3">Utrustningen är redan utlånad</h1>

                    <p className="mt-2">
                        Denna utrustning är inte tillgänglig just nu.
                    </p>
                </section>

                <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                    <h2>Utrustning</h2>

                    <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <dt className="text-sm font-bold text-slate-500">Typ</dt>
                            <dd className="mt-1 font-semibold text-slate-900">
                                {equipment.type}
                            </dd>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                            <dt className="text-sm font-bold text-slate-500">
                                Serienummer
                            </dt>
                            <dd className="mt-1 font-mono font-semibold text-slate-900">
                                {equipment.serialNumber}
                            </dd>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                            <dt className="text-sm font-bold text-slate-500">
                                Beskrivning
                            </dt>
                            <dd className="mt-1 font-semibold text-slate-900">
                                {equipment.description || "-"}
                            </dd>
                        </div>
                    </dl>
                </section>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <section className="rounded-3xl bg-blue-950 p-5 text-white shadow-sm sm:p-6">
                <Badge variant="danger">Utlåning</Badge>

                <h1 className="mt-3 text-white">Låna utrustning</h1>

                <p className="mt-2 max-w-2xl text-blue-100">
                    Fyll i dina uppgifter för att registrera lånet.
                </p>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <h2>Vald utrustning</h2>

                <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                        <dt className="text-sm font-bold text-slate-500">Typ</dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                            {equipment.type}
                        </dd>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                        <dt className="text-sm font-bold text-slate-500">
                            Serienummer
                        </dt>
                        <dd className="mt-1 font-mono font-semibold text-slate-900">
                            {equipment.serialNumber}
                        </dd>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                        <dt className="text-sm font-bold text-slate-500">
                            Beskrivning
                        </dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                            {equipment.description || "-"}
                        </dd>
                    </div>
                </dl>
            </section>

            {errorMessage && (
                <Alert title="Kunde inte registrera lån" variant="danger">
                    {errorMessage}
                </Alert>
            )}

            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <FormField id="borrowerName" label="Namn" required>
                        <input
                            id="borrowerName"
                            name="borrowerName"
                            value={formData.borrowerName}
                            onChange={handleChange}
                            placeholder="För- och efternamn"
                            autoComplete="name"
                            required
                        />
                    </FormField>

                    <FormField id="email" label="E-postadress" required>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="namn@example.com"
                            autoComplete="email"
                            required
                        />
                    </FormField>

                    <FormField id="phoneNumber" label="Telefonnummer" required>
                        <input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="0701-234 567"
                            autoComplete="tel"
                            required
                        />
                    </FormField>

                    <Button type="submit" disabled={submitting} fullWidth size="lg">
                        {submitting ? "Registrerar..." : "Registrera lån"}
                    </Button>
                </form>
            </section>

            <ConfirmDialog
                open={confirmOpen}
                title="Bekräfta lån"
                message={`Vill du registrera lån av ${equipment.serialNumber}?`}
                confirmText="Ja, registrera lån"
                cancelText="Avbryt"
                loading={submitting}
                variant="primary"
                onConfirm={handleConfirmLoan}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
}

export default LoanForm;