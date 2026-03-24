import { useState, useEffect, useRef } from "react";
import api from "../api/axiosConfig";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "Student",
    cohort: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/Auth/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error loading users", err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/Auth/register", newUser);
      alert("User created and email sent successfully!");
      fetchUsers();
      setNewUser({ email: "", password: "", role: "Student", cohort: "" });
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Error during user creation.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await api.post("/Auth/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(res.data.message);
      fetchUsers();
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Error importing the CSV file.");
    } finally {
      setLoading(false);
      fileInputRef.current.value = ""; // Reset the input
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold border-b border-gray-800 pb-4 text-blue-500 underline decoration-blue-500/30">
          🛡️ Admin Control Center (Enterprise Provisioning)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Provisioning Tools */}
          <div className="space-y-6">
            {/* 1. Bulk Import (CSV) */}
            <div className="bg-[#161b22] border border-blue-900/50 p-6 rounded-xl shadow-xl">
              <h2 className="text-xl font-bold mb-2 text-blue-400">
                📂 Bulk Import (CSV)
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Required format:{" "}
                <code className="bg-black p-1 rounded">
                  Email, Role, Cohort
                </code>
              </p>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                id="csvUpload"
              />
              <label
                htmlFor="csvUpload"
                className={`w-full block text-center bg-blue-900/40 hover:bg-blue-800 border border-blue-600 border-dashed py-4 rounded cursor-pointer transition-all ${loading ? "opacity-50 pointer-events-none" : ""}`}
              >
                {loading ? "🔄 Processing..." : "Choose a CSV file and execute"}
              </label>
            </div>

            {/* 2. Manual Provisioning */}
            <div className="bg-[#161b22] border border-gray-700 p-6 rounded-xl shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-green-400">
                ➕ Manual Provisioning
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-[#0d1117] border border-gray-600 p-2 rounded text-white"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full bg-[#0d1117] border border-gray-600 p-2 rounded text-white"
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
                    placeholder="Cohort (e.g., Cyber-2026)"
                    className="w-full bg-[#0d1117] border border-gray-600 p-2 rounded text-white"
                    value={newUser.cohort}
                    onChange={(e) =>
                      setNewUser({ ...newUser, cohort: e.target.value })
                    }
                  />
                )}
                <button
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold transition-all disabled:opacity-50 text-white"
                >
                  {loading ? "Creating..." : "Execute Provisioning"}
                </button>
              </form>
            </div>
          </div>

          {/* User List (Active Directory Simulator) */}
          <div className="bg-[#161b22] border border-gray-700 p-6 rounded-xl shadow-xl overflow-hidden h-fit">
            <h2 className="text-xl font-bold mb-4 text-purple-400">
              👥 Active Directory Simulator
            </h2>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-400 border-b border-gray-800 sticky top-0 bg-[#161b22]">
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
                      <td className="py-2 text-gray-200">{u.email}</td>
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
