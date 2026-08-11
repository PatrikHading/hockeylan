import { Link } from "react-router";
import "./NotFoundPage.css";

function HockeyRinkAnimation() {
    return (
        <div
            className="not-found-rink"
            role="img"
            aria-label="En hockeypuck glider över isen och missar målet"
        >
            <div className="not-found-rink__center-line" />

            <div
                className={[
                    "not-found-rink__blue-line",
                    "not-found-rink__blue-line--left",
                ].join(" ")}
            />

            <div
                className={[
                    "not-found-rink__blue-line",
                    "not-found-rink__blue-line--right",
                ].join(" ")}
            />

            <div
                className={[
                    "not-found-rink__faceoff-circle",
                    "not-found-rink__faceoff-circle--top-left",
                ].join(" ")}
            />

            <div
                className={[
                    "not-found-rink__faceoff-circle",
                    "not-found-rink__faceoff-circle--bottom-left",
                ].join(" ")}
            />

            <div
                className={[
                    "not-found-rink__faceoff-circle",
                    "not-found-rink__faceoff-circle--top-right",
                ].join(" ")}
            />

            <div
                className={[
                    "not-found-rink__faceoff-circle",
                    "not-found-rink__faceoff-circle--bottom-right",
                ].join(" ")}
            />

            <div className="not-found-rink__center-circle" />

            <div className="not-found-rink__crease" />

            <div className="not-found-rink__goal">
                <span className="not-found-rink__goal-line" />
            </div>

            <div className="not-found-rink__puck" />
        </div>
    );
}

export default function NotFoundPage() {
    return (
        <main
            className="mx-auto max-w-4xl py-4 sm:py-8"
            aria-labelledby="not-found-heading"
        >
            <section className="overflow-hidden rounded-3xl bg-white shadow-lg">
                <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 px-4 py-6 sm:px-8 sm:py-8">
                    <HockeyRinkAnimation />
                </div>

                <div className="px-6 py-8 text-center sm:px-10 sm:py-10">
                    <p
                        className="text-sm font-black uppercase tracking-[0.2em] text-red-700"
                        aria-hidden="true"
                    >
                        Fel 404
                    </p>

                    <h1
                        id="not-found-heading"
                        className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"
                    >
                        Pucken missade målet
                    </h1>

                    <p className="mx-auto mt-4 max-w-xl leading-relaxed text-slate-700">
                        Sidan du letar efter finns inte,
                        har flyttats eller befinner sig
                        utanför rinken.
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
                </div>
            </section>
        </main>
    );
}