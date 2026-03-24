import { useState } from "react";
import useKeystrokeDynamics from "../hooks/useKeystrokeDynamics";
import api from "../api/axiosConfig";

export default function SecurityCheckpointModal({ onSuccess }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { handleKeyDown, handleKeyUp, getKeystrokeData, clearKeystrokeData } =
    useKeystrokeDynamics();

  const referenceSentence = "I confirm my identity.";

  const handleVerify = async () => {
    if (text !== referenceSentence) {
      setError("Please type the sentence exactly.");
      return;
    }

    setLoading(true);
    const events = getKeystrokeData();
    const user = JSON.parse(localStorage.getItem("userProfile"));

    try {
      await api.post("/Biometrics/verify", {
        studentEmail: user.email,
        events,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Biometric profile mismatch.");
      clearKeystrokeData();
      setText("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[999] flex items-center justify-center p-4">
      <div className="bg-[#161b22] border-2 border-red-600 p-10 rounded-3xl shadow-[0_0_60px_rgba(220,38,38,0.4)] max-w-lg w-full text-center">
        <h2 className="text-3xl font-bold text-red-500 mb-4">
          🚨 Identity Check
        </h2>
        <p className="text-gray-400 mb-6 italic">
          Zero-Trust Protocol: Please re-authenticate your typing signature.
        </p>

        <div className="bg-black/40 p-4 rounded-lg font-mono text-white mb-6 border border-gray-700 select-none">
          {referenceSentence}
        </div>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          disabled={loading}
          className="w-full bg-[#0d1117] border border-gray-600 rounded-xl p-4 text-white focus:border-red-500 outline-none text-center text-lg mb-4"
          placeholder="Start typing..."
          autoComplete="off"
        />

        {error && (
          <p className="text-red-400 font-bold mb-4 animate-pulse">{error}</p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || text.length < 5}
          className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50"
        >
          {loading ? "Analyzing Biometrics..." : "Verify & Unlock"}
        </button>
      </div>
    </div>
  );
}
