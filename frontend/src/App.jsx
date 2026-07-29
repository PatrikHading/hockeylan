import { Route, Routes } from "react-router";
import Layout from "./components/layout/Layout";
import ProtectedAdminRoute from "./auth/ProtectedAdminRoute";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminPage from "./pages/AdminPage";
import ActiveLoansPage from "./pages/ActiveLoansPage";
import AddEquipment from "./pages/AddEquipment";
import QrCodeView from "./pages/QrCodeView";
import LoanForm from "./pages/LoanForm";
import ThankYou from "./pages/ThankYou";
import HomePage from "./pages/HomePage";
import QrScannerPage from "./pages/QrScannerPage";

function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />

                <Route
                    path="/admin/login"
                    element={<AdminLoginPage />}
                />

                <Route element={<ProtectedAdminRoute />}>
                    <Route
                        path="/admin"
                        element={<AdminPage />}
                    />

                    <Route
                        path="/admin/loans"
                        element={<ActiveLoansPage />}
                    />

                    <Route
                        path="/admin/add"
                        element={<AddEquipment />}
                    />

                    <Route
                        path="/admin/qr/:id"
                        element={<QrCodeView />}
                    />
                </Route>

                <Route
                    path="/loan/:serialNumber"
                    element={<LoanForm />}
                />

                <Route
                    path="/loan/success"
                    element={<ThankYou />}
                />

                <Route
                    path="/thank-you"
                    element={<ThankYou />}
                />

                <Route
                    path="/scan"
                    element={<QrScannerPage />}
                />
            </Route>
        </Routes>
    );
}

export default App;