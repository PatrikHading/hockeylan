import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import AdminPage from "./pages/AdminPage";
import AddEquipment from "./pages/AddEquipment";
import QrCodeView from "./pages/QrCodeView";
import LoanForm from "./pages/LoanForm";
import ThankYou from "./pages/ThankYou";
import HomePage from "./pages/HomePage";

function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/add" element={<AddEquipment />} />
                <Route path="/admin/qr/:id" element={<QrCodeView />} />
                <Route path="/loan/:serialNumber" element={<LoanForm />} />
                <Route path="/loan/success" element={<ThankYou />} />
            </Route>
        </Routes>
    );
}

export default App;