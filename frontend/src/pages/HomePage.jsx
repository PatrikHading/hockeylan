import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

function HomePage() {
    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white shadow-xl">
                <div className="px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-20">
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

                        <div className="pt-2">
                            <Link to="/admin">
                                <Button size="lg" className="w-full sm:w-auto">
                                    Öppna admin-panel
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default HomePage;