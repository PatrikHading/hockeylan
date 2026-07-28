import { useState } from "react";
import {
    Navigate,
    useLocation,
    useNavigate,
} from "react-router";
import { useAuth } from "../auth/useAuth";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import FormField from "../components/ui/FormField";

export default function AdminLoginPage() {
    const { authenticated, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    if (authenticated) {
        return <Navigate to="/admin" replace />;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSubmitting(true);
            setErrorMessage("");

            await login(username.trim(), password);

            const destination =
                location.state?.from?.pathname || "/admin";

            navigate(destination, { replace: true });
        } catch (error) {
            if (error.response?.status === 429) {
                setErrorMessage(
                    "För många inloggningsförsök. Försök igen senare."
                );
            } else {
                setErrorMessage(
                    error.response?.data?.message ||
                    "Felaktigt användarnamn eller lösenord."
                );
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mx-auto max-w-md space-y-6">
            <section className="rounded-3xl bg-white p-6 shadow-sm">
                <h1>Administratörsinloggning</h1>

                <p className="mt-2 text-slate-600">
                    Logga in för att hantera utrustning och återlämningar.
                </p>
            </section>

            {errorMessage && (
                <Alert title="Inloggningen misslyckades" variant="danger">
                    {errorMessage}
                </Alert>
            )}

            <section className="rounded-3xl bg-white p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <FormField
                        id="admin-username"
                        label="Användarnamn"
                        required
                    >
                        <input
                            id="admin-username"
                            name="username"
                            value={username}
                            onChange={(event) =>
                                setUsername(event.target.value)
                            }
                            autoComplete="username"
                            maxLength="100"
                            required
                        />
                    </FormField>

                    <FormField
                        id="admin-password"
                        label="Lösenord"
                        required
                    >
                        <input
                            id="admin-password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            autoComplete="current-password"
                            maxLength="200"
                            required
                        />
                    </FormField>

                    <Button
                        type="submit"
                        disabled={submitting}
                        fullWidth
                    >
                        {submitting ? "Loggar in..." : "Logga in"}
                    </Button>
                </form>
            </section>
        </div>
    );
}