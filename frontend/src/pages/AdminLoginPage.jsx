import {
    useEffect,
    useRef,
    useState,
} from "react";
import {
    Navigate,
    useLocation,
    useNavigate,
} from "react-router";
import {
    getErrorMessage,
} from "../api/api";
import { useAuth } from "../auth/useAuth";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import FormField from "../components/ui/FormField";

function getSafeDestination(from) {
    if (
        !from ||
        typeof from.pathname !== "string" ||
        !from.pathname.startsWith("/") ||
        from.pathname.startsWith("//") ||
        from.pathname === "/admin/login"
    ) {
        return "/admin";
    }

    const search =
        typeof from.search === "string" &&
        from.search.startsWith("?")
            ? from.search
            : "";

    const hash =
        typeof from.hash === "string" &&
        from.hash.startsWith("#")
            ? from.hash
            : "";

    return `${from.pathname}${search}${hash}`;
}

export default function AdminLoginPage() {
    const {
        authenticated,
        login,
        sessionExpired,
    } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    const [username, setUsername] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const submissionInProgressRef =
        useRef(false);

    const errorContainerRef =
        useRef(null);

    const destination =
        getSafeDestination(
            location.state?.from
        );

    useEffect(() => {
        if (errorMessage) {
            errorContainerRef.current?.focus();
        }
    }, [errorMessage]);

    if (authenticated) {
        return (
            <Navigate
                to={destination}
                replace
            />
        );
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (
            submissionInProgressRef.current
        ) {
            return;
        }

        submissionInProgressRef.current =
            true;

        setSubmitting(true);
        setErrorMessage("");

        try {
            await login(
                username.trim(),
                password
            );

            navigate(
                destination,
                {
                    replace: true,
                }
            );
        } catch (error) {
            setPassword("");

            setErrorMessage(
                getErrorMessage(
                    error,
                    "Inloggningen misslyckades. Kontrollera dina uppgifter och försök igen."
                )
            );
        } finally {
            submissionInProgressRef.current =
                false;

            setSubmitting(false);
        }
    }

    return (
        <main
            className="mx-auto max-w-md space-y-6"
            aria-labelledby="admin-login-heading"
        >
            <section className="rounded-3xl bg-white p-6 shadow-sm">
                <h1
                    id="admin-login-heading"
                    className="text-2xl font-black text-slate-900"
                >
                    Administratörsinloggning
                </h1>

                <p className="mt-2 text-slate-700">
                    Logga in för att hantera
                    utrustning och
                    återlämningar.
                </p>
            </section>

            {sessionExpired && (
                <Alert
                    title="Din session har gått ut"
                    variant="warning"
                >
                    Logga in igen för att
                    fortsätta där du var.
                </Alert>
            )}

            {errorMessage && (
                <div
                    ref={errorContainerRef}
                    tabIndex={-1}
                    className="rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2"
                >
                    <Alert
                        title="Inloggningen misslyckades"
                        variant="danger"
                    >
                        {errorMessage}
                    </Alert>
                </div>
            )}

            <section className="rounded-3xl bg-white p-6 shadow-sm">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    aria-busy={
                        submitting
                    }
                >
                    <FormField
                        id="admin-username"
                        label="Användarnamn"
                        required
                    >
                        <input
                            name="username"
                            value={
                                username
                            }
                            onChange={(
                                event
                            ) =>
                                setUsername(
                                    event
                                        .target
                                        .value
                                )
                            }
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck="false"
                            maxLength={100}
                            disabled={
                                submitting
                            }
                        />
                    </FormField>

                    <FormField
                        id="admin-password"
                        label="Lösenord"
                        required
                    >
                        <input
                            name="password"
                            type="password"
                            value={
                                password
                            }
                            onChange={(
                                event
                            ) =>
                                setPassword(
                                    event
                                        .target
                                        .value
                                )
                            }
                            autoComplete="current-password"
                            maxLength={200}
                            disabled={
                                submitting
                            }
                        />
                    </FormField>

                    <Button
                        type="submit"
                        loading={
                            submitting
                        }
                        loadingText="Loggar in..."
                        fullWidth
                    >
                        Logga in
                    </Button>
                </form>
            </section>
        </main>
    );
}