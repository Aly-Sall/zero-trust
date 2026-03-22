import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 1. Appel à l'API C#
      const res = await api.post("/Auth/login", { email, password });

      // 2. On récupère le token ET les infos de l'utilisateur (qu'on a ajoutés dans le C# tout à l'heure)
      const { token, user } = res.data;

      // 3. On sauvegarde tout ça dans le navigateur
      localStorage.setItem("token", token);

      // Très important pour que l'étudiant voie les examens de sa classe (Cohorte)
      if (user) {
        localStorage.setItem("userProfile", JSON.stringify(user));

        // 4. LE CONTRÔLEUR AIGUILLEUR (La solution à ton problème)
        if (user.role === "Admin") {
          navigate("/admin");
        } else if (user.role === "Professor") {
          navigate("/dashboard");
        } else if (user.role === "Student") {
          navigate("/student-dashboard"); // 👈 REDIRECTION CORRIGÉE
        } else {
          alert("Rôle non reconnu.");
        }
      } else {
        // Fallback de sécurité si l'objet user manque
        alert("Connexion réussie mais profil incomplet.");
      }
    } catch (error) {
      alert("Identifiants incorrects ou problème de connexion au serveur.");
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4 text-white">
      <div className="bg-[#161b22] border border-gray-700 p-8 rounded-xl shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🛡️ Secure<span className="text-blue-500">Exam</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Zero-Trust Authentication Portal
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Email Institutionnel
            </label>
            <input
              type="email"
              className="w-full bg-[#0d1117] border border-gray-600 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@esaip.org"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              className="w-full bg-[#0d1117] border border-gray-600 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            S'authentifier
          </button>
        </form>
      </div>
    </div>
  );
}
