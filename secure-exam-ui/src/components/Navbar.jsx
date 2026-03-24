import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const userProfile = JSON.parse(localStorage.getItem("userProfile")) || {};

  const handleLogout = () => {
    localStorage.clear(); // Clear the session badge
    navigate("/"); // Return to the login page
  };

  return (
    <nav className="bg-[#161b22] border-b border-gray-800 px-6 py-4 flex justify-between items-center shadow-lg sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-blue-500">🛡️</span> SecureExam
        </h1>
        <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs font-mono border border-gray-700">
          Role: {userProfile.role || "Unknown"}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-sm text-gray-400 hidden md:block">
          Logged in as:{" "}
          <span className="text-white font-medium">{userProfile.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-red-900/50 hover:border-red-500"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
