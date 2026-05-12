import { Link, NavLink, Outlet } from "react-router-dom";

function Layout() {
    const navLinkClass = ({ isActive }) =>
        [
            "rounded-full px-3 py-2 text-sm font-semibold transition",
            "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-950",
            isActive
                ? "bg-red-600 text-white shadow-sm"
                : "text-blue-50 hover:bg-white/10 hover:text-white",
        ].join(" ");

    return (
        <div className="min-h-screen bg-slate-100 text-slate-950">
            <header className="bg-blue-950 text-white shadow-md">
                <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4">
                        <Link
                            to="/"
                            className="group flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-950"
                            aria-label="Gå till startsidan"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg font-black text-blue-950 shadow-sm">
                                BF
                            </div>

                            <div>
                                <p className="text-lg font-black tracking-tight text-white">
                                    HockeyLån
                                </p>
                            </div>
                        </Link>

                    </div>

                    <nav aria-label="Huvudnavigation">
                        <ul className="flex flex-wrap items-center gap-2">
                            <li>
                                <NavLink to="/" className={navLinkClass}>
                                    Start
                                </NavLink>
                            </li>

                            <li>
                                <NavLink to="/admin" className={navLinkClass}>
                                    Admin
                                </NavLink>
                            </li>
                        </ul>
                    </nav>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <Outlet />
            </main>

            <footer className="border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <p className="font-medium text-slate-700">
                        HockeyLån – (c) NorOps
                    </p>
                    <p>Enkelt system för utlåning av hockeyutrustning.</p>
                </div>
            </footer>
        </div>
    );
}

export default Layout;