import { Link } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

function HomePage() {
    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white shadow-xl">
                <div className="flex flex-col gap-8 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-12">
                    <div className="max-w-2xl space-y-5">
                        <div className="space-y-4">
                            <h1 className="text-white">
                                Hantera hockeyutrustning snabbt och enkelt
                            </h1>

                            <p className="max-w-xl text-base text-blue-100 sm:text-lg">
                                HockeyLån gör det enkelt att låna ut,
                                administrera och följa upp klubbens
                                hockeyutrustning direkt från mobilen.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link to="/admin">
                                <Button size="lg">
                                    Öppna adminpanel
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