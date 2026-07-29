import {
    Route,
    Routes,
} from "react-router";
import ProtectedAdminRoute from "./auth/ProtectedAdminRoute";
import Layout from "./components/layout/Layout";
import ActiveLoansPage from "./pages/ActiveLoansPage";
import AddEquipment from "./pages/AddEquipment";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminPage from "./pages/AdminPage";
import EditEquipment from "./pages/EditEquipment";
import HomePage from "./pages/HomePage";
import LoanForm from "./pages/LoanForm";
import QrCodeView from "./pages/QrCodeView";
import QrScannerPage from "./pages/QrScannerPage";
import ThankYou from "./pages/ThankYou";

function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route
                    path="/"
                    element={<HomePage />}
                />

                <Route
                    path="/admin/login"
                    element={
                        <AdminLoginPage />
                    }
                />

                <Route
                    element={
                        <ProtectedAdminRoute />
                    }
                >
                    <Route
                        path="/admin"
                        element={<AdminPage />}
                    />

                    <Route
                        path="/admin/loans"
                        element={
                            <ActiveLoansPage />
                        }
                    />

                    <Route
                        path="/admin/add"
                        element={
                            <AddEquipment />
                        }
                    />

                    <Route
                        path="/admin/equipment/:id/edit"
                        element={
                            <EditEquipment />
                        }
                    />

                    <Route
                        path="/admin/qr/:id"
                        element={
                            <QrCodeView />
                        }
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
                    element={
                        <QrScannerPage />
                    }
                />
            </Route>
        </Routes>
    );
}

export default App;