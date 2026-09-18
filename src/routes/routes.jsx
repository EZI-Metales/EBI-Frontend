import { Routes, Route, Navigate } from "react-router-dom";
import { AuthGuard } from "@auth/components/AuthGuard";
import { useDynamicRoutes } from "./DynamicRoutes";

// Layout
import Layout from "@/components/Layout/Layout.jsx";

// Public Pages
import LoginPage from "@pages/Login";

// Protected Pages
import HomePage from "@/pages/Home";
import TestPage from "@pages/Test";
import BalanceScoreCardPage from "@pages/BalanceScoreCard";
import NotFoundPage from "@pages/NotFound";

const AppRoutes = () => {
  const dynamicRoutes = useDynamicRoutes();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <AuthGuard>
            <Layout />
          </AuthGuard>
        }
      >
        {/* Ruta raíz: redirige a inicio */}
        <Route path="/" element={<Navigate to="/inicio" replace />} />
        
        {/* Rutas estáticas */}
        <Route path="/inicio" element={<HomePage />} />
        <Route path="/balance-score-card" element={<BalanceScoreCardPage />} />
        <Route path="/test" element={<TestPage />} />
        
        {/* Rutas dinámicas generadas desde el menú */}
        {dynamicRoutes}
        
        {/* Página 404 */}
        <Route path="/not-found" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
