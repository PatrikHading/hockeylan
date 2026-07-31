import LinkButton from "../components/ui/LinkButton";

function HomePage() {
    return (
        <main
            className="mobile-page space-y-6"
            aria-labelledby="home-heading"
        >
            <section className="mobile-card overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white shadow-xl">
                <div className="px-5 py-8 sm:px-10 sm:py-14 lg:px-16 lg:py-20">
                    <div className="max-w-2xl space-y-6">
                        <div className="space-y-4">
                            <h1
                                id="home-heading"
                                className="text-4xl font-black tracking-tight text-white sm:text-5xl"
                            >
                                HockeyLån
                            </h1>

                            <p className="text-lg font-bold text-blue-100">
                                Hantera hockeyutrustning
                                snabbt och enkelt
                            </p>

                            <p className="max-w-xl text-base leading-relaxed text-blue-50 sm:text-lg">
                                HockeyLån gör det enkelt
                                att låna ut, administrera
                                och följa upp klubbens
                                hockeyutrustning direkt
                                från mobilen.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <LinkButton
                                to="/scan"
                                size="lg"
                                fullWidth
                                className="mobile-button bg-green-700 hover:bg-green-600 focus:ring-green-400"
                            >
                                Skanna QR-kod
                            </LinkButton>

                            <LinkButton
                                to="/admin"
                                size="lg"
                                fullWidth
                                className="mobile-button"
                            >
                                Öppna adminpanel
                            </LinkButton>
                        </div>
                    </div>
                </div>
            </section>

            <section
                className="mobile-card bg-white p-5 shadow-sm sm:p-6"
                aria-labelledby="how-it-works-heading"
            >
                <h2 id="how-it-works-heading">
                    Så fungerar det
                </h2>

                <ol className="mt-4 grid list-decimal gap-3 pl-6 text-slate-800">
                    <li>
                        Skanna QR-koden på
                        utrustningen.
                    </li>

                    <li>
                        Fyll i låneuppgifterna
                        tillsammans med
                        låntagaren.
                    </li>

                    <li>
                        Kontrollera uppgifterna
                        och registrera lånet.
                    </li>
                </ol>
            </section>
        </main>
    );
}

export default HomePage;