import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

export default function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/Auth/login", credentials);

      // 1. Save security token and identity
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userProfile", JSON.stringify(res.data.user));

      // 2. Automatic Routing (The Switchboard)
      const role = res.data.user.role;
      if (role === "Admin") {
        navigate("/admin-dashboard");
      } else if (role === "Professor") {
        navigate("/professor-dashboard");
      } else if (role === "Student") {
        navigate("/student-dashboard");
      } else {
        navigate("/"); // Default security fallback
      }
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Access denied. Invalid credentials or non-existent account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4 font-sans text-white">
      <div className="bg-[#161b22] border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* Small top border glow effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-green-500"></div>

        <div className="text-center mb-8 mt-2">
          <h1 className="text-3xl font-bold text-blue-500 mb-2 flex justify-center items-center gap-2">
            🛡️ SecureExam
          </h1>
          <p className="text-gray-400 text-sm">
            Zero-Trust Remote Assessment Platform
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Email Address (SSO)
            </label>
            <input
              type="email"
              required
              className="w-full bg-[#0d1117] border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="username@esaip.org"
              value={credentials.email}
              onChange={(e) =>
                setCredentials({ ...credentials, email: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full bg-[#0d1117] border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50 mt-4"
          >
            {loading ? "Encrypting & Connecting..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
