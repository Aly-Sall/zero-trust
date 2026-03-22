import { useState, useEffect } from "react";
import api from "../api/axiosConfig";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "Student",
    cohort: "",
  });

  // 1. Charger les utilisateurs au démarrage
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/Auth/users"); // Vérifie que ton endpoint API est bon
      setUsers(res.data);
    } catch (err) {
      console.error("Erreur chargement utilisateurs", err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/Auth/register", newUser);
      alert("Utilisateur créé !");
      fetchUsers();
      setNewUser({ email: "", password: "", role: "Student", cohort: "" });
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Erreur lors de la création.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold border-b border-gray-800 pb-4 text-blue-500 underline decoration-blue-500/30">
          🛡️ Admin Control Center (Provisioning)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulaire de création */}
          <div className="bg-[#161b22] border border-gray-700 p-6 rounded-xl shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-green-400">
              ➕ Manual Provisioning
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                className="w-full bg-[#0d1117] border border-gray-600 p-2 rounded"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                required
              />
              <input
                type="password"
                placeholder="Mot de passe"
                className="w-full bg-[#0d1117] border border-gray-600 p-2 rounded"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                required
              />
              <select
                className="w-full bg-[#0d1117] border border-gray-600 p-2 rounded text-white"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
              >
                <option value="Student">Student</option>
                <option value="Professor">Professor</option>
                <option value="Admin">Admin</option>
              </select>
              {newUser.role === "Student" && (
                <input
                  type="text"
                  placeholder="Cohorte (ex: Cyber-2026)"
                  className="w-full bg-[#0d1117] border border-gray-600 p-2 rounded"
                  value={newUser.cohort}
                  onChange={(e) =>
                    setNewUser({ ...newUser, cohort: e.target.value })
                  }
                />
              )}
              <button className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold transition-all">
                Execute Provisioning
              </button>
            </form>
          </div>

          {/* Liste des utilisateurs (Active Directory) */}
          <div className="bg-[#161b22] border border-gray-700 p-6 rounded-xl shadow-xl overflow-hidden">
            <h2 className="text-xl font-bold mb-4 text-purple-400">
              👥 Active Directory Simulator
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Role</th>
                    <th className="pb-2">Cohort</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="py-2">{u.email}</td>
                      <td className="py-2">
                        <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded-full text-xs">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2 text-gray-400">{u.cohort || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
