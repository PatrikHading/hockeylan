import { Link, useLocation } from "react-router-dom";

export default function ThankYou() {

    const location = useLocation();

    const {
        equipmentType,
        serialNumber,
        borrowerName,
        timestamp
    } = location.state || {};

    const formattedDate = timestamp
        ? new Date(timestamp).toLocaleString("sv-SE")
        : null;

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">

            <div className="w-full max-w-xl">

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">

                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-center">

                        <div className="text-6xl mb-4">
                            ✅
                        </div>

                        <h1 className="text-4xl font-bold text-white mb-3">
                            Lån registrerat
                        </h1>

                        <p className="text-green-100 text-lg">
                            Utrustningen är nu utlånad
                        </p>

                    </div>

                    <div className="p-6 md:p-8">

                        {equipmentType && (
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-6">

                                <h2 className="text-white font-bold text-xl mb-4">
                                    Sammanfattning
                                </h2>

                                <div className="space-y-4">

                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-400">
                                            Utrustning
                                        </span>

                                        <span className="text-white font-semibold text-right">
                                            {equipmentType}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-400">
                                            Serienummer
                                        </span>

                                        <span className="text-white font-semibold text-right">
                                            {serialNumber}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-400">
                                            Låntagare
                                        </span>

                                        <span className="text-white font-semibold text-right">
                                            {borrowerName}
                                        </span>
                                    </div>

                                    {formattedDate && (
                                        <div className="flex justify-between gap-4">
                                            <span className="text-slate-400">
                                                Tidpunkt
                                            </span>

                                            <span className="text-white font-semibold text-right">
                                                {formattedDate}
                                            </span>
                                        </div>
                                    )}

                                </div>

                            </div>
                        )}

                        <div className="bg-green-950 border border-green-800 rounded-2xl p-5 mb-6">

                            <p className="text-green-300 text-center font-medium">
                                Tack! Kom ihåg att återlämna utrustningen efter användning.
                            </p>

                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            <Link
                                to="/"
                                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-2xl transition-all text-center"
                            >
                                Till startsidan
                            </Link>

                            <button
                                onClick={() => window.close()}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-4 rounded-2xl transition-all"
                            >
                                Stäng sida
                            </button>

                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}