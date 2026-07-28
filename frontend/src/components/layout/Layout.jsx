import { Link, NavLink, Outlet } from "react-router";

function Layout() {
    const navLinkClass = ({ isActive }) =>
        [
            "rounded-full px-4 py-2 text-sm font-bold transition",
            "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-950",
            isActive
                ? "bg-red-600 text-white shadow-sm"
                : "text-blue-50 hover:bg-white/10 hover:text-white",
        ].join(" ");

    return (
        <div className="min-h-screen bg-slate-100 text-slate-950">
            <header className="sticky top-0 z-40 bg-blue-950 text-white shadow-md">
                <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4">
                        <Link
                            to="/"
                            className="flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-950"
                            aria-label="Gå till startsidan"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-blue-950 shadow-sm">
                                HL
                            </div>

                            <p className="text-xl font-black tracking-tight text-white">
                                HockeyLån
                            </p>
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
                <div className="mx-auto max-w-6xl px-4 py-5 text-sm font-semibold text-blue-950 sm:px-6 lg:px-8">
                    HockeyLån – (c) NorOps
                </div>
            </footer>
        </div>
    );
}

export default Layout;