import { Link } from "react-router";

export default function NotFoundPage() {
    return (
        <main
            className="mx-auto max-w-2xl px-4 py-10 sm:py-16"
            aria-labelledby="not-found-heading"
        >
            <section className="rounded-3xl bg-white p-6 text-center shadow-sm sm:p-10">
                <p
                    className="text-sm font-bold uppercase tracking-wider text-red-700"
                    aria-hidden="true"
                >
                    Fel 404
                </p>

                <h1
                    id="not-found-heading"
                    className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl"
                >
                    Sidan kunde inte hittas
                </h1>

                <p className="mx-auto mt-4 max-w-lg leading-relaxed text-slate-700">
                    Adressen kan vara felaktig eller så kan sidan
                    ha flyttats.
                </p>

                <nav
                    className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
                    aria-label="Alternativ efter saknad sida"
                >
                    <Link
                        to="/"
                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                    >
                        Till startsidan
                    </Link>

                    <Link
                        to="/admin/login"
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-950 focus:ring-offset-2"
                    >
                        Administratörsinloggning
                    </Link>
                </nav>
            </section>
        </main>
    );
}