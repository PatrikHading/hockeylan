import { Link, Route, Routes } from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import AddEquipment from "./pages/AddEquipment";
import QrCodeView from "./pages/QrCodeView";
import LoanForm from "./pages/LoanForm";
import ThankYou from "./pages/ThankYou";

function HomePage() {
  return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
          <h1 className="mb-4 text-3xl font-bold text-slate-900">
            Hockey Utrustningslån
          </h1>

          <p className="mb-6 text-slate-600">
            System för hantering av utlåning av hockeyutrustning.
          </p>

          <Link
              to="/admin"
              className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
          >
            Gå till admin
          </Link>
        </div>
      </main>
  );
}

function App() {
  return (
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/add" element={<AddEquipment />} />
        <Route path="/admin/qr/:id" element={<QrCodeView />} />
        <Route path="/loan/:serialNumber" element={<LoanForm />} />
        <Route path="/loan/success" element={<ThankYou />} />
      </Routes>
  );
}

export default App;