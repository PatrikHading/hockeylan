import { useParams } from "react-router-dom";

function LoanForm() {
    const { serialNumber } = useParams();

    return (
        <main className="min-h-screen bg-slate-100 p-6">
            <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
                <h1 className="text-2xl font-bold text-slate-900">Låna utrustning</h1>
                <p className="mt-2 text-slate-600">Serienummer: {serialNumber}</p>
            </div>
        </main>
    );
}

export default LoanForm;