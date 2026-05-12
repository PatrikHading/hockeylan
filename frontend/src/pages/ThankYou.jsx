import { Link } from "react-router-dom";

function ThankYou() {
    return (
        <main className="min-h-screen bg-slate-100 p-6">
            <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 text-center shadow">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                    ✓
                </div>

                <h1 className="text-2xl font-bold text-slate-900">Tack!</h1>

                <p className="mt-3 text-slate-600">
                    Lånet har registrerats. Kom ihåg att lämna tillbaka utrustningen enligt
                    lagets instruktioner.
                </p>

                <Link
                    to="/"
                    className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
                >
                    Till startsidan
                </Link>
            </div>
        </main>
    );
}

export default ThankYou;