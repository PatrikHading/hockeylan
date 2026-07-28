import { Link } from "react-router";
import Button from "../components/ui/Button";

function HomePage() {

    return (
        <div className="mobile-page space-y-6">

            <section className="mobile-card overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white shadow-xl">

                <div className="px-5 py-8 sm:px-10 sm:py-14 lg:px-16 lg:py-20">

                    <div className="max-w-2xl space-y-6">

                        <div className="space-y-4">

                            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                                HockeyLån
                            </h1>

                            <p className="text-lg font-bold text-blue-100">
                                Hantera hockeyutrustning snabbt och enkelt
                            </p>

                            <p className="max-w-xl text-base leading-relaxed text-blue-50 sm:text-lg">
                                HockeyLån gör det enkelt att låna ut, administrera och följa
                                upp klubbens hockeyutrustning direkt från mobilen.
                            </p>

                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">

                            <Link to="/scan">
                                <Button
                                    size="lg"
                                    className="mobile-button w-full bg-green-600 hover:bg-green-500"
                                >
                                    Skanna QR-kod
                                </Button>
                            </Link>

                            <Link to="/admin">
                                <Button
                                    size="lg"
                                    className="mobile-button w-full"
                                >
                                    Öppna admin-panel
                                </Button>
                            </Link>

                        </div>

                    </div>
                </div>
            </section>

            <section className="mobile-card bg-white p-5 shadow-sm sm:p-6">

                <h2>Så fungerar det</h2>

                <div className="mt-4 grid gap-3 text-slate-700">

                    <p>
                        1. Skanna QR-koden på utrustningen
                    </p>

                    <p>
                        2. Fyll i låneuppgifter
                    </p>

                    <p>
                        3. Bekräfta lånet direkt i mobilen
                    </p>

                </div>

            </section>

        </div>
    );
}

export default HomePage;