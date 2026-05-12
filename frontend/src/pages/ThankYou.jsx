import { Link } from "react-router-dom";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

function ThankYou() {
    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <section className="rounded-3xl bg-white p-6 text-center shadow-sm sm:p-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl font-black text-green-700">
                    ✓
                </div>

                <Badge variant="success" className="mt-5">
                    Lån registrerat
                </Badge>

                <h1 className="mt-4">Tack!</h1>

                <p className="mt-3">
                    Ditt lån av hockeyutrustning har registrerats.
                </p>

                <div className="mt-6">
                    <Link to="/">
                        <Button fullWidth size="lg">
                            Till startsidan
                        </Button>
                    </Link>
                </div>
            </section>

            <Alert title="Information" variant="info">
                Kontakta ansvarig ledare om något blivit fel eller om du behöver hjälp
                med återlämning.
            </Alert>
        </div>
    );
}

export default ThankYou;