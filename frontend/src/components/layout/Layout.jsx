import {
    Link,
    NavLink,
    Outlet,
} from "react-router";

function Layout() {
    const navLinkClass = ({
                              isActive,
                          }) =>
        [
            "inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-bold transition",
            "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-950",
            isActive
                ? "bg-red-600 text-white shadow-sm"
                : "text-blue-50 hover:bg-white/10 hover:text-white",
        ].join(" ");

    return (
        <div className="min-h-screen bg-slate-100 text-slate-950">
            <a
                href="#main-content"
                className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-xl bg-white px-4 py-3 font-bold text-blue-950 shadow-xl transition focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
            >
                Hoppa till innehållet
            </a>

            <header className="sticky top-0 z-40 bg-blue-950 text-white shadow-md">
                <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4">
                        <Link
                            to="/"
                            className="flex min-h-11 items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-950"
                            aria-label="HockeyLån – gå till startsidan"
                        >
                            <span
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-blue-950 shadow-sm"
                                aria-hidden="true"
                            >
                                HL
                            </span>

                            <span className="text-xl font-black tracking-tight text-white">
                                HockeyLån
                            </span>
                        </Link>
                    </div>

                    <nav aria-label="Huvudnavigation">
                        <ul className="flex flex-wrap items-center gap-2">
                            <li>
                                <NavLink
                                    to="/"
                                    end
                                    className={
                                        navLinkClass
                                    }
                                >
                                    Start
                                </NavLink>
                            </li>

                            <li>
                                <NavLink
                                    to="/admin"
                                    end
                                    className={
                                        navLinkClass
                                    }
                                >
                                    Utrustning
                                </NavLink>
                            </li>

                            <li>
                                <NavLink
                                    to="/admin/loans"
                                    className={
                                        navLinkClass
                                    }
                                >
                                    Lånehistorik
                                </NavLink>
                            </li>
                        </ul>
                    </nav>
                </div>
            </header>

            <div
                id="main-content"
                tabIndex={-1}
                className="mx-auto w-full max-w-6xl px-4 py-6 focus:outline-none sm:px-6 sm:py-8 lg:px-8"
            >
                <Outlet />
            </div>

            <footer className="border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm font-semibold text-blue-950 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <p>
                        HockeyLån – © NorOps
                    </p>

                    <Link
                        to="/integritet"
                        className="inline-flex min-h-11 w-fit items-center rounded text-blue-800 underline decoration-2 underline-offset-4 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2"
                    >
                        Integritet och
                        personuppgifter
                    </Link>
                </div>
            </footer>
        </div>
    );
}

export default Layout;