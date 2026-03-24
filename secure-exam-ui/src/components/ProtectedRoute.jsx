import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  // On vérifie si l'utilisateur a un badge (s'il est connecté)
  const userProfile = JSON.parse(localStorage.getItem("userProfile"));

  // S'il n'est pas connecté, on le renvoie à la porte (Login)
  if (!userProfile) {
    return <Navigate to="/" replace />;
  }

  // S'il essaie d'entrer dans une pièce où il n'a pas le droit (ex: un étudiant chez l'admin)
  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    // On le renvoie dans son propre bureau
    if (userProfile.role === "Admin")
      return <Navigate to="/admin-dashboard" replace />;
    if (userProfile.role === "Professor")
      return <Navigate to="/professor-dashboard" replace />;
    if (userProfile.role === "Student")
      return <Navigate to="/student-dashboard" replace />;
  }

  // S'il a le droit, on le laisse passer et on affiche la page demandée
  return children;
}
