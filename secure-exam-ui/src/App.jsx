import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import ProfessorDashboard from "./pages/ProfessorDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Calibration from "./pages/Calibration"; // 🛡️ NOUVEAU: Import de la calibration
import ExamRoom from "./pages/ExamRoom";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

// Gestionnaire d'affichage de la barre de navigation
const Layout = ({ children }) => {
  const location = useLocation();

  // 🛡️ CORRECTION : On utilise bien "/calibration"
  const hideNavbar =
    location.pathname === "/" ||
    location.pathname.startsWith("/exam") ||
    location.pathname.startsWith("/calibration");

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {!hideNavbar && <Navbar />}
      {children}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Route publique (Authentification SSO) */}
          <Route path="/" element={<Login />} />

          {/* Routes Protégées par Profil */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/professor-dashboard"
            element={
              <ProtectedRoute allowedRoles={["Professor"]}>
                <ProfessorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* 🛡️ CORRECTION : La porte d'entrée Biométrique avec le bon chemin */}
          <Route
            path="/calibration/:examId"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <Calibration />
              </ProtectedRoute>
            }
          />

          {/* 🎓 ÉTAPE 2 : La salle d'Examen */}
          <Route
            path="/exam/:examId"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <ExamRoom />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
