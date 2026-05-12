import { Link } from "react-router-dom";

function ThankYou() {
    return (
        <main className="min-h-screen bg-slate-100 p-6">
            <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
                <h1 className="text-2xl font-bold text-slate-900">Tack!</h1>
                <p className="mt-2 text-slate-600">Lånet har registrerats.</p>

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