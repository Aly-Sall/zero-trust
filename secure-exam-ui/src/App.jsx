import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard"; // 👈 Vérifie cet import
import ProfessorDashboard from "./pages/ProfessorDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ExamRoom from "./pages/ExamRoom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />{" "}
        {/* 👈 LA ROUTE MANQUANTE */}
        <Route path="/dashboard" element={<ProfessorDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/exam/:examId" element={<ExamRoom />} />
      </Routes>
    </Router>
  );
}

export default App;
